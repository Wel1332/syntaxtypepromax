import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { apiUrl } from "../../../shared/api/client";
import { getAuthToken, setAuthToken } from "../../../shared/auth/AuthUtils";
import {
  Box,
  Container,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Button,
  Tooltip,
  Chip,
  Stack,
  TextField,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const GAME_OPTIONS = [
  { value: "", label: "All Games" },
  { value: "TYPING_TESTS", label: "Typing Test" },
  { value: "FALLING_WORDS", label: "Falling Typing" },
  { value: "GALAXY", label: "Galaxy Game" },
  { value: "GRID", label: "Grid Game" },
  { value: "BOOKWORM", label: "Bookworm" },
  { value: "CROSSWORD", label: "Crossword" },
  { value: "FOUR_PICS", label: "Four Pics" },
  { value: "CODE_CHALLENGES", label: "Code Challenges" },
  { value: "MAP", label: "Map Game" },
  { value: "SYNTAX_SAVER", label: "Syntax Sniper" },
  { value: "SYNTAX_SAVER_LESSON", label: "Syntax Saver Lesson" },
  { value: "CHALLENGES", label: "Challenges" },
];

// Only typing games have a meaningful WPM / combined score. Every other game is
// ranked by raw score, so the WPM/Accuracy/Combined metric toggle doesn't apply.
const TYPING_GAMES = new Set(["TYPING_TESTS", "FALLING_WORDS"]);

// Medal tones are semantic (gold/silver/bronze) and stay constant across
// light/dark — only the brand palette (primary/secondary) switches with mode.
const RANK_META = (theme) => ({
  1: { label: "1ST", bg: theme.palette.warning.main, fg: "#1A1A2E", height: 132 },
  2: { label: "2ND", bg: "#C0C6D2", fg: "#1A1A2E", height: 100 },
  3: { label: "3RD", bg: "#CD7F32", fg: "#FFFFFF", height: 76 },
});
// Visual left-to-right order of the podium: 2nd, 1st, 3rd.
const PODIUM_ORDER = [2, 1, 3];

// A small pixel-corner crown, built from a clip-path rather than an emoji —
// sits above the 1st-place pedestal only, marking the top spot.
const Crown = ({ color }) => (
  <Box
    aria-hidden="true"
    sx={{
      width: 34,
      height: 18,
      mx: "auto",
      mb: 0.5,
      bgcolor: color,
      clipPath: "polygon(0% 100%, 8% 35%, 27% 65%, 50% 15%, 73% 65%, 92% 35%, 100% 100%)",
    }}
  />
);

// Reusable "HUD" corner brackets — the one repeated signature element, applied
// only to the two panels that actually display ranking data (podium + table),
// so it reads as "this is a screen" rather than decorating every card.
const CornerFrame = ({ theme, children, sx }) => {
  const c = theme.palette.primary.main;
  const corner = (pos) => ({
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: c,
    borderStyle: "solid",
    borderWidth: 0,
    ...pos,
  });
  return (
    <Box sx={{ position: "relative", pt: 1.5, ...sx }}>
      <Box sx={corner({ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 })} />
      <Box sx={corner({ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 })} />
      <Box sx={corner({ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 })} />
      <Box sx={corner({ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 })} />
      {children}
    </Box>
  );
};

// Section eyebrow label — reused above both the podium and the table so the
// two "screens" read as a matched pair instead of the podium looking labeled
// and the table looking bare.
const SectionLabel = ({ pixelFont, children }) => (
  <Typography
    sx={{ fontFamily: pixelFont, fontSize: "1rem", letterSpacing: "0.06em", textAlign: "center", mb: 2.5, color: "text.primary" }}
  >
    {children}
  </Typography>
);

// Deterministic two-tone avatar so every username gets a consistent initial
// badge across renders/sessions without needing real profile images.
const PlayerAvatar = ({ theme, username, size = 28 }) => {
  const hash = username.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const isPrimary = hash % 2 === 0;
  const bg = isPrimary ? theme.palette.primary.main : theme.palette.warning.main;
  const fg = isPrimary ? theme.palette.primary.contrastText : "#1A1A2E";
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {username.charAt(0).toUpperCase()}
    </Box>
  );
};

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const rankMeta = RANK_META(theme);
  const isDark = theme.palette.mode === "dark";

  // Retro card border/shadow — same values the theme's global MuiCard override
  // uses, so anything built by hand here (podium pillars) matches cards MUI
  // renders automatically elsewhere in the app.
  const cardBorder = isDark ? "2px solid #FFC700" : "2px solid #1A1A2E";
  const cardShadow = isDark ? "6px 6px 0 0 rgba(255, 199, 0, 0.35)" : "6px 6px 0 0 #1A1A2E";
  const pixelFont = theme.typography.h4.fontFamily;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("combined");
  const [bestRecent, setBestRecent] = useState(() => {
    const stored = localStorage.getItem("leaderboard_best_recent");
    return stored ? stored : "best";
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");

  const metricTimeoutRef = React.useRef(null);
  const recentTimeoutRef = React.useRef(null);
  const rowRefs = useRef({});

  const decodeCurrentUser = useCallback(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded.sub || decoded.username || null);
      } catch (err) {
        console.error("Failed to decode JWT:", err);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setAuthToken(getAuthToken());

      let url;
      if (selectedGame) {
        url = apiUrl(`/api/leaderboards/game/${selectedGame}?metric=${selectedMetric}`);
      } else {
        url = apiUrl(`/api/leaderboards/global?metric=${selectedMetric}`);
      }

      if (bestRecent === "recent") {
        url += (url.includes("?") ? "&" : "?") + "limit=10";
      }

      const response = await axios.get(url);
      setEntries(response.data || []);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError(err.response?.data?.message || err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedMetric, bestRecent]);

  useEffect(() => {
    setAuthToken(getAuthToken());
    decodeCurrentUser();
  }, [decodeCurrentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        fetchLeaderboard();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, fetchLeaderboard]);

  const handleMetricChange = (event, newMetric) => {
    if (!newMetric) return;
    setSelectedMetric(newMetric);
    if (metricTimeoutRef.current) clearTimeout(metricTimeoutRef.current);
    metricTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
  };

  const handleBestRecentChange = (event) => {
    const newValue = event.target.checked ? "recent" : "best";
    setBestRecent(newValue);
    localStorage.setItem("leaderboard_best_recent", newValue);
    if (recentTimeoutRef.current) clearTimeout(recentTimeoutRef.current);
    recentTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
  };

  const handleGameChange = (event) => setSelectedGame(event.target.value);
  const handleRefresh = () => fetchLeaderboard();

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isCurrentUser = (username) => currentUser && username === currentUser;
  const isLoggedIn = !!getAuthToken();
  const isScoreBasedGame = !!selectedGame && !TYPING_GAMES.has(selectedGame);

  const getDisplayScore = (entry) => {
    if (entry.score == null) return null;
    return isScoreBasedGame ? Math.round(entry.score) : Number(entry.score.toFixed(2));
  };

  const renderRankBadge = (rank) => {
    const meta = rankMeta[rank];
    if (!meta) {
      return (
        <Typography sx={{ fontFamily: "Roboto, sans-serif", fontWeight: 700, color: "text.secondary" }}>
          #{rank}
        </Typography>
      );
    }
    return (
      <Chip
        label={meta.label}
        size="small"
        sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, letterSpacing: "0.04em", borderRadius: "6px" }}
      />
    );
  };

  // Precompute a stable display rank once, before any filtering, so the
  // search box narrowing the table can never renumber anyone.
  const rankedEntries = entries.map((e, i) => ({ ...e, displayRank: e.rank || i + 1 }));
  const topThree = rankedEntries.slice(0, 3);
  const maxScore = Math.max(...rankedEntries.map((e) => e.score || 0), 1);
  const showPodium = !loading && !error && topThree.length === 3;

  const filteredEntries = rankedEntries.filter((e) =>
    e.username.toLowerCase().includes(search.trim().toLowerCase())
  );

  const currentGameLabel = GAME_OPTIONS.find((g) => g.value === selectedGame)?.label || "All Games";
  const currentUserEntry = rankedEntries.find((e) => isCurrentUser(e.username));

  const scrollToCurrentUser = () => {
    const node = currentUserEntry && rowRefs.current[currentUserEntry.username];
    if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Shared retro treatment for the loading/error/empty panels so they read as
  // the same design system instead of a default MUI Alert dropped in.
  const statePanelSx = {
    border: cardBorder,
    borderRadius: "12px",
    bgcolor: "background.paper",
    p: 4,
    textAlign: "center",
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 2, position: "relative", overflow: "hidden" }}>
      {/* Faint CRT scanline overlay — decorative only, tuned much lighter on
          light mode so it doesn't muddy the cream background. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(to bottom, ${
            isDark ? "rgba(0,0,0,0.18)" : "rgba(26,26,46,0.04)"
          } 0px, ${isDark ? "rgba(0,0,0,0.18)" : "rgba(26,26,46,0.04)"} 1px, transparent 2px, transparent 4px)`,
          "@media (prefers-reduced-motion: no-preference)": { animation: "st-scan 9s linear infinite" },
          "@keyframes st-scan": { from: { backgroundPositionY: "0px" }, to: { backgroundPositionY: "240px" } },
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* Guest Banner */}
        {!isLoggedIn && (
          <Card
            sx={{
              mb: 3,
              p: 2,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              border: "none",
              boxShadow: "none",
            }}
          >
            <Typography variant="body1">Want to see your name on the leaderboard?</Typography>
            <Button component={Link} to="/register" variant="contained" color="warning" sx={{ textTransform: "none" }}>
              Register
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{ color: "inherit", borderColor: "currentColor", textTransform: "none" }}
            >
              Login
            </Button>
          </Card>
        )}

        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.5, color: "text.primary" }}>
              Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentGameLabel} • {bestRecent === "recent" ? "Last 10 games" : "All-time"}
            </Typography>
          </Box>

          {/* Small decorative pixel-dot cluster, hidden on narrow screens so it
              never competes for space with the header text. */}
          <Box
            aria-hidden="true"
            sx={{ display: { xs: "none", sm: "grid" }, gridTemplateColumns: "repeat(3, 8px)", gap: "4px", mt: 1 }}
          >
            {[
              theme.palette.primary.main, theme.palette.warning.main, theme.palette.text.primary,
              theme.palette.warning.main, theme.palette.text.primary, theme.palette.primary.main,
              theme.palette.text.primary, theme.palette.primary.main, theme.palette.warning.main,
            ].map((c, i) => (
              <Box key={i} sx={{ width: 8, height: 8, bgcolor: alpha(c, 0.55) }} />
            ))}
          </Box>
        </Stack>

        {/* Scrolling ticker — kept in body font (not Pixelify): the theme's own
            note flags pixel type as unreadable at small/moving sizes. */}
        <Box
          aria-hidden="true"
          sx={{ overflow: "hidden", border: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper", mb: 3, mt: 1.5 }}
        >
          <Box
            sx={{
              display: "inline-block",
              whiteSpace: "nowrap",
              py: 0.75,
              fontFamily: "Roboto, sans-serif",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              color: "primary.main",
              "@media (prefers-reduced-motion: no-preference)": { animation: "st-marquee 16s linear infinite" },
              "@keyframes st-marquee": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
            }}
          >
            HIGH SCORES • KEEP TYPING • CHASE THE TOP SPOT • HIGH SCORES • KEEP TYPING • CHASE THE TOP SPOT •
          </Box>
        </Box>

        {/* Control panel — filters + sort grouped in one bordered card so they
            read as a single console, arcade-cabinet style. */}
        <Card sx={{ p: 2.5, mb: 4 }}>
          <Box sx={{ mb: 2.5 }}>
            {isScoreBasedGame ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Sort by: <strong>SCORE</strong>
              </Typography>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                  Sort by: <strong>{selectedMetric.toUpperCase()}</strong>
                </Typography>
                <Tooltip title="Formula: WPM × (Accuracy/100) × 1.5 if accuracy > 95%" arrow>
                  <ToggleButtonGroup
                    value={selectedMetric}
                    exclusive
                    onChange={handleMetricChange}
                    aria-label="metric selection"
                    sx={{ "& .MuiToggleButton-root": { textTransform: "none", px: 3, py: 1, fontWeight: 700 } }}
                  >
                    <ToggleButton value="wpm">WPM</ToggleButton>
                    <ToggleButton value="accuracy">Accuracy</ToggleButton>
                    <ToggleButton value="combined">Combined</ToggleButton>
                  </ToggleButtonGroup>
                </Tooltip>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="game-filter-label">Game</InputLabel>
              <Select labelId="game-filter-label" value={selectedGame} label="Game" onChange={handleGameChange}>
                {GAME_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 170 }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color={bestRecent === "best" ? "primary" : "text.secondary"}>
                All-time
              </Typography>
              <FormControlLabel
                control={<Switch checked={bestRecent === "recent"} onChange={handleBestRecentChange} color="primary" />}
                label=""
              />
              <Typography variant="body2" color={bestRecent === "recent" ? "primary" : "text.secondary"}>
                Recent {bestRecent === "recent" && "(10 games)"}
              </Typography>
            </Box>

            <Button variant="outlined" onClick={handleRefresh} disabled={loading} size="small">
              Refresh
            </Button>

            {currentUserEntry && (
              <Chip
                sx={{ ml: "auto", fontWeight: 700, cursor: "pointer" }}
                color="primary"
                variant="outlined"
                onClick={scrollToCurrentUser}
                label={`Your rank: #${currentUserEntry.displayRank}`}
              />
            )}
          </Box>
        </Card>

        {/* Loading State */}
        {loading && (
          <Box sx={statePanelSx}>
            <CircularProgress sx={{ mb: 1 }} />
            <Typography color="text.secondary">Loading scores...</Typography>
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Box sx={{ ...statePanelSx, borderColor: "error.main", mb: 2 }}>
            <Typography color="error.main" sx={{ mb: 1.5 }}>
              {error} — auto-retrying in 5 seconds...
            </Typography>
            <Button variant="outlined" color="error" size="small" onClick={handleRefresh}>
              Retry now
            </Button>
          </Box>
        )}

        {/* Empty State — three faint outlined squares stand in for empty
            podium slots, echoing the pixel-square motif used in the header. */}
        {!loading && !error && entries.length === 0 && (
          <Box sx={statePanelSx}>
            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mb: 2 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 28,
                    height: 28,
                    border: `2px dashed ${alpha(theme.palette.text.primary, 0.3)}`,
                  }}
                />
              ))}
            </Stack>
            <Typography color="text.secondary">No scores yet. Play a game to get on the board!</Typography>
          </Box>
        )}

        {/* Podium (top 3) — the first HUD-framed "screen" */}
        {showPodium && (
          <CornerFrame theme={theme} sx={{ mb: 4, p: 2 }}>
            <SectionLabel pixelFont={pixelFont}>TOP PLAYERS</SectionLabel>
            <Stack direction="row" spacing={2.5} alignItems="flex-end" justifyContent="center" flexWrap="wrap">
              {PODIUM_ORDER.map((rankNum) => {
                const entry = topThree[rankNum - 1];
                const meta = rankMeta[rankNum];
                const score = getDisplayScore(entry);
                const isFirst = rankNum === 1;
                return (
                  <Box key={rankNum} sx={{ width: isFirst ? 168 : 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {isFirst && <Crown color={theme.palette.warning.main} />}
                    <Card
                      sx={{
                        width: "100%",
                        p: 1.5,
                        textAlign: "center",
                        mb: "-2px",
                        borderBottom: "none",
                        borderRadius: "12px 12px 0 0",
                        ...(isFirst && { boxShadow: `${cardShadow}, 0 0 22px ${alpha(theme.palette.warning.main, 0.45)}` }),
                      }}
                    >
                      <Chip label={meta.label} size="small" sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, mb: 1 }} />
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <PlayerAvatar theme={theme} username={entry.username} size={24} />
                        <Typography sx={{ fontWeight: 700, wordBreak: "break-word" }}>{entry.username}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", mt: 0.5 }}>
                        {isScoreBasedGame ? `${score} pts` : `${entry.wpm || "—"} WPM`}
                      </Typography>
                    </Card>
                    <Box
                      sx={{
                        width: "100%",
                        height: meta.height,
                        border: cardBorder,
                        borderTop: "none",
                        borderRadius: "0 0 12px 12px",
                        // Colored fill keyed to the medal (gold/silver/bronze),
                        // fading toward the base — reads as a filled bar rather
                        // than an empty hatched box. Hatch texture layered on
                        // top for a bit of grain, same as before.
                        backgroundImage: `repeating-linear-gradient(45deg, ${alpha(
                          "#000000",
                          0.1
                        )}, ${alpha("#000000", 0.1)} 8px, transparent 8px, transparent 16px), linear-gradient(180deg, ${alpha(
                          meta.bg,
                          0.95
                        )} 0%, ${alpha(meta.bg, 0.55)} 100%)`,
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </CornerFrame>
        )}

        {/* Leaderboard Table — second HUD-framed "screen" */}
        {!loading && !error && entries.length > 0 && (
          <CornerFrame theme={theme} sx={{ p: 0.5 }}>
            <SectionLabel pixelFont={pixelFont}>FULL RANKINGS</SectionLabel>
            <TableContainer
              component={Card}
              sx={{ border: cardBorder, boxShadow: cardShadow, maxHeight: 560, overflow: "auto" }}
            >
              <Table sx={{ minWidth: 700 }} aria-label="leaderboard table" stickyHeader>
                <TableHead>
                  <TableRow sx={{ "& .MuiTableCell-root": { bgcolor: alpha(theme.palette.primary.main, isDark ? 0.3 : 0.1) } }}>
                    <TableCell sx={{ fontWeight: 700 }}>Rank</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">WPM</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Accuracy</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {isScoreBasedGame ? "Score" : "Combined Score"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Game</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No players match "{search}"
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry, index) => {
                      const rank = entry.displayRank;
                      const isYou = isCurrentUser(entry.username);
                      const score = getDisplayScore(entry);
                      const barPct = entry.score != null ? Math.min(100, (entry.score / maxScore) * 100) : 0;
                      const zebra = index % 2 === 1 ? alpha(theme.palette.text.primary, isDark ? 0.035 : 0.02) : "transparent";
                      const staggerDelay = Math.min(index, 12) * 30;

                      return (
                        <TableRow
                          key={`${entry.username}-${rank}`}
                          ref={(el) => {
                            rowRefs.current[entry.username] = el;
                          }}
                          sx={{
                            bgcolor: isYou ? alpha(theme.palette.primary.main, isDark ? 0.28 : 0.12) : zebra,
                            outline: isYou ? `2px solid ${theme.palette.primary.main}` : "none",
                            outlineOffset: "-2px",
                            position: "relative",
                            "@media (prefers-reduced-motion: no-preference)": {
                              animation: `st-rowin 0.35s ease both`,
                              animationDelay: `${staggerDelay}ms`,
                            },
                            "@keyframes st-rowin": {
                              from: { opacity: 0, transform: "translateY(4px)" },
                              to: { opacity: 1, transform: "translateY(0)" },
                            },
                            "&:hover": {
                              bgcolor: isYou
                                ? alpha(theme.palette.primary.main, isDark ? 0.35 : 0.18)
                                : theme.palette.action.hover,
                            },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              {isYou && (
                                <Box
                                  aria-hidden="true"
                                  sx={{
                                    width: 0,
                                    height: 0,
                                    borderTop: "5px solid transparent",
                                    borderBottom: "5px solid transparent",
                                    borderLeft: `7px solid ${theme.palette.primary.main}`,
                                  }}
                                />
                              )}
                              {renderRankBadge(rank)}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PlayerAvatar theme={theme} username={entry.username} />
                              <Typography component="span" sx={{ fontWeight: 700 }}>
                                {entry.username}
                              </Typography>
                              {isYou && (
                                <Typography component="span" sx={{ fontSize: "0.75rem", color: "primary.main", fontWeight: 700 }}>
                                  (You)
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {entry.wpm || "—"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {entry.accuracy != null ? `${entry.accuracy.toFixed(1)}%` : "—"}
                          </TableCell>
                          <TableCell align="right">
                            {score != null ? (
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{score}</Typography>
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 6,
                                    borderRadius: "3px",
                                    bgcolor: alpha(theme.palette.text.primary, 0.1),
                                    border: `1px solid ${theme.palette.divider}`,
                                    overflow: "hidden",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: "100%",
                                      width: `${barPct}%`,
                                      borderRadius: "3px",
                                      backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.warning.main})`,
                                    }}
                                  />
                                </Box>
                              </Stack>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{entry.gameName || "—"}</TableCell>
                          <TableCell>{formatDate(entry.dateAchieved)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CornerFrame>
        )}
      </Container>
    </Box>
  );
};

export default LeaderboardPage;