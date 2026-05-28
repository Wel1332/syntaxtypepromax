import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { authFetch } from "../../../shared/api/authFetch";
import { API_BASE } from "../../../shared/api/client";

const gradientText = {
  background: "linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  display: "inline-block",
};

export default function GalaxyChallengeList() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/challenges/galaxy`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setChallenges(data || []);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const toggleDesc = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -120,
          right: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, #C8456D 0%, transparent 70%)",
          opacity: isDark ? 0.28 : 0.18,
          filter: "blur(24px)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -160,
          left: -160,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, #FFC700 0%, transparent 70%)",
          opacity: isDark ? 0.2 : 0.14,
          filter: "blur(28px)",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, py: { xs: 5, md: 8 } }}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 4 }}
        >
          <Stack spacing={1}>
            <Typography
              variant="overline"
              sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}
            >
              Galaxy Mode
            </Typography>
            <Typography variant="h3" sx={{ color: "text.primary", fontWeight: 700 }}>
              Pick a <Box component="span" sx={gradientText}>challenge</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 540 }}>
              Type fast to vaporize enemies. Defeat 3 bosses to complete the mission.
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              component={RouterLink}
              to="/leaderboard"
              variant="outlined"
              color="warning"
              startIcon={<EmojiEventsIcon />}
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              Leaderboard
            </Button>
            <Tooltip title="Refresh list">
              <IconButton
                onClick={fetchChallenges}
                sx={{
                  border: "2px solid",
                  borderColor: "primary.main",
                  color: "primary.main",
                  borderRadius: 2,
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Loading challenges…
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card sx={{ borderColor: "error.main" }}>
            <CardContent sx={{ py: 5, textAlign: "center" }}>
              <ErrorOutlineIcon sx={{ fontSize: 40, color: "error.main", mb: 1 }} />
              <Typography variant="h6" sx={{ color: "error.main", mb: 1 }}>
                Couldn't load challenges
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                {error}
              </Typography>
              <Button variant="contained" color="primary" onClick={fetchChallenges}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && challenges.length === 0 && (
          <Card>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <RocketLaunchIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
              <Typography variant="h6" sx={{ color: "text.primary", mb: 0.5 }}>
                No challenges yet
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Ask your teacher to publish a Galaxy challenge.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* List */}
        {!loading && !error && challenges.length > 0 && (
          <Stack spacing={2.5}>
            {challenges.map((c) => {
              const desc = c.description || "";
              const isLong = desc.length > 220;
              const isExpanded = !!expanded[c.id];
              const shown = isLong && !isExpanded ? desc.slice(0, 220) + "…" : desc;

              return (
                <Card
                  key={c.id}
                  sx={{
                    transition: "transform 200ms, box-shadow 200ms",
                    "&:hover": {
                      transform: "translate(-3px, -3px)",
                      boxShadow: theme.shadows[6],
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "rgba(200,69,109,0.12)",
                              color: "primary.main",
                              border: "2px solid",
                              borderColor: "primary.main",
                            }}
                          >
                            <RocketLaunchIcon />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {c.title || `Challenge #${c.id}`}
                            </Typography>
                            <Chip
                              label="GALAXY"
                              size="small"
                              sx={{
                                mt: 0.5,
                                bgcolor: "rgba(255,199,0,0.15)",
                                color: "warning.main",
                                fontWeight: 700,
                                letterSpacing: 1,
                                border: "1px solid",
                                borderColor: "warning.main",
                              }}
                            />
                          </Box>
                        </Stack>
                      </Stack>

                      {desc && (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", lineHeight: 1.7, whiteSpace: "pre-wrap" }}
                          >
                            {shown}
                          </Typography>
                          {isLong && (
                            <Button
                              size="small"
                              onClick={() => toggleDesc(c.id)}
                              sx={{ mt: 0.5, px: 0, textTransform: "none" }}
                            >
                              {isExpanded ? "Show less" : "Read more"}
                            </Button>
                          )}
                        </Box>
                      )}

                      <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Button
                          component={RouterLink}
                          to={`/play/galaxy/${c.id}`}
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrowIcon />}
                          sx={{ fontWeight: 700, letterSpacing: 1 }}
                        >
                          Play
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/leaderboard"
                          variant="outlined"
                          color="warning"
                          startIcon={<EmojiEventsIcon />}
                          sx={{ fontWeight: 700, letterSpacing: 1 }}
                        >
                          Scores
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
