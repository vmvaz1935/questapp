import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '../utils/sentry';

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
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
    
    // Enviar para Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
    }).catch(console.warn);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4" role="img" aria-label="Erro">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Um erro inesperado ocorreu. Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.
              </p>
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Tentar novamente"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Recarregar página"
                >
                  Recarregar Página
                </button>
              </div>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Detalhes do erro (apenas em desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

