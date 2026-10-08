import { Head, Link } from '@inertiajs/react';
import { Clock, Home, LogOut, Mail } from 'lucide-react';

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

export default function AwaitingApproval({ school }: Props) {
    return (
        <div className="landing">
            <Head title="Awaiting Approval — Syscend Campus" />
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center space-y-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold">Your school is awaiting approval</h1>
                        {school && (
                            <p className="text-muted-foreground">
                                You registered <strong>{school.name}</strong> with Syscend Campus. A member of the
                                Syscend team is reviewing your application and will approve it shortly.
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            Once approved, you will be able to complete your school setup and start using the platform.
                            Please check back soon, or contact us if you have any questions.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/"
                            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                            <Home className="w-4 h-4" /> Return to Home
                        </Link>
                        <Link href="/contact"
                            className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
                            <Mail className="w-4 h-4" /> Contact Syscend
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