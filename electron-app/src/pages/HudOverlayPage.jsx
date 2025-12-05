/**
 * Standalone HUD Overlay Page
 * Used in Electron floating window for video conferencing apps
 */
import { useEffect } from 'react';
import { HudOverlay } from '../components/HudOverlay';
import ErrorBoundary from '../components/ErrorBoundary';

export default function HudOverlayPage() {
  // Make body/html transparent for floating window
  useEffect(() => {
    // Apply styles immediately (before React renders)
    document.body.style.backgroundColor = 'transparent';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.backgroundColor = 'transparent';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    
    // Also set root element
    const root = document.getElementById('root');
    if (root) {
      root.style.backgroundColor = 'transparent';
      root.style.margin = '0';
      root.style.padding = '0';
      root.style.overflow = 'hidden';
      root.style.width = 'fit-content';
      root.style.height = 'fit-content';
    }
    
    // Apply styles via CSS as well for better reliability
    const style = document.createElement('style');
    style.textContent = `
      html, body, #root {
        background-color: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #root {
        width: fit-content !important;
        height: fit-content !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Reset on unmount (though this page shouldn't unmount)
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <div style={{ 
        width: 'fit-content', 
        height: 'fit-content', 
        backgroundColor: 'transparent',
        margin: 0,
        padding: 0
      }}>
        <HudOverlay />
      </div>
    </ErrorBoundary>
  );
}

