// /src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * A reusable Error Boundary component to catch runtime errors in the component tree.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging (you'd typically send this to an error service)
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      return (
        <Alert variant="destructive" className="mt-8 p-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-lg font-bold">Critical Runtime Error</AlertTitle>
          <AlertDescription className="mt-2">
            Something crashed while trying to render this page component. Check the console for full details.
          </AlertDescription>
          {this.state.error && (
            <details className="mt-4 p-2 bg-red-900 rounded text-xs cursor-pointer text-white">
              <summary className="font-mono">Click for Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
