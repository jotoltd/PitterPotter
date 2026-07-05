import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-6">
            <div className="max-w-md text-center space-y-4">
              <h1 className="font-heading text-2xl font-black text-[#1B2D3C]">Something went wrong</h1>
              <p className="text-xs text-[#1B2D3C]/70 font-medium">
                An unexpected error occurred. Please try again or refresh the page.
              </p>
              {this.state.error && (
                <pre className="text-[10px] text-left bg-[#F5F5F5] p-3 rounded text-[#1B2D3C]/70 overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-all cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border border-[#1B2D3C]/20 hover:bg-[#F5F5F5] transition-all cursor-pointer"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
