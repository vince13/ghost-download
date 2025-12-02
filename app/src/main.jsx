import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App.jsx';
import HudOverlayPage from './pages/HudOverlayPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/index.css';

// Check if we're in HUD overlay mode (hash routing for Electron)
function AppRouter() {
  const location = useLocation();
  
  // Check if we're in HUD overlay mode (via hash or pathname)
  // Handle both with and without /app/ prefix
  const pathname = location.pathname.replace(/^\/app/, '') || '/';
  const isHudOverlay = location.hash === '#hud-overlay' || pathname === '/hud-overlay';
  
  if (isHudOverlay) {
    return <HudOverlayPage />;
  }
  
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/app">
        <Routes>
          <Route path="/" element={<AppRouter />} />
          <Route path="/hud-overlay" element={<HudOverlayPage />} />
          {/* Catch-all for any unmatched paths */}
          <Route path="*" element={<AppRouter />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

