import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-6">
            <div className="max-w-md text-center space-y-4">
              <h1 className="font-heading text-2xl font-black text-[#1B2D3C]">Something went wrong</h1>
              <p className="text-xs text-[#1B2D3C]/70 font-medium">
                An unexpected error occurred. Please refresh the page and try again.
              </p>
              {this.state.error && (
                <pre className="text-[10px] text-left bg-[#F5F5F5] p-3 rounded text-[#1B2D3C]/70 overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
