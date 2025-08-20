import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import problems from './problems';
import ProblemEditor from "./ProblemEditor";
// import QuestionUI from './QuestionUI'; // Add this import
import { submitCode, getSubmissionResult } from "./services/judgeApi";

import {
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Fade,
  Grow,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Avatar,
  InputBase,
  Paper,
  Tooltip,
  Divider,
  Modal,
  Grid,
  Stack
} from "@mui/material";
import {
  Search as SearchIcon,
  Code as CodeIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  Logout as LogoutIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  EmojiEvents as EmojiEventsIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";

function App({ darkMode, toggleDarkMode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [user, setUser] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [userCodes, setUserCodes] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [submitScore, setSubmitScore] = useState(null);
  const [runningTests, setRunningTests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problemPoints, setProblemPoints] = useState({});
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Profile Data: streak, accuracy, etc.
  const [profileData, setProfileData] = useState({
    solvedProblems: {},
    streak: 0,
    accuracy: 0,
    totalAttempts: 0,
    successfulSubmissions: 0,
    topicsSolved: {},
    joinDate: new Date().toISOString(),
    lastActive: new Date().toISOString()
  });

  // Load username/profile data from localStorage
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    setUserName(localStorage.getItem("cj_username") || "");
    const savedProfile = localStorage.getItem("cj_profile_data");
    if (savedProfile) setProfileData(JSON.parse(savedProfile));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem("cj_username");
      setUserName(stored && stored.trim().length > 0
        ? stored.trim()
        : user.email.split("@")[0]);
    }
  }, [user]);

  // Persist profile data in localStorage
  useEffect(() => {
    localStorage.setItem("cj_profile_data", JSON.stringify(profileData));
  }, [profileData]);

  const handleCodeChange = (problemId, code) => {
    setUserCodes((prev) => ({ ...prev, [problemId]: code }));
  };

  async function runVisibleTestCases(problemId) {
    if (!selectedProblem || !selectedProblem.testCases) return;
    setRunningTests(true);
    setShowProgress(true);
    setTestResults([]);
    setSubmitScore(null);
    const code = userCodes[problemId];
    const languageId = 54;
    const results = [];

    for (const tc of selectedProblem.testCases) {
      try {
        const { token } = await submitCode({
          sourceCode: code,
          languageId,
          stdin: tc.input
        });
        let result, pollCount = 0;
        do {
          await new Promise((r) => setTimeout(r, 1200));
          result = await getSubmissionResult(token);
          if (++pollCount > 10) throw new Error("Timeout");
        } while (result.status?.id !== 3);
        const stdOut = result.stdout ? atob(result.stdout) : '';
        const pass = stdOut.trim() === tc.expectedOutput.trim();
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: stdOut,
          pass
        });
      } catch (e) {
        results.push({
          input: tc.input,
          expected: tc.expectedOutput,
          actual: '',
          pass: false,
          error: e.message
        });
      }
    }
    setTestResults(results);
    setRunningTests(false);
    setShowProgress(false);
  }

  async function handleSubmit(problemId) {
    setSubmitting(true);
    setShowProgress(true);
    setSubmitScore(null);

    // Track attempt in profile stats
    setProfileData(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      lastActive: new Date().toISOString()
    }));

    const code = userCodes[problemId];
    const languageId = 54;
    let passCount = 0, totalCount = 0;

    for (const tc of selectedProblem.testCases || []) {
      totalCount++;
      try {
        const { token } = await submitCode({
          sourceCode: code,
          languageId,
          stdin: tc.input
        });
        let result, pollCount = 0;
        do {
          await new Promise((r) => setTimeout(r, 1200));
          result = await getSubmissionResult(token);
          if (++pollCount > 10) throw new Error("Timeout");
        } while (result.status?.id !== 3);
        const stdOut = result.stdout ? atob(result.stdout) : '';
        if (stdOut.trim() === tc.expectedOutput.trim()) passCount++;
      } catch (e) {}
    }
    for (const tc of selectedProblem.hiddenTestCases || []) {
      totalCount++;
      try {
        const { token } = await submitCode({
          sourceCode: code,
          languageId,
          stdin: tc.input
        });
        let result, pollCount = 0;
        do {
          await new Promise((r) => setTimeout(r, 1200));
          result = await getSubmissionResult(token);
          if (++pollCount > 10) throw new Error("Timeout");
        } while (result.status?.id !== 3);
        const stdOut = result.stdout ? atob(result.stdout) : '';
        if (stdOut.trim() === tc.expectedOutput.trim()) passCount++;
      } catch (e) {}
    }

    setSubmitScore({ correct: passCount, total: totalCount, allPassed: passCount === totalCount });

    if (passCount === totalCount && !problemPoints[problemId]) {
      setProblemPoints(prev => ({ ...prev, [problemId]: true }));
      // Track successful submissions and streak
      setProfileData(prev => ({
        ...prev,
        successfulSubmissions: prev.successfulSubmissions + 1,
        streak: prev.streak + 1 // Basic increment, you could make this smarter for calendar days
      }));
    }

    setSubmitting(false);
    setShowProgress(false);
  }

  const totalPoints = Object.keys(problemPoints).length;

  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  // --- REDESIGNED PROFILE MODAL COMPONENT ---
  const ProfileModal = () => {
    const solvedCount = Object.keys(problemPoints).length;
    const easyCount = problems.filter(p => problemPoints[p.id] && p.difficulty === "Easy").length;
    const mediumCount = problems.filter(p => problemPoints[p.id] && p.difficulty === "Medium").length;
    const hardCount = problems.filter(p => problemPoints[p.id] && p.difficulty === "Hard").length;
    const topicStats = {};
    problems.forEach(problem => {
      if (problemPoints[problem.id]) {
        problem.categories.forEach(category => {
          topicStats[category] = (topicStats[category] || 0) + 1;
        });
      }
    });

    const accuracy = profileData.totalAttempts > 0
      ? Math.round((profileData.successfulSubmissions / profileData.totalAttempts) * 100)
      : 0;

    const StatCard = ({ title, value, icon, color, bgColor, description }) => (
      <Paper
        elevation={6}
        sx={{
          p: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
          border: `2px solid ${color}20`,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${color}30`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ color, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Box sx={{ 
            bgcolor: `${color}15`, 
            borderRadius: '50%', 
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 32, color } })}
          </Box>
        </Box>
      </Paper>
    );

    return (
      <Modal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        aria-labelledby="profile-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Fade in={showProfile}>
          <Paper
            sx={{
              width: isMobile ? '95vw' : '90vw',
              maxWidth: 1200,
              maxHeight: '95vh',
              overflow: 'auto',
              borderRadius: 6,
              boxShadow: theme.shadows[24]
            }}
          >
            {/* Header Section */}
            <Box sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 4,
              position: 'relative'
            }}>
              <IconButton
                onClick={() => setShowProfile(false)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CloseIcon />
              </IconButton>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  >
                    {userName[0]?.toUpperCase()}
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h3" fontWeight={800} gutterBottom>
                    {userName}
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                    Member since {new Date(profileData.joinDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmojiEventsIcon sx={{ color: '#ffd700', fontSize: 32 }} />
                    <Typography variant="h5" fontWeight={700}>
                      {solvedCount} Problems Solved
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Stats Section */}
            <Container sx={{ p: 4 }}>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
                📊 Performance Overview
              </Typography>
              
              {/* Main Stats Grid */}
              <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Problems Solved"
                    value={solvedCount}
                    icon={<CheckCircleIcon />}
                    color="#4caf50"
                    bgColor="#f1f8e9"
                    description="Total completed"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Current Streak"
                    value={`${profileData.streak}`}
                    icon={<TrendingUpIcon />}
                    color="#ff9800"
                    bgColor="#fff3e0"
                    description="Days in a row"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Accuracy Rate"
                    value={`${accuracy}%`}
                    icon={<AssessmentIcon />}
                    color="#2196f3"
                    bgColor="#e3f2fd"
                    description="Success ratio"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="Total Attempts"
                    value={profileData.totalAttempts}
                    icon={<SpeedIcon />}
                    color="#9c27b0"
                    bgColor="#f3e5f5"
                    description="Submissions made"
                  />
                </Grid>
              </Grid>

              {/* Difficulty Breakdown */}
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                🎯 Difficulty Breakdown
              </Typography>
              <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                      border: '2px solid #4caf5020',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px #4caf5030'
                      }
                    }}
                  >
                    <Typography variant="h2" fontWeight={900} sx={{ color: '#2e7d32', mb: 1 }}>
                      {easyCount}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Easy Problems
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Foundation level
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
                      border: '2px solid #ff980020',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px #ff980030'
                      }
                    }}
                  >
                    <Typography variant="h2" fontWeight={900} sx={{ color: '#f57c00', mb: 1 }}>
                      {mediumCount}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Medium Problems
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Intermediate level
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      borderRadius: 4,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #ffebee 0%, #ef5350 100%)',
                      border: '2px solid #f4433620',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px #f4433630'
                      }
                    }}
                  >
                    <Typography variant="h2" fontWeight={900} sx={{ color: '#d32f2f', mb: 1 }}>
                      {hardCount}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      Hard Problems
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Advanced level
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Topics Mastery */}
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                🧠 Topics Mastery
              </Typography>
              {Object.keys(topicStats).length > 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  p: 3,
                  bgcolor: theme.palette.background.default,
                  borderRadius: 3
                }}>
                  {Object.entries(topicStats).map(([topic, count]) => (
                    <Chip
                      key={topic}
                      label={`${topic} (${count})`}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 2,
                        py: 1,
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: theme.palette.background.default }}>
                  <Typography variant="h6" color="text.secondary">
                    🚀 Start solving problems to unlock topic mastery!
                  </Typography>
                </Paper>
              )}
            </Container>
          </Paper>
        </Fade>
      </Modal>
    );
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      background: theme.palette.background.default,
      transition: 'background-color 0.3s ease',
      className: darkMode ? 'dark-scrollbar' : ''
    }}>
      {showProgress && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            height: 3
          }}
        />
      )}
      <AppBar position="static" elevation={2} sx={{ backdropFilter: 'blur(20px)' }}>
        <Toolbar>
          <CodeIcon sx={{ mr: 1 }} />
          <Typography
            variant={isMobile ? "subtitle1" : "h6"}
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            CodeJudge++
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <EmojiEventsIcon sx={{ mr: 1, color: '#ffd700' }} />
              <Typography variant="body2" fontWeight={600}>
                Problems Solved: {totalPoints}
              </Typography>
            </Box>
          )}
          <IconButton
            color="inherit"
            onClick={toggleDarkMode}
            sx={{ mr: 1 }}
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="View Profile" arrow>
              <IconButton onClick={() => setShowProfile(true)} sx={{ p: 0 }} aria-label="open profile">
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.light,
                    color: theme.palette.primary.contrastText,
                    mr: 1,
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    "&:hover": {
                      transform: "scale(1.1)",
                      boxShadow: `0 0 8px ${theme.palette.primary.main}`
                    }
                  }}
                >
                  {userName.length > 0 ? userName[0].toUpperCase() : "U"}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout" arrow>
              <IconButton
                color="inherit"
                onClick={() => signOut(auth)}
                size={isMobile ? "small" : "medium"}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={isTablet ? "md" : "lg"}
        sx={{
          mt: isMobile ? 2 : 5,
          px: isMobile ? 1 : 3
        }}
      >
        <Fade in timeout={500}>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            fontWeight={600}
            gutterBottom
            className="slide-up"
          >
            Welcome, {userName}!
          </Typography>
        </Fade>

        {selectedProblem ? (
          <Fade in timeout={300}>
            <Card
              sx={{
                mb: 3,
                p: isMobile ? 1 : 2,
                borderRadius: 3,
                boxShadow: theme.shadows[4]
              }}
            >
              <CardContent>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setSelectedProblem(null);
                    setTestResults([]);
                    setSubmitScore(null);
                  }}
                  sx={{ mb: 2 }}
                  className="ripple"
                >
                  Back to Problems
                </Button>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  fontWeight={600}
                  gutterBottom
                  className="slide-up"
                >
                  {selectedProblem.title}
                </Typography>
                <Chip
                  label={selectedProblem.difficulty}
                  color={
                    selectedProblem.difficulty === "Easy"
                      ? "success"
                      : selectedProblem.difficulty === "Medium"
                        ? "warning"
                        : "error"
                  }
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    mb: 1, mt: 1,
                    fontWeight: 600,
                    color: selectedProblem.difficulty === "Hard" ? "#fff" : undefined,
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
                <Box sx={{ mb: 2 }}>
                  {selectedProblem.categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText
                        }
                      }}
                    />
                  ))}
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 2,
                    mb: 3,
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    lineHeight: 1.6
                  }}
                >
                  {selectedProblem.description}
                </Typography>
                {selectedProblem.testCases && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Sample Test Cases:
                    </Typography>
                    {selectedProblem.testCases.map((tc, idx) => (
                      <Grow in timeout={300 + idx * 100} key={idx}>
                        <Box
                          sx={{
                            background: theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : "#f9f9f9",
                            p: isMobile ? 1 : 1.5,
                            mb: 1,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <div>
                            <strong>Input:</strong>
                            <pre style={{
                              margin: 0,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              overflow: 'auto'
                            }}>
                              {tc.input}
                            </pre>
                          </div>
                          <div>
                            <strong>Expected Output:</strong>
                            <pre style={{
                              margin: 0,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              overflow: 'auto'
                            }}>
                              {tc.expectedOutput}
                            </pre>
                          </div>
                        </Box>
                      </Grow>
                    ))}
                  </Box>
                )}
                <ProblemEditor
                  problem={selectedProblem}
                  userCode={userCodes[selectedProblem.id]}
                  onCodeChange={(code) => handleCodeChange(selectedProblem.id, code)}
                />
                <Box sx={{
                  mt: 2,
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 1
                }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={runningTests || !userCodes[selectedProblem.id]?.length}
                    onClick={() => runVisibleTestCases(selectedProblem.id)}
                    startIcon={<PlayArrowIcon />}
                    sx={{
                      mb: isMobile ? 1 : 2,
                      mr: isMobile ? 0 : 2,
                      minWidth: isMobile ? '100%' : 120
                    }}
                    className={`ripple ${runningTests ? 'pulse' : ''}`}
                  >
                    {runningTests ? "Running..." : "Run"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={submitting || !userCodes[selectedProblem.id]?.length}
                    onClick={() => handleSubmit(selectedProblem.id)}
                    startIcon={<SendIcon />}
                    sx={{
                      mb: isMobile ? 1 : 2,
                      minWidth: isMobile ? '100%' : 120
                    }}
                    className={`ripple ${submitting ? 'pulse' : ''}`}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </Box>
                {testResults.length > 0 && (
                  <Fade in timeout={400}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Test Case Results (Sample/public only):
                      </Typography>
                      {testResults.map((tr, idx) => (
                        <Grow in timeout={200 + idx * 100} key={idx}>
                          <Box sx={{
                            mb: 1,
                            p: isMobile ? 1 : 1.5,
                            borderRadius: 2,
                            background: tr.pass
                              ? 'linear-gradient(135deg, #e5ffe5 0%, #f0fff0 100%)'
                              : 'linear-gradient(135deg, #ffe5e5 0%, #fff0f0 100%)',
                            border: `2px solid ${tr.pass ? '#4caf50' : '#f44336'}`,
                            boxShadow: theme.shadows[2]
                          }}>
                            <div><strong>Input:</strong> <pre style={{
                              margin: 0,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              overflow: 'auto'
                            }}>{tr.input}</pre></div>
                            <div><strong>Expected Output:</strong> <pre style={{
                              margin: 0,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              overflow: 'auto'
                            }}>{tr.expected}</pre></div>
                            <div><strong>Your Output:</strong> <pre style={{
                              margin: 0,
                              fontSize: isMobile ? '0.8rem' : '0.9rem',
                              overflow: 'auto'
                            }}>{tr.actual}</pre></div>
                            <div><strong>Status:</strong> {tr.pass ? "Passed ✅" : "Failed ❌"}</div>
                            {tr.error && (<div style={{ color: "red" }}>Error: {tr.error}</div>)}
                          </Box>
                        </Grow>
                      ))}
                    </Box>
                  </Fade>
                )}
                {submitScore && (
                  <Grow in timeout={500}>
                    <Alert
                      severity={submitScore.allPassed ? "success" : "warning"}
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        fontWeight: 500
                      }}
                      className={submitScore.allPassed ? "bounce-in" : ""}
                    >
                      {submitScore.allPassed
                        ? `🎉 Accepted: Passed all ${submitScore.total} test cases! +1 point`
                        : `Partial Acceptance: Passed ${submitScore.correct} out of ${submitScore.total} test cases`}
                    </Alert>
                  </Grow>
                )}
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                width: "100%"
              }}>
                <SearchIcon sx={{ mr: 1, fontSize: 26, color: theme.palette.text.secondary }} />
                <InputBase
                  sx={{
                    flex: 1,
                    fontSize: isMobile ? 16 : 18,
                    background: theme.palette.background.paper,
                    borderRadius: 3,
                    px: 2,
                    py: isMobile ? 1.2 : 1.5,
                    border: `2px solid ${theme.palette.divider}`,
                    transition: 'all 0.2s ease',
                    '&:focus-within': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 3px ${theme.palette.primary.main}25`
                    }
                  }}
                  placeholder="Search problems..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </Box>
              {isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ mr: 1, color: '#ffd700' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Problems Solved: {totalPoints}
                  </Typography>
                </Box>
              )}
            </Box>
            {filteredProblems.length === 0 && (
              <Fade in timeout={300}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No problems match your search.
                </Alert>
              </Fade>
            )}
            <Box>
              {filteredProblems.map((prob, index) => (
                <Grow in timeout={200 + index * 50} key={prob.id}>
                  <Box
                    sx={{
                      mb: 3,
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 3,
                      boxShadow: theme.shadows[3],
                      p: isMobile ? 2 : 3,
                      minWidth: "100%",
                      maxWidth: "100%",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: `1px solid ${theme.palette.divider}`,
                      "&:hover": {
                        boxShadow: theme.shadows[8],
                        transform: "translateY(-4px)",
                        borderColor: theme.palette.primary.main
                      },
                      "&:active": {
                        transform: "translateY(-2px)"
                      }
                    }}
                    onClick={() => setSelectedProblem(prob)}
                    className="ripple"
                  >
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight={700}
                      gutterBottom
                      sx={{
                        color: theme.palette.text.primary,
                        mb: 1.5
                      }}
                    >
                      {prob.title}
                    </Typography>
                    <Chip
                      label={prob.difficulty}
                      color={
                        prob.difficulty === "Easy"
                          ? "success"
                          : prob.difficulty === "Medium"
                            ? "warning"
                            : "error"
                      }
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        fontWeight: 700,
                        fontSize: isMobile ? 14 : 16,
                        px: isMobile ? 1.5 : 2,
                        pb: 0.5,
                        mt: 0,
                        color: prob.difficulty === "Hard" ? "#fff" : undefined,
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    <Box sx={{ mt: 1.5, mb: 2 }}>
                      {prob.categories.map(cat => (
                        <Chip
                          key={cat}
                          label={cat}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 0.5,
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.light,
                              color: theme.palette.primary.contrastText,
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        fontSize: isMobile ? 16 : 18,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: isMobile ? 2 : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {prob.description}
                    </Typography>
                  </Box>
                </Grow>
              ))}
            </Box>
          </>
        )}
      </Container>
      {/* REDESIGNED PROFILE MODAL */}
      <ProfileModal />
    </Box>
  );
}

export default App;
