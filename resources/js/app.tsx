import '../css/app.css';
import { Component, type ReactNode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; stack: string | null }> {
    state = { error: null, stack: null };
    static getDerivedStateFromError(error: Error) { return { error }; }
    componentDidCatch(error: Error, info: { componentStack?: string | null }) {
        console.error('RuntimeError:', error, '\nComponent stack:\n', info.componentStack);
        this.setState({ stack: info.componentStack ?? null });
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
                    <h2 style={{ color: 'red' }}>Runtime Error</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
                    {this.state.stack && (
                        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', color: '#666' }}>{this.state.stack}</pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}

const appName = document.title;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob<{ default: React.ComponentType }>(
                './Pages/**/*.tsx',
            ),
        ) as unknown as Promise<React.ComponentType>,
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ErrorBoundary>
                <App {...props} />
                <Toaster richColors position="top-right" />
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#6366f1',
    },
});
