import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { MailCheck, Loader2, LogOut, SendHorizonal, ShieldCheck } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    email?: string | null;
    status?: string | null;
}

export default function VerifyEmail({ email, status }: Props) {
    const [sending, setSending] = useState(false);

    const resend = () => {
        setSending(true);
        router.post('/email/verification-notification', {}, {
            preserveScroll: true,
            onFinish: () => setSending(false),
        });
    };

    return (
        <AppLayout title="Verify your email">
            <Head title="Verify your email" />
            <div className="max-w-md mx-auto pt-10">
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-8 text-center space-y-5">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                            <MailCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                                Verify Your Email
                            </h1>
                            <p className="text-sm text-slate-500 mt-2">
                                We sent a verification link to{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">{email ?? 'your email address'}</span>.
                                Click the link in that message to activate full access to the parent portal.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-3 py-2 text-xs text-green-700 dark:text-green-400">
                                A fresh verification link has been sent to your email.
                            </div>
                        )}
                        {status && status !== 'verification-link-sent' && (
                            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                                {status}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Button onClick={resend} disabled={sending} className="w-full inline-flex items-center justify-center gap-2">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                                {sending ? 'Sending…' : 'Resend verification link'}
                            </Button>
                            <Button variant="outline" className="w-full inline-flex items-center justify-center gap-2" asChild>
                                <a href="/logout" onClick={(e) => {
                                    e.preventDefault();
                                    router.post('/logout');
                                }}>
                                    <LogOut className="w-4 h-4" /> Sign out
                                </a>
                            </Button>
                        </div>

                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Didn't receive it? Check spam or contact the school office.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
