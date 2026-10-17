import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PreferencesForm, type RequestStatus } from './components/PreferencesForm';
import './style.css';

async function errorMessage(response: Response): Promise<string> {
  if (response.status === 422) return 'The request was not valid. Check your description (1–1000 characters).';
  return `The server returned an error (${response.status}). Please try again.`;
}

function App() {
  const [status, setStatus] = useState<RequestStatus>({ state: 'idle' });
  const [result, setResult] = useState('No request yet.');

  async function search(query: string) {
    setStatus({ state: 'loading' });
    try {
      const response = await fetch('/api/routes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query}) });
      if (!response.ok) {
        setStatus({ state: 'error', message: await errorMessage(response) });
        return;
      }
      setResult(JSON.stringify(await response.json(), null, 2));
      setStatus({ state: 'success' });
    } catch {
      setStatus({ state: 'error', message: 'Could not reach the server. Is the backend running?' });
    }
  }

  return <main><h1>Warsaw 2076</h1><p>Integration starter — synthetic route data only.</p>
    <PreferencesForm status={status} onSubmit={search} />
    <pre aria-live="polite">{result}</pre></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
