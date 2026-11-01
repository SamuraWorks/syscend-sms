import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, Link } from '@inertiajs/react';
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Settings, Building2, Palette, GraduationCap, Bell, Clock,
    Save, Upload, CheckCircle, AlertCircle, ChevronRight, ExternalLink,
} from 'lucide-react';

interface SchoolData {
    id: number; name: string; email: string | null; phone: string | null;
    address: string | null; city: string | null; state: string | null;
    country: string; timezone: string; currency: string; language: string; logo: string | null;
    is_configured: boolean;
}
type TimeSettings = {
    id: number; opening_time: string; closing_time: string; working_days: string;
    timezone: string | null; clock_format: string; day_start: string; day_end: string;
} | null;
interface Props {
    school: SchoolData;
    logoUrl: string | null;
    settings: Record<string, string>;
    setupProgress: string[];
    isConfigured: boolean;
    timeSettings: TimeSettings;
    periods: Array<{ id: number; name: string; start_time: string; end_time: string; duration_minutes: number | null; is_break: boolean; is_active: boolean; sort_order: number; event_type?: { name: string; color: string | null } | null }>;
    academicYear: { id: number; name: string } | null;
}

const SETUP_STEPS = [
    { key: 'profile',            label: 'School Profile',      required: true },
    { key: 'academic_structure', label: 'Academic Structure',  required: true },
    { key: 'streams',            label: 'Streams & Sections',  required: false },
    { key: 'academic_year',      label: 'Academic Year',       required: true },
    { key: 'assessment',         label: 'Assessment Setup',    required: true },
    { key: 'subjects',           label: 'Subjects',            required: false },
    { key: 'grading',            label: 'Grading & Promotion', required: true },
    { key: 'branding',           label: 'Branding',            required: false },
    { key: 'ready',              label: 'School Ready',        required: false },
];

const TABS = [
    { id: 'general',       label: 'General',       icon: Building2 },
    { id: 'branding',      label: 'Branding',       icon: Palette },
    { id: 'academic',      label: 'Academic',       icon: GraduationCap },
    { id: 'school-time',   label: 'School Time',    icon: Clock },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
] as const;

type TabId = typeof TABS[number]['id'];

const TIMEZONES = [
    'UTC', 'Africa/Freetown', 'Africa/Accra', 'Africa/Lagos',
    'Europe/London', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Africa/Nairobi', 'Africa/Cairo', 'Australia/Sydney',
];

const CURRENCIES = ['SLL','USD','EUR','GBP','GHS','NGN','LRD','AUD','CAD'];
const LANGUAGES  = [{ value:'en', label:'English' },{ value:'kri', label:'Krio' },{ value:'ar', label:'Arabic' }];
const GRADING_SCALES = [
    { value:'percentage', label:'Percentage (0–100%)' },
    { value:'letter',     label:'Letter (A/B/C/D/F)' },
    { value:'gpa',        label:'GPA (4.0 scale)' },
];
const DAYS_OF_WEEK = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!checked)}
            className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700')}>
            <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-4' : 'translate-x-0.5')} />
        </button>
    );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5">
            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            <button type="button" onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                    checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                )}>
                <span className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    'translate-y-0.5',
                    checked ? 'translate-x-4' : 'translate-x-0.5'
                )} />
            </button>
        </div>
    );
}

function SuccessBanner({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {message}
        </div>
    );
}

/* ── Setup Progress Banner ── */
function SetupProgressBanner({ setupProgress, isConfigured }: { setupProgress: string[]; isConfigured: boolean }) {
    const required = SETUP_STEPS.filter(s => s.required);
    const requiredDone = required.filter(s => setupProgress.includes(s.key)).length;
    const allDone = requiredDone === required.length;
    const percentage = Math.round((requiredDone / required.length) * 100);

    if (isConfigured && allDone) return null;

    return (
        <Card className={cn('border-2', allDone ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20')}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {allDone ? <CheckCircle className="w-4 h-4 text-amber-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {allDone ? 'Setup Almost Complete' : 'School Setup Incomplete'}
                            </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                            {allDone
                                ? 'All required steps done. Complete optional steps or finish setup.'
                                : `${requiredDone}/${required.length} required steps completed (${percentage}%)`}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {SETUP_STEPS.filter(s => s.required).map(step => (
                                <Badge key={step.key} variant={setupProgress.includes(step.key) ? 'default' : 'outline'}
                                    className={cn('text-[10px] px-1.5 py-0',
                                        setupProgress.includes(step.key)
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'
                                    )}>
                                    {setupProgress.includes(step.key) ? '✓' : '○'} {step.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <Link href="/school/school-setup"
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                        Open Wizard <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

/* ── General Tab ── */
function GeneralTab({ school }: { school: SchoolData }) {
    const form = useForm({
        name: school.name, email: school.email ?? '', phone: school.phone ?? '',
        address: school.address ?? '', city: school.city ?? '', state: school.state ?? '',
        country: school.country, timezone: school.timezone,
        currency: school.currency, language: school.language,
    });
    const { flash } = usePage<any>().props;

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/settings/general'); }}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">School Information</CardTitle>
                    <CardDescription>Basic identity and contact details for your school.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {flash?.success && <SuccessBanner message={flash.success} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Label>School Name *</Label>
                            <Input value={form.data.name} onChange={e => form.setData('name', e.target.value)} />
                            {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} />
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Address</Label>
                            <Textarea rows={2} value={form.data.address} onChange={e => form.setData('address', e.target.value)} />
                        </div>
                        <div>
                            <Label>City</Label>
                            <Input value={form.data.city} onChange={e => form.setData('city', e.target.value)} />
                        </div>
                        <div>
                            <Label>State / Region</Label>
                            <Input value={form.data.state} onChange={e => form.setData('state', e.target.value)} />
                        </div>
                        <div>
                            <Label>Country</Label>
                            <Input value={form.data.country} onChange={e => form.setData('country', e.target.value)} />
                        </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Locale & Currency</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>Timezone</Label>
                                <Select value={form.data.timezone} onValueChange={v => form.setData('timezone', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Currency</Label>
                                <Select value={form.data.currency} onValueChange={v => form.setData('currency', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Language</Label>
                                <Select value={form.data.language} onValueChange={v => form.setData('language', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="w-4 h-4" /> Save General Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ── Branding Tab ── */
function BrandingTab({ logoUrl, settings }: { logoUrl: string | null; settings: Record<string, string> }) {
    const form = useForm<{
        logo: File | null; favicon: File | null;
        tagline: string; footer_text: string; primary_color: string; secondary_color: string;
    }>({
        logo: null, favicon: null,
        tagline:       settings.tagline       ?? '',
        footer_text:   settings.footer_text   ?? '',
        primary_color: settings.primary_color ?? '#6366f1',
        secondary_color: settings.secondary_color ?? '#0ea5e9',
    });
    const [logoPreview,    setLogoPreview]    = useState<string | null>(logoUrl);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(
        settings.favicon ? `/storage/${settings.favicon}` : null
    );
    const logoRef    = useRef<HTMLInputElement>(null);
    const faviconRef = useRef<HTMLInputElement>(null);
    const { flash }  = usePage<any>().props;

    function handleFile(field: 'logo' | 'favicon', file: File | null) {
        if (!file) return;
        form.setData(field, file);
        const url = URL.createObjectURL(file);
        if (field === 'logo')    setLogoPreview(url);
        if (field === 'favicon') setFaviconPreview(url);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/settings/branding', { forceFormData: true });
    }

    return (
        <form onSubmit={submit}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Branding & Appearance</CardTitle>
                    <CardDescription>Upload your school logo, favicon and set brand colours.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {flash?.success && <SuccessBanner message={flash.success} />}
                    <div>
                        <Label className="block mb-3">School Logo</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                                {logoPreview
                                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                                    : <span className="text-xs text-slate-400 text-center px-2">No logo</span>}
                            </div>
                            <div>
                                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                                    onChange={e => handleFile('logo', e.target.files?.[0] ?? null)} />
                                <Button type="button" variant="outline" size="sm" className="gap-2"
                                    onClick={() => logoRef.current?.click()}>
                                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                                </Button>
                                <p className="text-xs text-slate-400 mt-1">PNG or SVG, max 2MB.</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label className="block mb-3">Favicon</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                                {faviconPreview
                                    ? <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain p-1" />
                                    : <span className="text-[10px] text-slate-400">ico</span>}
                            </div>
                            <div>
                                <input ref={faviconRef} type="file" accept="image/*" className="hidden"
                                    onChange={e => handleFile('favicon', e.target.files?.[0] ?? null)} />
                                <Button type="button" variant="outline" size="sm" className="gap-2"
                                    onClick={() => faviconRef.current?.click()}>
                                    <Upload className="w-3.5 h-3.5" /> Upload Favicon
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <Label>School Tagline / Motto</Label>
                            <Input value={form.data.tagline} onChange={e => form.setData('tagline', e.target.value)}
                                placeholder="e.g. Excellence in Education" />
                        </div>
                        <div>
                            <Label>Brand Primary Color</Label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={form.data.primary_color}
                                    onChange={e => form.setData('primary_color', e.target.value)}
                                    className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5" />
                                <Input value={form.data.primary_color}
                                    onChange={e => form.setData('primary_color', e.target.value)}
                                    className="font-mono" placeholder="#6366f1" />
                            </div>
                        </div>
                        <div>
                            <Label>Brand Secondary Color</Label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={form.data.secondary_color}
                                    onChange={e => form.setData('secondary_color', e.target.value)}
                                    className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5" />
                                <Input value={form.data.secondary_color}
                                    onChange={e => form.setData('secondary_color', e.target.value)}
                                    className="font-mono" placeholder="#0ea5e9" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <Label>Footer Text</Label>
                            <Textarea rows={2} value={form.data.footer_text}
                                onChange={e => form.setData('footer_text', e.target.value)}
                                placeholder="© 2026 My School. All rights reserved." />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="w-4 h-4" /> Save Branding
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ── Academic Tab ── */
function AcademicTab({ settings }: { settings: Record<string, string> }) {
    const bool = (k: string) => settings[k] === '1';
    const form = useForm({
        academic_year:      settings.academic_year      ?? '',
        year_start:         settings.year_start         ?? 'January',
        terms_per_year:     settings.terms_per_year     ?? '2',
        grading_scale:      settings.grading_scale      ?? 'percentage',
        pass_mark:          settings.pass_mark          ?? '40',
        result_show_position:           settings.result_show_position ?? 'overall',
        result_position_type:           settings.result_position_type ?? 'rank',
        result_show_teacher_comment:    bool('result_show_teacher_comment'),
        result_show_principal_comment:  bool('result_show_principal_comment'),
        result_show_form_master_comment: bool('result_show_form_master_comment'),
        result_show_conduct:            bool('result_show_conduct'),
        result_show_behaviour:          bool('result_show_behaviour'),
    });
    const { flash } = usePage<any>().props;
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/settings/academic'); }}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Academic Configuration</CardTitle>
                    <CardDescription>Set your academic year, grading system and term structure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {flash?.success && <SuccessBanner message={flash.success} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Current Academic Year</Label>
                            <Input value={form.data.academic_year}
                                onChange={e => form.setData('academic_year', e.target.value)}
                                placeholder="e.g. 2025-2026" />
                        </div>
                        <div>
                            <Label>Academic Year Starts</Label>
                            <Select value={form.data.year_start} onValueChange={v => form.setData('year_start', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Terms per Year</Label>
                            <Select value={form.data.terms_per_year} onValueChange={v => form.setData('terms_per_year', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['1','2','3','4'].map(n => <SelectItem key={n} value={n}>{n} {n === '1' ? 'term' : 'terms'}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Grading Scale</Label>
                            <Select value={form.data.grading_scale} onValueChange={v => form.setData('grading_scale', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {GRADING_SCALES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Pass Mark (%)</Label>
                            <Input type="number" min="0" max="100"
                                value={form.data.pass_mark}
                                onChange={e => form.setData('pass_mark', e.target.value)} />
                        </div>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Report Card Display</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Show Position</Label>
                                <Select value={form.data.result_show_position} onValueChange={v => form.setData('result_show_position', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="overall">Overall only</SelectItem>
                                        <SelectItem value="class">Class position</SelectItem>
                                        <SelectItem value="subject">Subject-level</SelectItem>
                                        <SelectItem value="none">Hide positions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Position Type</Label>
                                <Select value={form.data.result_position_type} onValueChange={v => form.setData('result_position_type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rank">Rank (1, 2, 3)</SelectItem>
                                        <SelectItem value="position">Ordinal (1st, 2nd, 3rd)</SelectItem>
                                        <SelectItem value="dense">Dense (ties share rank)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <ToggleRow label="Teacher Comments" checked={form.data.result_show_teacher_comment} onChange={v => form.setData('result_show_teacher_comment', v)} />
                            <ToggleRow label="Form Master Comments" checked={form.data.result_show_form_master_comment} onChange={v => form.setData('result_show_form_master_comment', v)} />
                            <ToggleRow label="Principal Comments" checked={form.data.result_show_principal_comment} onChange={v => form.setData('result_show_principal_comment', v)} />
                            <ToggleRow label="Conduct Score" checked={form.data.result_show_conduct} onChange={v => form.setData('result_show_conduct', v)} />
                            <ToggleRow label="Behaviour Rating" checked={form.data.result_show_behaviour} onChange={v => form.setData('result_show_behaviour', v)} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <a href="/school/settings/sierra-leone" className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline">
                            Sierra Leone Education Settings →
                        </a>
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="w-4 h-4" /> Save Academic Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ── School Time Tab ── */
function SchoolTimeTab({ timeSettings, periods = [], academicYear }: { timeSettings: TimeSettings; periods?: Props['periods']; academicYear: { id: number; name: string } | null }) {
    const form = useForm({
        opening_time: timeSettings?.opening_time ?? '07:30',
        closing_time: timeSettings?.closing_time ?? '15:00',
        working_days: timeSettings?.working_days ?? 'monday,tuesday,wednesday,thursday,friday',
        clock_format: timeSettings?.clock_format ?? '12h',
    });
    const { flash } = usePage<any>().props;
    const [days, setDays] = useState<string[]>(form.data.working_days.split(',').filter(Boolean));

    function toggleDay(day: string) {
        const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
        setDays(next);
        form.setData('working_days', next.join(','));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/settings/school-time');
    }

    return (
        <div className="space-y-4">
            <form onSubmit={submit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">School Hours</CardTitle>
                        <CardDescription>Configure your school's operating hours and working days.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {flash?.success && <SuccessBanner message={flash.success} />}
                        {academicYear && (
                            <Badge variant="outline" className="text-xs">Active Year: {academicYear.name}</Badge>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>School Opens</Label>
                                <Input type="time" value={form.data.opening_time}
                                    onChange={e => form.setData('opening_time', e.target.value)} />
                            </div>
                            <div>
                                <Label>School Closes</Label>
                                <Input type="time" value={form.data.closing_time}
                                    onChange={e => form.setData('closing_time', e.target.value)} />
                            </div>
                            <div>
                                <Label>Clock Format</Label>
                                <Select value={form.data.clock_format} onValueChange={v => form.setData('clock_format', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="12h">12-hour</SelectItem>
                                        <SelectItem value="24h">24-hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-2 block">Working Days</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button key={day} type="button" onClick={() => toggleDay(day)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                                            days.includes(day)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        )}>
                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing} className="gap-2">
                                <Save className="w-4 h-4" /> Save Hours
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {periods.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Schedule Periods</CardTitle>
                            <CardDescription>{periods.length} periods configured for this academic year.</CardDescription>
                        </div>
                        <Link href="/school/settings/school-time"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                            Manage <ExternalLink className="w-3 h-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {periods.map(p => (
                                <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
                                    <div className="flex items-center gap-2">
                                        {p.event_type?.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.event_type.color }} />}
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                                        {p.is_break && <Badge variant="outline" className="text-[10px]">Break</Badge>}
                                    </div>
                                    <span className="text-xs text-slate-500">{p.start_time} – {p.end_time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/* ── Notifications Tab ── */
function NotificationsTab({ settings }: { settings: Record<string, string> }) {
    const bool = (k: string) => settings[k] === '1';
    const form = useForm({
        notify_attendance_email:   bool('notify_attendance_email'),
        notify_attendance_sms:     bool('notify_attendance_sms'),
        notify_fee_due_email:      bool('notify_fee_due_email'),
        notify_fee_due_sms:        bool('notify_fee_due_sms'),
        notify_exam_email:         bool('notify_exam_email'),
        notify_exam_sms:           bool('notify_exam_sms'),
        notify_homework_email:     bool('notify_homework_email'),
        notify_homework_sms:       bool('notify_homework_sms'),
        notify_announcement_email: bool('notify_announcement_email'),
        notify_announcement_sms:   bool('notify_announcement_sms'),
    });
    const { flash } = usePage<any>().props;

    const events = [
        { label: 'Student Attendance',  email: 'notify_attendance_email',   sms: 'notify_attendance_sms' },
        { label: 'Fee Due Reminder',    email: 'notify_fee_due_email',      sms: 'notify_fee_due_sms' },
        { label: 'Exam Results',        email: 'notify_exam_email',         sms: 'notify_exam_sms' },
        { label: 'Homework Assigned',   email: 'notify_homework_email',     sms: 'notify_homework_sms' },
        { label: 'Announcements',       email: 'notify_announcement_email', sms: 'notify_announcement_sms' },
    ] as const;

    return (
        <form onSubmit={e => { e.preventDefault(); form.post('/school/settings/notifications'); }}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Notification Preferences</CardTitle>
                    <CardDescription>Choose which events trigger email and SMS notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {flash?.success && <SuccessBanner message={flash.success} />}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3 items-center">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Event</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">SMS</div>
                        {events.map(ev => (
                            <React.Fragment key={ev.label}>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{ev.label}</span>
                                <Toggle key={ev.email} checked={form.data[ev.email]}
                                    onChange={v => form.setData(ev.email, v)} />
                                <Toggle key={ev.sms} checked={form.data[ev.sms]}
                                    onChange={v => form.setData(ev.sms, v)} />
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="w-4 h-4" /> Save Preferences
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ── Main Page ── */
export default function SchoolSettingsIndex({ school, logoUrl, settings, setupProgress, isConfigured, timeSettings, periods, academicYear }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('general');

    return (
        <AppLayout title="Settings">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Settings</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your school's configuration, setup and preferences</p>
                </div>

                <SetupProgressBanner setupProgress={setupProgress} isConfigured={isConfigured} />

                <div className="flex flex-col lg:flex-row gap-6">
                    <nav className="w-full lg:w-48 shrink-0">
                        <ul className="space-y-0.5 overflow-x-auto lg:overflow-x-visible">
                            {TABS.map(t => (
                                <li key={t.id}>
                                    <button onClick={() => setActiveTab(t.id)}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                            activeTab === t.id
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                        )}>
                                        <t.icon className="w-4 h-4 shrink-0" />
                                        {t.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex-1 min-w-0">
                        {activeTab === 'general'       && <GeneralTab school={school} />}
                        {activeTab === 'branding'      && <BrandingTab logoUrl={logoUrl} settings={settings} />}
                        {activeTab === 'academic'      && <AcademicTab settings={settings} />}
                        {activeTab === 'school-time'   && <SchoolTimeTab timeSettings={timeSettings} periods={periods} academicYear={academicYear} />}
                        {activeTab === 'notifications' && <NotificationsTab settings={settings} />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
