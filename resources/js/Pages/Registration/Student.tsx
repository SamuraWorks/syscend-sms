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
import { UserCheck, Shield, CheckCircle2, ChevronLeft } from 'lucide-react';

const verifySchema = z.object({
    student_id:  z.string().min(1, 'Student ID is required'),
    surname:     z.string().min(2, 'Surname is required'),
    other_names: z.string().min(2, 'Other names are required'),
    email:       z.string().email('Please enter a valid email address').optional().or(z.literal('')),
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
interface VerifiedData { student_name: string; class: string; section: string; message: string; verify_token: string; }
interface StudentRegistrationProps { school: School; verified?: VerifiedData; flash?: { success?: string; error?: string }; [key: string]: unknown; }

type RegState = 'initial' | 'verifying' | 'verified' | 'failed' | 'creating';

export default function StudentRegistration({ school, verified }: StudentRegistrationProps) {
    const { flash } = usePage<StudentRegistrationProps>().props;
    const [state, setState] = useState<RegState>(verified ? 'verified' : 'initial');
    const [requiresEmail, setRequiresEmail] = useState(false);

    const verifyForm = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        defaultValues: { student_id: '', surname: '', other_names: '', email: '' },
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
        router.post(`/${school.slug}/register/student/verify`, data, {
            onError: (errs) => {
                setState('failed');
                if (errs.student_id) verifyForm.setError('student_id', { message: errs.student_id });
                if (errs.surname) verifyForm.setError('surname', { message: errs.surname });
                if (errs.other_names) verifyForm.setError('other_names', { message: errs.other_names });
                if (errs.email) { verifyForm.setError('email', { message: errs.email }); setRequiresEmail(true); }
            },
        });
    };

    const onComplete = (data: CompleteFormData) => {
        setState('creating');
        router.post(`/${school.slug}/register/student/complete`, data, {
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
            <Head title={`Student Registration — ${school.name}`} />
            <div className="w-full max-w-md">
                <Link href={`/${school.slug}/register`} className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img src="/images/logo.png" alt="Syscend Campus" className="inline-block w-full h-full object-contain [filter:none]" />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Student Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">{school.name}</p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            {state === 'verified' || state === 'creating' ? <Shield className="w-5 h-5 text-[#1f66f5]" /> : <UserCheck className="w-5 h-5 text-primary" />}
                            {state === 'verified' || state === 'creating' ? 'Create Your Account' : 'Verify Your Identity'}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {state === 'verified' || state === 'creating'
                                ? 'Your school record has been found. Create your account password below.'
                                : 'Enter your Student ID and full name to verify your school record.'}
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
                                                <p className="text-sm text-slate-700 mt-1">{verified.student_name}</p>
                                                <p className="text-sm text-slate-600">{verified.class}{verified.section ? ` — ${verified.section}` : ''}</p>
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
                                    <Label htmlFor="student_id" className="text-sm font-medium">Student ID / Admission No.</Label>
                                    <Input id="student_id" placeholder="e.g. ADM-2026-0002" className="h-10" {...verifyForm.register('student_id')} />
                                    {verifyForm.formState.errors.student_id && <p className="text-xs text-red-500">{verifyForm.formState.errors.student_id.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="surname" className="text-sm font-medium">Surname</Label>
                                        <Input id="surname" placeholder="e.g. Koroma" className="h-10" {...verifyForm.register('surname')} />
                                        {verifyForm.formState.errors.surname && <p className="text-xs text-red-500">{verifyForm.formState.errors.surname.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="other_names" className="text-sm font-medium">Other Names</Label>
                                        <Input id="other_names" placeholder="e.g. Aminata" className="h-10" {...verifyForm.register('other_names')} />
                                        {verifyForm.formState.errors.other_names && <p className="text-xs text-red-500">{verifyForm.formState.errors.other_names.message}</p>}
                                    </div>
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
