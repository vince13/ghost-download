import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900 border border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-red-400 mb-2">Something went wrong</h1>
                <p className="text-gray-300 mb-4">
                  The app encountered an error. Please refresh the page or check the console for details.
                </p>
                {this.state.error && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-400 cursor-pointer mb-2">Error details</summary>
                    <pre className="text-xs text-gray-500 bg-gray-950 p-3 rounded overflow-auto max-h-48">
                      {this.state.error.toString()}
                      {this.state.error.stack && `\n\n${this.state.error.stack}`}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

