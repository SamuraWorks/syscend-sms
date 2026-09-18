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
import { Users, Shield, CheckCircle2, ChevronLeft } from 'lucide-react';

const verifySchema = z.object({
    student_id: z.string().min(1, "Child's Student ID is required"),
    surname: z.string().min(1, "Child's surname is required"),
    email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
    phone: z.string().min(7, 'Phone number is required'),
});

const completeSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type VerifyFormData = z.infer<typeof verifySchema>;
type CompleteFormData = z.infer<typeof completeSchema>;

interface School { id: number; name: string; slug: string; code: string | null; }
interface Child { name: string; class: string; stream: string; }
interface VerifiedData { guardian_name: string; guardian_email?: string; children: Child[]; message: string; verify_token: string; }
interface AlreadyRegisteredData { guardian_name: string; children: Child[]; message: string; }
interface ParentRegistrationProps { school: School; verified?: VerifiedData; already_registered?: AlreadyRegisteredData; flash?: { success?: string; error?: string }; [key: string]: unknown; }

type RegState = 'initial' | 'verifying' | 'verified' | 'already_registered' | 'failed' | 'creating';

export default function ParentRegistration({ school, verified, already_registered }: ParentRegistrationProps) {
    const { flash } = usePage<ParentRegistrationProps>().props;
    const [state, setState] = useState<RegState>(verified ? 'verified' : already_registered ? 'already_registered' : 'initial');

    const verifyForm = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        defaultValues: { student_id: '', surname: '', email: '', phone: '' },
    });

    const completeForm = useForm<CompleteFormData>({
        resolver: zodResolver(completeSchema),
        defaultValues: { password: '', password_confirmation: '' },
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        if (verified) { setState('verified'); toast.success(verified.message); }
        if (already_registered) { setState('already_registered'); toast.info(already_registered.message); }
    }, [verified, already_registered]);

    const onVerify = (data: VerifyFormData) => {
        setState('verifying');
        router.post(`/${school.slug}/register/parent/verify`, data, {
            onError: (errs) => {
                setState('failed');
                if (errs.email) verifyForm.setError('email', { message: errs.email });
                if (errs.student_id) verifyForm.setError('student_id', { message: errs.student_id });
                if (errs.surname) verifyForm.setError('surname', { message: errs.surname });
                if (errs.phone) verifyForm.setError('phone', { message: errs.phone });
                if (errs.message) toast.error(errs.message);
            },
        });
    };

    const onComplete = (data: CompleteFormData) => {
        setState('creating');
        router.post(`/${school.slug}/register/parent/complete`, data, {
            onError: (errs) => {
                setState('verified');
                Object.entries(errs).forEach(([field, message]) => {
                    if (field === 'message') { toast.error(message as string); return; }
                    completeForm.setError(field as keyof CompleteFormData, { message });
                });
            },
        });
    };

    return (
        <AuthLayout>
            <Head title={`Parent Registration — ${school.name}`} />
            <div className="w-full max-w-md">
                <Link href={`/${school.slug}/register`} className="block text-center mb-8">
                    <span className="inline-flex w-16 h-16 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/10 mb-4">
                        <img src="/images/logo.png" alt="Syscend Campus" className="inline-block w-full h-full object-contain [filter:none]" />
                    </span>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Parent Registration</h1>
                    <p className="text-sm text-muted-foreground mt-1">{school.name}</p>
                </Link>

                <Card className="shadow-xl border-0 bg-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                            {state === 'verified' || state === 'creating' ? <Shield className="w-5 h-5 text-[#1f66f5]" /> : <Users className="w-5 h-5 text-primary" />}
                            {state === 'verified' || state === 'creating' ? 'Create Your Account' : 'Verify Your Identity'}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            {state === 'verified' || state === 'creating'
                                ? 'Your family records have been found. Create your account password below.'
                                : state === 'already_registered'
                                    ? 'This record already has an account.'
                                    : 'Confirm your child\'s details together with the email and phone number your school has on file.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {state === 'already_registered' && already_registered ? (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Account Already Exists</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{already_registered.message}</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{already_registered.guardian_name}</p>
                                        {already_registered.children.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Your Children:</p>
                                                {already_registered.children.map((child, i) => (
                                                    <p key={i} className="text-sm text-amber-700 dark:text-amber-400">
                                                        {child.name} — {child.class}{child.stream ? ` (${child.stream})` : ''}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        <Button asChild variant="outline" className="w-full mt-4">
                                            <Link href="/login">Sign in to your account</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : state === 'verified' || state === 'creating' ? (
                            <>
                                {verified && (
                                    <div className="bg-[#1f66f5]/5 border border-[#1f66f5]/25 rounded-lg p-4 mb-4">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-[#1f66f5] mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Registry Match Found</p>
                                                <p className="text-sm text-slate-700 mt-1">{verified.guardian_name}</p>
                                                {verified.guardian_email && (
                                                    <p className="text-xs text-slate-600">{verified.guardian_email}</p>
                                                )}
                                                {verified.children.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-slate-600 font-medium">Your Children:</p>
                                                        {verified.children.map((child, i) => (
                                                            <p key={i} className="text-sm text-slate-700">
                                                                {child.name} — {child.class}{child.stream ? ` (${child.stream})` : ''}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <form onSubmit={completeForm.handleSubmit(onComplete)} className="space-y-4" noValidate>
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
                                    <Label htmlFor="student_id" className="text-sm font-medium">
                                        Child's Student ID <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="student_id" placeholder="As shown on the school registry" className="h-10" {...verifyForm.register('student_id')} />
                                    {verifyForm.formState.errors.student_id && <p className="text-xs text-red-500">{verifyForm.formState.errors.student_id.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="surname" className="text-sm font-medium">
                                        Child's Surname <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="surname" placeholder="Child's registered last name" className="h-10" {...verifyForm.register('surname')} />
                                    {verifyForm.formState.errors.surname && <p className="text-xs text-red-500">{verifyForm.formState.errors.surname.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium">
                                        Your Email Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="email" type="email" placeholder="The email your school has on file" className="h-10" {...verifyForm.register('email')} />
                                    {verifyForm.formState.errors.email && <p className="text-xs text-red-500">{verifyForm.formState.errors.email.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-sm font-medium">
                                        Your Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="phone" type="tel" placeholder="The phone number your school has on file" className="h-10" {...verifyForm.register('phone')} />
                                    {verifyForm.formState.errors.phone && <p className="text-xs text-red-500">{verifyForm.formState.errors.phone.message}</p>}
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
