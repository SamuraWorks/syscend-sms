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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import type { PageProps } from '@/Types';

const resetSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type ResetFormData = z.infer<typeof resetSchema>;

interface ResetPasswordProps extends PageProps {
    token: string;
    email?: string | null;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { flash, errors: serverErrors, schoolBranding } = usePage<ResetPasswordProps>().props;

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
        defaultValues: { email: email ?? '', password: '', password_confirmation: '' },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (serverErrors?.email) setError('email', { message: serverErrors.email });
        if (serverErrors?.password) setError('password', { message: serverErrors.password });
        if (serverErrors?.password_confirmation) setError('password_confirmation', { message: serverErrors.password_confirmation });
    }, [serverErrors, setError]);

    const onSubmit = (data: ResetFormData) => {
        router.post('/reset-password', {
            token,
            email: data.email,
            password: data.password,
            password_confirmation: data.password_confirmation,
        }, {
            onError: (errs) => {
                if (errs.email) setError('email', { message: errs.email });
                if (errs.password) setError('password', { message: errs.password });
                if (errs.password_confirmation) setError('password_confirmation', { message: errs.password_confirmation });
                if (errs.message) toast.error(errs.message);
            },
        });
    };

    return (
        <AuthLayout>
            <Head title="Reset Password" />

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
                        Choose a new password
                    </p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            Set a new password
                        </CardTitle>
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
                                    className="h-10"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                    New password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Minimum 8 characters"
                                    className="h-10"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
                                    Confirm new password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Re-enter your new password"
                                    className="h-10"
                                    {...register('password_confirmation')}
                                />
                                {errors.password_confirmation && (
                                    <p className="text-xs text-red-500 mt-1">{errors.password_confirmation.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors mt-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Resetting…' : 'Reset password'}
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