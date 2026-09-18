import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router, usePage, Head, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import AuthLayout from '@/Layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Shield, CheckCircle2, ChevronLeft } from 'lucide-react';

const verifySchema = z.object({
    emp_id: z.string().min(1, 'Staff/Teacher ID is required'),
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

const completeSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type VerifyFormData = z.infer<typeof verifySchema>;
type CompleteFormData = z.infer<typeof completeSchema>;

interface School { id: number; name: string; slug: string; code: string | null; }
interface VerifiedData { staff_name: string; department: string; designation: string; teacher_type: string; roles: string[]; message: string; verify_token: string; }
interface StaffRegistrationProps { school: School; verified?: VerifiedData; flash?: { success?: string; error?: string }; [key: string]: unknown; }

type RegState = 'initial' | 'verifying' | 'verified' | 'failed' | 'creating';

export default function StaffRegistration({ school, verified }: StaffRegistrationProps) {
    const { flash } = usePage<StaffRegistrationProps>().props;
    const [state, setState] = useState<RegState>(verified ? 'verified' : 'initial');
    const [requiresEmail, setRequiresEmail] = useState(false);

    const verifyForm = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        defaultValues: { emp_id: '', full_name: '', email: '' },
    });

    const completeForm = useForm<CompleteFormData>({
        resolver: zodResolver(completeSchema),
        defaultValues: { email: '', password: '', password_confirmation: '' },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (verified) { setState('verified'); toast.success(verified.message); }
    }, [verified]);

    const onVerify = (data: VerifyFormData) => {
        setState('verifying');
        setRequiresEmail(false);
        router.post(`/${school.slug}/register/staff/verify`, data, {
            onError: (errs) => {
                setState('failed');
                if (errs.emp_id) verifyForm.setError('emp_id', { message: errs.emp_id });
                if (errs.full_name) verifyForm.setError('full_name', { message: errs.full_name });
                if (errs.email) { verifyForm.setError('email', { message: errs.email }); setRequiresEmail(true); }
            },
        });
    };

    const onComplete = (data: CompleteFormData) => {
        setState('creating');
        router.post(`/${school.slug}/register/staff/complete`, data, {
            onError: (errs) => {
                setState('verified');
                Object.entries(errs).forEach(([field, message]) => {
                    completeForm.setError(field as keyof CompleteFormData, { message });
                });
            },
        });
    };

    return (
        <AuthLayout>
            <Head title={`Staff Registration — ${school.name}`} />
            <div className="w-full max-w-md">
                <Link href={`/${school.slug}/register`} className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img src="/images/logo.png" alt="Syscend Campus" className="inline-block w-full h-full object-contain [filter:none]" />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Staff Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">{school.name}</p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            {state === 'verified' || state === 'creating' ? <Shield className="w-5 h-5 text-[#1f66f5]" /> : <BadgeCheck className="w-5 h-5 text-primary" />}
                            {state === 'verified' || state === 'creating' ? 'Create Your Account' : 'Verify Your Identity'}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {state === 'verified' || state === 'creating'
                                ? 'Your school record has been found. Create your account password below.'
                                : 'Enter your Staff/Teacher ID and full name to verify your school record.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {state === 'verified' || state === 'creating' ? (
                            <>
                                {verified && (
                                    <div className="bg-[#1f66f5]/5 border border-[#1f66f5]/25 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#1f66f5] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Registry Match Found</p>
                                                <p className="text-sm text-slate-700 mt-1">{verified.staff_name}</p>
                                                <p className="text-sm text-slate-600">
                                                    {verified.department && `${verified.department} — `}{verified.designation || verified.teacher_type}
                                                </p>
                                                {verified.roles.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {verified.roles.map((r) => (
                                                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1f66f5]/10 text-[#1f66f5]">
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <form onSubmit={completeForm.handleSubmit(onComplete)} className="space-y-4" noValidate>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                                        <Input id="email" type="email" placeholder="you@example.com" className="h-10" {...completeForm.register('email')} />
                                        {completeForm.formState.errors.email && <p className="text-xs text-red-500">{completeForm.formState.errors.email.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                        <Input id="password" type="password" placeholder="Minimum 8 characters" className="h-10" {...completeForm.register('password')} />
                                        {completeForm.formState.errors.password && <p className="text-xs text-red-500">{completeForm.formState.errors.password.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password_confirmation" className="text-sm font-medium">Confirm Password</Label>
                                        <Input id="password_confirmation" type="password" placeholder="Re-enter password" className="h-10" {...completeForm.register('password_confirmation')} />
                                        {completeForm.formState.errors.password_confirmation && <p className="text-xs text-red-500">{completeForm.formState.errors.password_confirmation.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full h-10 bg-[#1f66f5] hover:bg-[#174ed7] text-white" disabled={state === 'creating'}>
                                        {state === 'creating' ? 'Creating Account…' : 'Create Account'}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4" noValidate>
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_id" className="text-sm font-medium">Staff/Teacher ID</Label>
                                    <Input id="emp_id" placeholder="e.g. EMP-2026-00001" className="h-10" {...verifyForm.register('emp_id')} />
                                    {verifyForm.formState.errors.emp_id && <p className="text-xs text-red-500">{verifyForm.formState.errors.emp_id.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                                    <Input id="full_name" placeholder="As registered in your school" className="h-10" {...verifyForm.register('full_name')} />
                                    {verifyForm.formState.errors.full_name && <p className="text-xs text-red-500">{verifyForm.formState.errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Email Address {requiresEmail ? <span className="text-red-500">*</span> : <span className="text-muted-foreground font-normal">(if on file)</span>}
                                    </Label>
                                    <Input id="email" type="email" placeholder="you@example.com" className="h-10" {...verifyForm.register('email')} />
                                    {verifyForm.formState.errors.email && <p className="text-xs text-red-500">{verifyForm.formState.errors.email.message}</p>}
                                </div>
                                <Button type="submit" className="w-full h-10" disabled={state === 'verifying'}>
                                    {state === 'verifying' ? 'Verifying…' : 'Verify My Details'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center gap-2 mt-4">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary hover:text-primary/80">Sign in</Link>
                    </p>
                    <Link href={`/${school.slug}/register`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-3 h-3" />
                        Choose a different account type
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
