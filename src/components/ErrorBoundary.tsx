import { Component, type ReactNode } from "react";
import { Ghost, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto">
              <Ghost className="w-8 h-8 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Try refreshing the page or returning to the dashboard.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-card border border-white/[0.06] rounded-lg p-3 text-left">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Error Details</p>
                <p className="text-xs text-danger font-mono break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-foreground text-sm font-medium hover:bg-white/[0.04] transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
