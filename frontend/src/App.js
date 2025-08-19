import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import ProblemEditor from "./ProblemEditor";
import problems from "./problems";
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
  useTheme
} from "@mui/material";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Avatar,
  InputBase
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CodeIcon from "@mui/icons-material/Code";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    setUserName(localStorage.getItem("cj_username") || "");
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
    }
    setSubmitting(false);
    setShowProgress(false);
  }

  const totalPoints = Object.keys(problemPoints).length;
  const filteredProblems = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

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
      {/* Top Progress Bar */}
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
          
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.light, 
              color: theme.palette.primary.contrastText, 
              mr: 1,
              width: isMobile ? 32 : 40,
              height: isMobile ? 32 : 40,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              transition: 'all 0.2s ease'
            }}
          >
            {userName.length > 0 ? userName[0].toUpperCase() : "U"}
          </Avatar>
          
          <IconButton 
            color="inherit" 
            onClick={() => signOut(auth)}
            size={isMobile ? "small" : "medium"}
          >
            <LogoutIcon />
          </IconButton>
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
    </Box>
  );
}

export default App;
  