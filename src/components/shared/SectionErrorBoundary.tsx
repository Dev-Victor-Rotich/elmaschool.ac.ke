import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  key: number;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, key: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Section error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      key: prev.key + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-destructive/20 bg-destructive/5 rounded-lg">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-lg mb-1">
            {this.props.fallbackTitle || "This section failed to load"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Section
          </Button>
        </div>
      );
    }

    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
