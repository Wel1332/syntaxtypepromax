import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { apiUrl } from "../../../shared/api/client";
import { getAuthToken, setAuthToken } from "../../../shared/auth/AuthUtils";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  Container,
  AppBar,
  Toolbar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

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
  { value: "SYNTAX_SAVER", label: "Syntax Saver" },
  { value: "CHALLENGES", label: "Challenges" },
];

// Only typing games have a meaningful WPM / combined score. Every other game is
// ranked by raw score, so the WPM/Accuracy/Combined metric toggle doesn't apply.
const TYPING_GAMES = new Set(["TYPING_TESTS", "FALLING_WORDS"]);

const LeaderboardPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedMetric, setSelectedMetric] = useState("combined");
  const [bestRecent, setBestRecent] = useState(() => {
    // Load from localStorage, default to 'best' (all-time)
    const stored = localStorage.getItem('leaderboard_best_recent');
    return stored ? stored : 'best';
  });
  const [currentUser, setCurrentUser] = useState(null);
  
  // Debounce refs
  const metricTimeoutRef = React.useRef(null);
  const recentTimeoutRef = React.useRef(null);

  // Decode JWT to get current username
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

  // Fetch leaderboard data
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
      
      // Add recent filter if not best (all-time)
      if (bestRecent === 'recent') {
        url += (url.includes('?') ? '&' : '?') + 'limit=10';
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

  // Initial load and auth setup
  useEffect(() => {
    setAuthToken(getAuthToken());
    decodeCurrentUser();
  }, [decodeCurrentUser]);

  // Fetch on filter changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-retry on error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        fetchLeaderboard();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, fetchLeaderboard]);

  // Handle metric change with debounce (300ms)
  const handleMetricChange = (event, newMetric) => {
    if (!newMetric) return;
    
    setSelectedMetric(newMetric);
    
    if (metricTimeoutRef.current) {
      clearTimeout(metricTimeoutRef.current);
    }
    
    metricTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
  };

  // Handle best/recent toggle with debounce (300ms)
  const handleBestRecentChange = (event) => {
    const newValue = event.target.checked ? 'recent' : 'best';
    setBestRecent(newValue);
    localStorage.setItem('leaderboard_best_recent', newValue);
    
    if (recentTimeoutRef.current) {
      clearTimeout(recentTimeoutRef.current);
    }
    
    recentTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 300);
  };

  // Handle game filter change
  const handleGameChange = (event) => {
    setSelectedGame(event.target.value);
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchLeaderboard();
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get medal emoji for top 3
  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  // Check if row is current user
  const isCurrentUser = (username) => {
    return currentUser && username === currentUser;
  };

  const isLoggedIn = !!getAuthToken();

  // Score-based games are ranked by raw score; the metric toggle is hidden and
  // the score column is labelled "Score" rather than "Combined Score".
  const isScoreBasedGame = !!selectedGame && !TYPING_GAMES.has(selectedGame);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pt: 2 }}>
      <Container maxWidth="lg">
        {/* Guest Banner */}
        {!isLoggedIn && (
          <AppBar
            position="sticky"
            sx={{
              backgroundColor: "#1976d2",
              mb: 3,
              borderRadius: 1,
            }}
          >
            <Toolbar sx={{ justifyContent: "center", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "white" }}>
                Want to see your name on the leaderboard?
              </Typography>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                color="warning"
                sx={{ textTransform: "none" }}
              >
                Register
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{ color: "white", borderColor: "white", textTransform: "none" }}
              >
                Login
              </Button>
            </Toolbar>
          </AppBar>
        )}

        {/* Header */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 3, fontWeight: "bold", color: "text.primary" }}
        >
          Leaderboard
        </Typography>

        {/* Metric Toggle Section — only for typing/global views. Score-based
            games are always ranked by raw score, so the toggle is hidden. */}
        <Box sx={{ mb: 3 }}>
          {isScoreBasedGame ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Sort by: <strong>SCORE</strong>
            </Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                Sort by: <strong>{selectedMetric.toUpperCase()}</strong>
              </Typography>
              <Tooltip
                title="Formula: WPM × (Accuracy/100) × 1.5 if accuracy > 95%"
                arrow
              >
                <ToggleButtonGroup
                  value={selectedMetric}
                  exclusive
                  onChange={handleMetricChange}
                  aria-label="metric selection"
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      px: 3,
                      py: 1,
                    },
                  }}
                >
                  <ToggleButton value="wpm">WPM</ToggleButton>
                  <ToggleButton value="accuracy">Accuracy</ToggleButton>
                  <ToggleButton value="combined">Combined</ToggleButton>
                </ToggleButtonGroup>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Filters Row */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
            alignItems: "center",
          }}
        >
          {/* Game Filter */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="game-filter-label">Game</InputLabel>
            <Select
              labelId="game-filter-label"
              value={selectedGame}
              label="Game"
              onChange={handleGameChange}
            >
              {GAME_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Best/Recent Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color={bestRecent === "best" ? "primary" : "text.secondary"}>
              All-time
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={bestRecent === "recent"}
                  onChange={handleBestRecentChange}
                  color="primary"
                />
              }
              label=""
            />
            <Typography variant="body2" color={bestRecent === "recent" ? "primary" : "text.secondary"}>
              Recent {bestRecent === "recent" && "(10 games)"}
            </Typography>
          </Box>

          {/* Refresh Button */}
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {error} — Auto-retrying in 5 seconds...
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No scores yet. Play a game to get on the board! 🎮
          </Alert>
        )}

        {/* Leaderboard Table */}
        {!loading && !error && entries.length > 0 && (
          <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 650 }} aria-label="leaderboard table">
              <TableHead sx={{ backgroundColor: "#1976d2" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rank</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Username</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">WPM</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">Accuracy</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }} align="right">{isScoreBasedGame ? "Score" : "Combined Score"}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Game</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry, index) => {
                  const rank = entry.rank || index + 1;
                  const isCurrentUserRow = isCurrentUser(entry.username);
                  
                  return (
                    <TableRow
                      key={`${entry.username}-${rank}`}
                      sx={(theme) => {
                        const tint = theme.palette.mode === "dark" ? 0.28 : 0.12;
                        return {
                          backgroundColor: isCurrentUserRow
                            ? alpha(theme.palette.primary.main, tint)
                            : "inherit",
                          border: isCurrentUserRow
                            ? `2px solid ${theme.palette.primary.main}`
                            : "none",
                          "&:hover": {
                            backgroundColor: isCurrentUserRow
                              ? alpha(theme.palette.primary.main, tint + 0.1)
                              : theme.palette.action.hover,
                          },
                        };
                      }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {getMedalEmoji(rank)}
                      </TableCell>
                      <TableCell>
                        {entry.username}
                        {isCurrentUserRow && (
                          <Typography
                            component="span"
                            sx={{
                              ml: 1,
                              fontSize: "0.75rem",
                              color: "primary.main",
                              fontWeight: "bold",
                            }}
                          >
                            (You)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{entry.wpm || "—"}</TableCell>
                      <TableCell align="right">
                        {entry.accuracy != null ? `${entry.accuracy.toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell align="right">
                        {entry.score != null
                          ? (isScoreBasedGame ? Math.round(entry.score) : entry.score.toFixed(2))
                          : "—"}
                      </TableCell>
                      <TableCell>{entry.gameName || "—"}</TableCell>
                      <TableCell>{formatDate(entry.dateAchieved)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
};

export default LeaderboardPage;
