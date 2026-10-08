import '../css/app.css';
import { Component, useEffect, type ReactNode } from 'react';
import { createInertiaApp, usePage } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import InstallGate from '@/components/InstallGate';
import { ensureWebPushSubscription } from '@/lib/webPush';
import type { PageProps } from '@/Types';

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

// Register the service worker so the app is PWA-installable and the install
// prompt can appear. Only on secure origins (https / localhost) and in the
// browser — never during SSR. Registration failures are non-fatal.
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (window.location.protocol === 'https:' || isLocalHost) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Ignore — the app still works without a service worker.
            });
        });
    }
}

const appName = document.title;

// Keep browsers subscribed to web push while the user is signed in. Runs on
// every authenticated mount; silently returns when no keys/permission exist.
function WebPushBootstrap() {
    const { auth, webPush } = usePage<PageProps>().props;

    useEffect(() => {
        if (!auth?.user || !webPush?.enabled || !webPush.vapidPublicKey) return;
        ensureWebPushSubscription(webPush.vapidPublicKey);
    }, [auth?.user, webPush]);

    return null;
}

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
                <WebPushBootstrap />
                <InstallGate />
                <Toaster richColors position="top-right" />
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#6366f1',
    },
});
