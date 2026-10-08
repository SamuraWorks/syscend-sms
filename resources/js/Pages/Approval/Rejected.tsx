import { Head, Link } from '@inertiajs/react';
import { Home, LogOut, Mail, XCircle } from 'lucide-react';

interface School {
    id: number;
    name: string;
    short_name: string | null;
    slug: string;
    registration_status: string;
    registration_rejection_reason: string | null;
    submitted_at: string | null;
}

interface Props {
    school: School | null;
}

export default function Rejected({ school }: Props) {
    return (
        <div className="landing">
            <Head title="Registration Not Approved — Syscend Campus" />
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center space-y-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold">Your registration was not approved</h1>
                        {school && (
                            <p className="text-muted-foreground">
                                Unfortunately, your application for <strong>{school.name}</strong> could not be approved.
                            </p>
                        )}
                        {school?.registration_rejection_reason && (
                            <div className="rounded-lg border border-border bg-card p-4 text-left text-sm text-muted-foreground">
                                <span className="block text-xs font-semibold uppercase tracking-wide mb-1">Reason</span>
                                {school.registration_rejection_reason}
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Please contact the Syscend team if you believe this is an error or would like to re-apply.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                            <Mail className="w-4 h-4" /> Contact Syscend
                        </Link>
                        <Link href="/"
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                            <Home className="w-4 h-4" /> Return to Home
                        </Link>
                        <Link href="/logout" method="post" as="button"
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                            <LogOut className="w-4 h-4" /> Log Out
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}