import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
    ArrowRight, CheckCircle, Shield, Users, GraduationCap, Building2,
    Globe, Phone, Mail, Calendar, ChevronLeft, MessageSquare,
} from 'lucide-react';

const SCHOOL_TYPES = [
    { value: 'government', label: 'Government' },
    { value: 'government_assisted', label: 'Government-Assisted' },
    { value: 'private', label: 'Private' },
    { value: 'community', label: 'Community' },
    { value: 'faith_based', label: 'Faith-Based' },
];
const SCHOOL_LEVELS = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'primary', label: 'Primary' },
    { value: 'junior_secondary', label: 'Junior Secondary' },
    { value: 'senior_secondary', label: 'Senior Secondary' },
    { value: 'combined', label: 'Combined School' },
];
const POSITIONS = [
    { value: 'proprietor', label: 'Proprietor' },
    { value: 'principal', label: 'Principal / Headteacher' },
    { value: 'school_admin', label: 'School Administrator' },
    { value: 'ict_officer', label: 'ICT Officer' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'other', label: 'Other' },
];
const DISTRICTS = [
    'Bo', 'Bombali', 'Bonthe', 'Falaba', 'Farmbuna', 'Kailahun', 'Kambia',
    'Kenema', 'Koinadugu', 'Kono', 'Moyamba', 'Port Loko', 'Pujehun',
    'Tonkolili', 'Western Area Rural', 'Western Area Urban',
];
const MODULES = [
    'Admissions', 'Student Management', 'Parent Portal', 'Teacher Portal',
    'Attendance', 'Examinations', 'Results', 'Report Cards',
    'Fees & Finance', 'Payroll', 'Library', 'Hostel',
    'Transport', 'Communication', 'SMS Notifications', 'Mobile Money Integration',
    'Ministry Reporting', 'National Examinations (NPSE / BECE / WASSCE)', 'Other',
];
const MANAGEMENT = [
    { value: 'paper', label: 'Paper Records' },
    { value: 'excel', label: 'Microsoft Excel' },
    { value: 'another_system', label: 'Another School Management System' },
    { value: 'custom_software', label: 'Custom Software' },
    { value: 'other', label: 'Other' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['Morning (8-11)', 'Midday (11-2)', 'Afternoon (2-5)', 'Evening (5+)'];

const STEPS = ['School Info', 'Contact', 'Needs', 'Preferences'];

export default function RequestDemo() {
    const [step, setStep] = useState(0);
    const form = useForm({
        school_name: '', school_type: '', school_level: '', district: '',
        number_of_students: '', number_of_teachers: '',
        contact_name: '', contact_position: '', contact_email: '',
        contact_phone: '', contact_whatsapp: '',
        modules_of_interest: [] as string[],
        current_management: '', biggest_challenge: '',
        preferred_contact_method: '', preferred_day: '', preferred_time: '',
    });

    function toggleModule(m: string) {
        const current = form.data.modules_of_interest;
        form.setData('modules_of_interest', current.includes(m) ? current.filter(x => x !== m) : [...current, m]);
    }

    function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
    function prev() { setStep(s => Math.max(s - 1, 0)); }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/request-demo');
    }

    return (
        <div className="landing">
            <Head title="Request a Demo — Syscend Campus" />
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
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Request a Personalized Demo</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
                            We&apos;ll walk you through Syscend Campus using your own class groups — attendance,
                            fees, CA marks, national exams and Ministry reports.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Free Setup</span>
                            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Training Included</span>
                            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> Sierra Leone Ready</span>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Form */}
                        <div className="lg:col-span-2">
                            {/* Progress */}
                            <div className="flex items-center gap-2 mb-6">
                                {STEPS.map((s, i) => (
                                    <div key={s} className="flex items-center gap-2 flex-1">
                                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                                            i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                                            {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                        </div>
                                        <span className={cn('text-xs font-medium hidden sm:inline', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
                                        {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5', i < step ? 'bg-primary' : 'bg-muted')} />}
                                    </div>
                                ))}
                            </div>

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
                                {/* Step 1: School Info */}
                                {step === 0 && (
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">School Information</CardTitle><CardDescription>Tell us about your school.</CardDescription></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div><Label>School Name *</Label><Input value={form.data.school_name} onChange={e => form.setData('school_name', e.target.value)} placeholder="e.g. Freetown International Academy" />{form.errors.school_name && <p className="text-xs text-red-500 mt-1">{form.errors.school_name}</p>}</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label>School Type *</Label><Select value={form.data.school_type} onValueChange={v => form.setData('school_type', v)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{SCHOOL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>{form.errors.school_type && <p className="text-xs text-red-500 mt-1">{form.errors.school_type}</p>}</div>
                                                <div><Label>School Level *</Label><Select value={form.data.school_level} onValueChange={v => form.setData('school_level', v)}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent>{SCHOOL_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select>{form.errors.school_level && <p className="text-xs text-red-500 mt-1">{form.errors.school_level}</p>}</div>
                                            </div>
                                            <div><Label>District *</Label><Select value={form.data.district} onValueChange={v => form.setData('district', v)}><SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger><SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>{form.errors.district && <p className="text-xs text-red-500 mt-1">{form.errors.district}</p>}</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label>Number of Students</Label><Input type="number" min="1" value={form.data.number_of_students} onChange={e => form.setData('number_of_students', e.target.value)} placeholder="e.g. 500" /></div>
                                                <div><Label>Number of Teachers</Label><Input type="number" min="1" value={form.data.number_of_teachers} onChange={e => form.setData('number_of_teachers', e.target.value)} placeholder="e.g. 30" /></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 2: Contact */}
                                {step === 1 && (
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Contact Information</CardTitle><CardDescription>How can we reach you?</CardDescription></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div><Label>Full Name *</Label><Input value={form.data.contact_name} onChange={e => form.setData('contact_name', e.target.value)} />{form.errors.contact_name && <p className="text-xs text-red-500 mt-1">{form.errors.contact_name}</p>}</div>
                                            <div><Label>Position *</Label><Select value={form.data.contact_position} onValueChange={v => form.setData('contact_position', v)}><SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger><SelectContent>{POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select>{form.errors.contact_position && <p className="text-xs text-red-500 mt-1">{form.errors.contact_position}</p>}</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label>Email Address *</Label><Input type="email" value={form.data.contact_email} onChange={e => form.setData('contact_email', e.target.value)} />{form.errors.contact_email && <p className="text-xs text-red-500 mt-1">{form.errors.contact_email}</p>}</div>
                                                <div><Label>Phone Number *</Label><Input value={form.data.contact_phone} onChange={e => form.setData('contact_phone', e.target.value)} placeholder="+232..." />{form.errors.contact_phone && <p className="text-xs text-red-500 mt-1">{form.errors.contact_phone}</p>}</div>
                                            </div>
                                            <div><Label>WhatsApp Number</Label><Input value={form.data.contact_whatsapp} onChange={e => form.setData('contact_whatsapp', e.target.value)} placeholder="+232..." /></div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 3: Needs */}
                                {step === 2 && (
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">School Needs</CardTitle><CardDescription>What modules are you interested in?</CardDescription></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <Label>What are you interested in? *</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                    {MODULES.map(m => (
                                                        <label key={m} className={cn('flex items-center gap-2.5 rounded-lg border p-2.5 text-sm cursor-pointer transition-colors',
                                                            form.data.modules_of_interest.includes(m) ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent')}>
                                                            <Checkbox checked={form.data.modules_of_interest.includes(m)} onCheckedChange={() => toggleModule(m)} />
                                                            <span>{m}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {form.errors.modules_of_interest && <p className="text-xs text-red-500 mt-1">{form.errors.modules_of_interest}</p>}
                                            </div>
                                            <div>
                                                <Label>How do you currently manage your school? *</Label>
                                                <Select value={form.data.current_management} onValueChange={v => form.setData('current_management', v)}><SelectTrigger className="mt-2"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{MANAGEMENT.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
                                                {form.errors.current_management && <p className="text-xs text-red-500 mt-1">{form.errors.current_management}</p>}
                                            </div>
                                            <div><Label>Biggest Challenge</Label><Textarea rows={4} value={form.data.biggest_challenge} onChange={e => form.setData('biggest_challenge', e.target.value)} placeholder="Tell us the biggest challenges your school faces so we can prepare a demo that focuses on your needs..." /></div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Step 4: Preferences */}
                                {step === 3 && (
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Preferences</CardTitle><CardDescription>How would you like us to contact you?</CardDescription></CardHeader>
                                        <CardContent className="space-y-5">
                                            <div>
                                                <Label>Preferred Contact Method *</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                                    {[{ v: 'phone', l: 'Phone Call', i: Phone }, { v: 'whatsapp', l: 'WhatsApp', i: MessageSquare }, { v: 'email', l: 'Email', i: Mail }].map(({ v, l, i: Icon }) => (
                                                        <button key={v} type="button" onClick={() => form.setData('preferred_contact_method', v)}
                                                            className={cn('flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
                                                                form.data.preferred_contact_method === v ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent')}>
                                                            <Icon className="w-5 h-5" />{l}
                                                        </button>
                                                    ))}
                                                </div>
                                                {form.errors.preferred_contact_method && <p className="text-xs text-red-500 mt-1">{form.errors.preferred_contact_method}</p>}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div><Label>Preferred Day</Label><Select value={form.data.preferred_day} onValueChange={v => form.setData('preferred_day', v)}><SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                                                <div><Label>Preferred Time</Label><Select value={form.data.preferred_time} onValueChange={v => form.setData('preferred_time', v)}><SelectTrigger><SelectValue placeholder="Any time" /></SelectTrigger><SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">This is only a preference. Our team will confirm the final schedule after contacting you.</p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Nav buttons */}
                                <div className="flex items-center justify-between mt-6">
                                    {step > 0 ? <Button type="button" variant="outline" onClick={prev}>Previous</Button> : <div />}
                                    {step < STEPS.length - 1 ? (
                                        <Button type="button" onClick={next} className="gap-2">Next <ArrowRight className="w-4 h-4" /></Button>
                                    ) : (
                                        <Button type="submit" disabled={form.processing} className="gap-2 bg-primary text-primary-foreground">
                                            {form.processing ? 'Submitting...' : 'Request My Demo'} <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <h3 className="font-semibold">Why Request a Demo?</h3>
                                    <ul className="space-y-3 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Personalized walkthrough for your school type</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> See NPSE, BECE & WASSCE exam features</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Free setup and training for your team</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Multi-school data isolation guaranteed</li>
                                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Ministry reporting integration built-in</li>
                                    </ul>
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
