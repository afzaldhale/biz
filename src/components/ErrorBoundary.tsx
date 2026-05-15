'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error.message || 'Something went wrong.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Captured error in ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
          <div className="max-w-2xl rounded-3xl border border-danger/20 bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Oops, something went wrong.</h2>
            <p className="text-sm text-slate-600 mb-6">We were unable to load this dashboard section. Please try refreshing the page or contact support if the issue persists.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary px-4 py-3 rounded-xl text-sm"
              >
                Reload dashboard
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="btn-outline px-4 py-3 rounded-xl text-sm"
              >
                Try again
              </button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">Error: {this.state.errorMessage}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
