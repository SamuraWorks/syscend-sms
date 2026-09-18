import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePage, Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useEffect } from 'react';

import AuthLayout from '@/Layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import type { PageProps } from '@/Types';

const forgotSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

interface ForgotPasswordProps extends PageProps {}

export default function ForgotPassword() {
    const { flash, errors: serverErrors, schoolBranding } = usePage<ForgotPasswordProps>().props;

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ForgotFormData>({
        resolver: zodResolver(forgotSchema),
        defaultValues: { email: '' },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (serverErrors?.email) setError('email', { message: serverErrors.email });
    }, [serverErrors, setError]);

    const onSubmit = (data: ForgotFormData) => {
        router.post('/forgot-password', data, {
            onError: (errs) => {
                if (errs.email) setError('email', { message: errs.email });
            },
        });
    };

    return (
        <AuthLayout>
            <Head title="Forgot Password" />

            <div className="w-full max-w-md">
                <Link href="/" className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img
                            src={schoolBranding?.logo_url || "/images/logo.png"}
                            alt={schoolBranding?.name || "Syscend Campus"}
                            className="inline-block w-full h-full object-contain [filter:none]"
                        />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        {schoolBranding?.name || "Syscend Campus"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Reset your password
                    </p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-primary" />
                            Forgot your password?
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Enter the email address you use to sign in and we&apos;ll send you a
                            reset link if an account exists.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="admin@school.edu"
                                    className="h-10"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors mt-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending link…' : 'Send reset link'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} {schoolBranding?.name || "Syscend Campus"}. All rights reserved.
                </p>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Remembered it?{' '}
                    <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}