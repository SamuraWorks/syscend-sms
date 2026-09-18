import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowRight, CheckCircle, ChevronLeft, WifiOff, ShieldCheck, GraduationCap, Mail, Phone,
} from 'lucide-react';

export default function StartTrial() {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/start-trial');
    }

    return (
        <div className="landing">
            <Head title="Start Your Free Trial — Syscend Campus" />
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background">
                {/* Header */}
                <header className="border-b border-border bg-card">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <ChevronLeft className="w-4 h-4" /> Back to Home
                        </Link>
                        <span className="text-sm font-medium text-muted-foreground">Syscend Campus</span>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                            Start your school&apos;s free trial
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
                            Create your school on Syscend Campus and we&apos;ll activate a 14-day free trial
                            right away. No card needed, no sales call — set up your school and go.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> 14-day free trial</span>
                            <span className="flex items-center gap-1.5"><WifiOff className="w-4 h-4 text-primary" /> Works offline</span>
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Sierra Leone Ready</span>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={submit}>
                                {Object.keys(form.errors).length > 0 && (
                                    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                                        <p className="font-medium mb-1">Please fix the following errors:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {Object.entries(form.errors).map(([field, msg]) => (
                                                <li key={field}>{msg as string}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Your School</CardTitle>
                                        <CardDescription>Basic details — you can add everything else in the setup wizard.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>School Name *</Label>
                                            <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="e.g. Freetown International Academy" />
                                            {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>City / Town</Label>
                                                <Input value={form.data.city} onChange={e => form.setData('city', e.target.value)} placeholder="e.g. Freetown" />
                                                {form.errors.city && <p className="text-xs text-red-500 mt-1">{form.errors.city}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>School Email</Label>
                                                <Input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} placeholder="office@school.edu.sl" />
                                                {form.errors.email && <p className="text-xs text-red-500 mt-1">{form.errors.email}</p>}
                                            </div>
                                            <div>
                                                <Label>School Phone</Label>
                                                <Input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="+232..." />
                                                {form.errors.phone && <p className="text-xs text-red-500 mt-1">{form.errors.phone}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Address</Label>
                                            <Input value={form.data.address} onChange={e => form.setData('address', e.target.value)} placeholder="Street address, chiefdom or area" />
                                            {form.errors.address && <p className="text-xs text-red-500 mt-1">{form.errors.address}</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-base">School Administrator</CardTitle>
                                        <CardDescription>This becomes your school&apos;s administrator account on the platform.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Full Name *</Label>
                                            <Input value={form.data.admin_name} onChange={e => form.setData('admin_name', e.target.value)} />
                                            {form.errors.admin_name && <p className="text-xs text-red-500 mt-1">{form.errors.admin_name}</p>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Email Address *</Label>
                                                <Input type="email" value={form.data.admin_email} onChange={e => form.setData('admin_email', e.target.value)} />
                                                {form.errors.admin_email && <p className="text-xs text-red-500 mt-1">{form.errors.admin_email}</p>}
                                            </div>
                                            <div>
                                                <Label>Phone Number</Label>
                                                <Input value={form.data.admin_phone} onChange={e => form.setData('admin_phone', e.target.value)} placeholder="+232..." />
                                                {form.errors.admin_phone && <p className="text-xs text-red-500 mt-1">{form.errors.admin_phone}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Password *</Label>
                                                <Input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} placeholder="At least 8 characters" />
                                                {form.errors.password && <p className="text-xs text-red-500 mt-1">{form.errors.password}</p>}
                                            </div>
                                            <div>
                                                <Label>Confirm Password *</Label>
                                                <Input type="password" value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} />
                                                {form.errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{form.errors.password_confirmation}</p>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        By continuing you agree to our{' '}
                                        <Link href="/terms" className="font-medium text-primary hover:text-primary/80">Terms</Link>{' '}
                                        and{' '}
                                        <Link href="/privacy" className="font-medium text-primary hover:text-primary/80">Privacy Policy</Link>.
                                    </p>
                                    <Button type="submit" disabled={form.processing} className="gap-2 bg-primary text-primary-foreground">
                                        {form.processing ? 'Creating your school...' : 'Start my free trial'} <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <h3 className="font-semibold">What you get</h3>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> 14-day free trial on the full platform</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Students, attendance, fees, staff & exams</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> NPSE, BECE & WASSCE tools built in</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Works offline, syncs when back online</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Guided school setup wizard</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> No card required</li>
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Prefer a guided demo?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Book a personalised walkthrough and we&apos;ll set it up with your own class groups first.
                                    </p>
                                    <Link href="/request-demo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80">
                                        Book a demo <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6 space-y-3">
                                    <h3 className="font-semibold">Questions?</h3>
                                    <p className="text-sm text-muted-foreground">Contact us directly:</p>
                                    <div className="space-y-2 text-sm">
                                        <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> syscend@gmail.com</p>
                                        <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> +232 79 630 777</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}