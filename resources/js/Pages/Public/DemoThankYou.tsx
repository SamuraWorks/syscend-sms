import { Head, Link } from '@inertiajs/react';
import { CheckCircle, Home, Layers, Mail } from 'lucide-react';

interface Props { request_id: string | null; }

export default function DemoThankYou({ request_id }: Props) {
    return (
        <div className="landing">
            <Head title="Thank You — Syscend Campus" />
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center space-y-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold">Thank You!</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Your demo request has been received successfully.
                        </p>
                        {request_id && (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
                                <span className="text-muted-foreground">Reference:</span>
                                <span className="font-mono font-semibold text-primary">{request_id}</span>
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            A member of the Syscend team will contact you within <strong>24–48 business hours</strong> to
                            learn more about your school and schedule a personalized demonstration.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            While you wait, feel free to explore our platform and follow our latest updates.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/"
                            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                            <Home className="w-4 h-4" /> Return to Home
                        </Link>
                        <Link href="/about"
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                            <Layers className="w-4 h-4" /> Explore Features
                        </Link>
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                            <Mail className="w-4 h-4" /> Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
