import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import ProblemEditor from "./ProblemEditor";
import problems from "./problems";
import { submitCode, getSubmissionResult } from "./services/judgeApi";
import { Card, CardContent, Chip, Button, Alert } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Avatar
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";

function App() {
  const [user, setUser] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [userCodes, setUserCodes] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [submitScore, setSubmitScore] = useState(null);
  const [runningTests, setRunningTests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problemPoints, setProblemPoints] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  const handleCodeChange = (problemId, code) => {
    setUserCodes((prev) => ({ ...prev, [problemId]: code }));
  };

  async function runVisibleTestCases(problemId) {
    if (!selectedProblem || !selectedProblem.testCases) return;
    setRunningTests(true);
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
  }

  async function handleSubmit(problemId) {
    setSubmitting(true);
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
  }

  const totalPoints = Object.keys(problemPoints).length;

  if (!user) {
    return <Auth />;
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f6fa" }}>
      <AppBar position="static" color="primary" elevation={2}>
        <Toolbar>
          <CodeIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CodeJudge++
          </Typography>
          <Typography sx={{ mr: 2 }}>
            <strong>Problems Solved: {totalPoints}</strong>
          </Typography>
          <Avatar sx={{ bgcolor: "#fff", color: "#007bff", mr: 2 }}>
            {user.email[0].toUpperCase()}
          </Avatar>
          <Button color="inherit" onClick={() => signOut(auth)}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome, {user.email}!
        </Typography>
        {selectedProblem ? (
          <Card sx={{ mb: 3, p: 2 }}>
            <CardContent>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedProblem(null);
                  setTestResults([]);
                  setSubmitScore(null);
                }}
                sx={{ mb: 2 }}
              >
                Back to Problems
              </Button>
              <Typography variant="h5" fontWeight={600} gutterBottom>
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
                size="small"
                sx={{
                  mb: 1, mt: 1,
                  color: selectedProblem.difficulty === "Hard" ? "#fff" : undefined
                }}
              />
              <div>
                {selectedProblem.categories.map((cat) => (
                  <Chip key={cat} label={cat} size="small" sx={{ mr: 0.5 }} />
                ))}
              </div>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                {selectedProblem.description}
              </Typography>
              {selectedProblem.testCases && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Sample Test Cases:
                  </Typography>
                  {selectedProblem.testCases.map((tc, idx) => (
                    <Box key={idx} sx={{ background: "#f9f9f9", p: 1, mb: 1, borderRadius: 1 }}>
                      <div>
                        <strong>Input:</strong>
                        <pre style={{ margin: 0 }}>{tc.input}</pre>
                      </div>
                      <div>
                        <strong>Expected Output:</strong>
                        <pre style={{ margin: 0 }}>{tc.expectedOutput}</pre>
                      </div>
                    </Box>
                  ))}
                </Box>
              )}
              <ProblemEditor
                problem={selectedProblem}
                userCode={userCodes[selectedProblem.id]}
                onCodeChange={(code) => handleCodeChange(selectedProblem.id, code)}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  disabled={runningTests || !userCodes[selectedProblem.id]?.length}
                  onClick={() => runVisibleTestCases(selectedProblem.id)}
                  sx={{ mb: 2, mr: 2 }}
                >
                  {runningTests ? "Running..." : "Run"}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={submitting || !userCodes[selectedProblem.id]?.length}
                  onClick={() => handleSubmit(selectedProblem.id)}
                  sx={{ mb: 2 }}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
                {testResults.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Test Case Results (Sample/public only):
                    </Typography>
                    {testResults.map((tr, idx) => (
                      <Box key={idx} sx={{
                        mb: 1, p: 1, borderRadius: 1,
                        background: tr.pass ? '#e5ffe5' : '#ffe5e5',
                        border: '1px solid #ddd'
                      }}>
                        <div><strong>Input:</strong> <pre style={{ margin: 0 }}>{tr.input}</pre></div>
                        <div><strong>Expected Output:</strong> <pre style={{ margin: 0 }}>{tr.expected}</pre></div>
                        <div><strong>Your Output:</strong> <pre style={{ margin: 0 }}>{tr.actual}</pre></div>
                        <div><strong>Status:</strong> {tr.pass ? "Passed ✅" : "Failed ❌"}</div>
                        {tr.error && (<div style={{ color: "red" }}>Error: {tr.error}</div>)}
                      </Box>
                    ))}
                  </Box>
                )}
                {submitScore && (
                  <Alert severity={submitScore.allPassed ? "success" : "warning"} sx={{ mt: 2 }}>
                    {submitScore.allPassed
                      ? `🎉 Accepted: Passed all ${submitScore.total} test cases! +1 point`
                      : `Partial Acceptance: Passed ${submitScore.correct} out of ${submitScore.total} test cases`}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Choose a problem to solve:
            </Typography>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {problems.map((prob) => (
                <Grid item xs={12} sm={6} md={4} key={prob.id}>
                  <Card
                    sx={{
                      height: "100%",
                      minWidth: 320,
                      maxWidth: 370,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "box-shadow 0.2s",
                      "&:hover": { boxShadow: 6 },
                      margin: "auto"
                    }}
                    onClick={() => setSelectedProblem(prob)}
                  >
                    <CardContent sx={{ minHeight: 180, width: "100%" }}>
                      <Typography variant="h6" fontWeight={600}>
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
                        size="small"
                        sx={{
                          mb: 1, mt: 1,
                          color: prob.difficulty === "Hard" ? "#fff" : undefined
                        }}
                      />
                      <div style={{ marginBottom: 8 }}>
                        {prob.categories.map((cat) => (
                          <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </div>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {prob.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
}

export default App;
