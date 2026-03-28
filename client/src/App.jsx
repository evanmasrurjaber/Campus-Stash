import { useState } from 'react';
import { getHealthStatus } from './services/api';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const checkBackend = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getHealthStatus();
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError?.response?.data?.message ||
          'Cannot reach backend API. Verify server is running and VITE_API_BASE_URL is correct.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="panel">
        <h1>CSE470 MERN Starter</h1>
        <p className="subtitle">
          Frontend is ready. Use the button below to verify backend connectivity.
        </p>

        <button className="check-btn" onClick={checkBackend} disabled={loading}>
          {loading ? 'Checking...' : 'Check Backend Health'}
        </button>

        {result && (
          <div className="status-card success">
            <h2>Backend Connected</h2>
            <p>
              <strong>Status:</strong> {result.status}
            </p>
            <p>
              <strong>Service:</strong> {result.service}
            </p>
            <p>
              <strong>Timestamp:</strong> {result.timestamp}
            </p>
          </div>
        )}

        {error && (
          <div className="status-card error">
            <h2>Connection Error</h2>
            <p>{error}</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
