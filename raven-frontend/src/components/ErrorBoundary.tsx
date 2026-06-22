import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error reporting service (Sentry, etc.)
    console.error('Uncaught error in Raven frontend:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optional: force reload for clean slate in severe cases
    // window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050608', color: '#fff' }}>
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl mb-2">🐦‍⬛</div>
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-gray-400">
              The Raven app encountered an unexpected error. This has been logged.
            </p>
            {this.state.error && (
              <details className="text-left text-xs bg-black/40 p-3 rounded border border-white/10">
                <summary className="cursor-pointer select-none text-gray-500">Technical details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-red-400/80">{this.state.error.message}</pre>
              </details>
            )}
            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/20 hover:bg-white/5 transition"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#146ef5', color: 'white' }}
              >
                Reload app
              </button>
            </div>
            <p className="text-[10px] text-gray-600 pt-2">Raven Transit • Production mode</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
