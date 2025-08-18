const RAPIDAPI_KEY = process.env.REACT_APP_JUDGE0_API_KEY;
const RAPIDAPI_HOST = 'judge0-ce.p.rapidapi.com';
const API_BASE = `https://${RAPIDAPI_HOST}`;

export async function submitCode({ sourceCode, languageId, stdin = '' }) {
  const encodedCode = btoa(sourceCode);
  const encodedStdin = btoa(stdin);

  const response = await fetch(
    `${API_BASE}/submissions?base64_encoded=true&wait=false`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      body: JSON.stringify({
        source_code: encodedCode,
        language_id: languageId,
        stdin: encodedStdin
      })
    }
  );
  if (!response.ok) {
    throw new Error(`Judge0 API error: ${response.status}`);
  }
  return response.json();
}

export async function getSubmissionResult(token) {
  const response = await fetch(`${API_BASE}/submissions/${token}?base64_encoded=true`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch result: ${response.status}`);
  }
  return response.json();
}
