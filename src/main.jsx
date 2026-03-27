import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#0A0A0F', fontFamily: 'monospace', height: '100vh' }}>
          <h2 style={{ color: '#FF3355' }}>Application Error</h2>
          <p>The application encountered an unexpected error.</p>
          <pre style={{ background: '#1A1A25', padding: 10, borderRadius: 5 }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', marginTop: 10, cursor: 'pointer' }}>Reload Dashboard</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
