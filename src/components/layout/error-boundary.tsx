import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card p-6 m-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-semibold">{this.props.fallbackTitle ?? 'Something broke on this page'}</h2>
        </div>
        <pre className="text-xs text-ink-600 bg-ink-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {this.state.error.message}
        </pre>
        <div className="flex gap-2">
          <button onClick={this.reset} className="btn btn-outline">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={async () => {
              // Unregister service workers — fixes stale PWA cache issues
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
              }
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
              }
              location.reload();
            }}
            className="btn btn-primary"
          >
            Clear cache & reload
          </button>
        </div>
      </div>
    );
  }
}
