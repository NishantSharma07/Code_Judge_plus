import React, { useState, useEffect } from 'react';
import { submitCode, getSubmissionResult } from './services/judgeApi';
import ReactSimpleCodeEditor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import { 
  Box, 
  Button, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';

function ProblemEditor({ problem, userCode, onCodeChange }) {
  // C++ starter template
  const cppTemplate = `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    cout << "Hello, CodeJudge++!" << endl;
    return 0;
}`;

  const [localUserCode, setLocalUserCode] = useState(
    userCode !== undefined ? userCode : cppTemplate
  );
  const [languageId, setLanguageId] = useState(54); // C++ default
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Prism languages safely
  useEffect(() => {
    try {
      require("prismjs/components/prism-clike");
      require("prismjs/components/prism-cpp");
    } catch (e) {}
  }, []);

  // Send code to parent whenever our code or problem changes (ENABLED BUTTON FIX)
  useEffect(() => {
    if (onCodeChange) onCodeChange(localUserCode);
    // eslint-disable-next-line
  }, [localUserCode]);

  useEffect(() => {
    setLocalUserCode(userCode !== undefined ? userCode : cppTemplate);
    // eslint-disable-next-line
  }, [problem, userCode]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    try {
      const { token } = await submitCode({ 
        sourceCode: localUserCode, 
        languageId 
      });
      let result;
      do {
        await new Promise(r => setTimeout(r, 1200));
        result = await getSubmissionResult(token);
      } while (result.status && result.status.id !== 3);

      const stdOut = result.stdout ? atob(result.stdout) : '';
      const stdErr = result.stderr ? atob(result.stderr) : '';
      const compileOut = result.compile_output ? atob(result.compile_output) : '';

      if (stdOut) {
        setOutput(stdOut);
      } else if (stdErr) {
        setOutput(`Error: ${stdErr}`);
      } else if (compileOut) {
        setOutput(`Compile Error: ${compileOut}`);
      } else {
        setOutput('No output');
      }
    } catch (e) {
      setError(e?.message || 'Submission failed, try again.');
    }
    setLoading(false);
  };

  const languages = [
    { id: 54, name: 'C++ (GCC 9.2.0)' },
    { id: 71, name: 'Python 3' },
    { id: 63, name: 'JavaScript (Node.js)' },
    { id: 62, name: 'Java (OpenJDK 13.0.1)' },
    { id: 50, name: 'C (GCC 9.2.0)' }
  ];

  const highlightCode = (code) => {
    try {
      if (Prism.languages.cpp) {
        return Prism.highlight(code, Prism.languages.cpp, "cpp");
      } else if (Prism.languages.javascript) {
        return Prism.highlight(code, Prism.languages.javascript, "javascript");
      } else {
        return code;
      }
    } catch (e) {
      return code;
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
        Your Solution:
      </Typography>
      <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel>Language</InputLabel>
        <Select
          value={languageId}
          onChange={(e) => setLanguageId(e.target.value)}
          label="Language"
        >
          {languages.map((lang) => (
            <MenuItem key={lang.id} value={lang.id}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ 
        border: "1px solid #ddd", 
        borderRadius: 2, 
        mb: 2, 
        background: "#282a36",
        overflow: "hidden"
      }}>
        <ReactSimpleCodeEditor
          value={localUserCode}
          onValueChange={setLocalUserCode}
          highlight={highlightCode}
          padding={16}
          style={{
            fontFamily: '"Fira Mono", monospace',
            fontSize: 14,
            minHeight: 300,
            color: "#fff",
            background: "#282a36",
          }}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={loading}
        sx={{ mt: 1 }}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Running Code...' : 'Submit & Run'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {output && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Output:
          </Typography>
          <Box sx={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: 1,
            p: 2,
            mt: 1,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {output}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ProblemEditor;
