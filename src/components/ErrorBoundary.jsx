import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-pale/15 flex items-center justify-center p-6 text-heading">
          <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-line/15 shadow-xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-heading">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              An unexpected error occurred while displaying this page. Reloading the page usually clears transient issues.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-mono text-left overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-slate px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-slate/90 dark:bg-brand-cyan dark:text-navy-950 dark:hover:bg-brand-pale"
            >
              <RotateCcw size={15} />
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
