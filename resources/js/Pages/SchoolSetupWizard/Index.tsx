import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Check,
    ChevronRight,
    ChevronLeft,
    ArrowUp,
    ArrowDown,
    GripVertical,
    School,
    Building2,
    Clock,
    Layers,
    CalendarDays,
    ClipboardCheck,
    BookOpen,
    GraduationCap,
    Palette,
    Rocket,
    Lock,
    Loader2,
    Plus,
    Trash2,
    Upload,
    SkipForward,
    RotateCcw,
    Info,
} from 'lucide-react';

const STEPS = [
    { id: 'profile', label: 'School Profile', icon: School, required: true },
    { id: 'school_operations', label: 'School Operations', icon: Clock, required: true },
    { id: 'academic_structure', label: 'Academic Structure', icon: Building2, required: true },
    { id: 'subjects', label: 'Subjects & Curriculum', icon: BookOpen, required: true },
    { id: 'academic_year', label: 'Academic Calendar & Terms', icon: CalendarDays, required: true },
    { id: 'assessment', label: 'Assessment Setup', icon: ClipboardCheck, required: true },
    { id: 'grading', label: 'Grading & Promotion', icon: GraduationCap, required: true },
    { id: 'streams', label: 'Streams & Sections', icon: Layers, required: false },
    { id: 'branding', label: 'Branding & Documents', icon: Palette, required: false },
    { id: 'ready', label: 'School Ready', icon: Rocket, required: false },
];

const STEP_INDEX = STEPS.findIndex((s) => s.id === 'ready');

const fetchJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        ...init,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || 'Request failed');
    }
    return res.json();
};

const getXsrfToken = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

const postJson = async (url: string, data: Record<string, unknown>) => {
    const csrf = getXsrfToken();
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': csrf,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || 'Request failed');
    }
    return res.json();
};

const postMultipart = async (url: string, formData: FormData) => {
    const csrf = getXsrfToken();
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': csrf,
        },
        body: formData,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || 'Request failed');
    }
    return res.json();
};

interface StepInfo {
    id: string;
    label: string;
    required: boolean;
    order: number;
    completed: boolean;
}

interface ProgressData {
    steps: StepInfo[];
    required_total: number;
    required_done: number;
    all_required: boolean;
    is_configured: boolean;
    current_step: string | null;
    summary?: Record<string, any> | null;
}

const STEP_MAP: Record<string, number> = {};
STEPS.forEach((s, i) => { STEP_MAP[s.id] = i; });

export default function SetupWizardIndex() {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [stepData, setStepData] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const currentStep = STEPS[currentIdx];

    const loadProgress = useCallback(async () => {
        try {
            const data = await fetchJson('/school/setup/progress');
            setProgress(data);
            if (data.current_step && STEP_MAP[data.current_step] !== undefined) {
                setCurrentIdx(STEP_MAP[data.current_step]);
            }
        } catch {
            toast.error('Failed to load setup progress');
        }
    }, []);

    const loadStepData = useCallback(async (stepId: string) => {
        if (stepId === 'ready') return {};
        try {
            return await fetchJson(`/school/setup/${stepId}`);
        } catch {
            toast.error('Failed to load step data');
            return {};
        }
    }, []);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await loadProgress();
            setLoading(false);
        })();
    }, [loadProgress]);

    useEffect(() => {
        (async () => {
            if (!currentStep) return;
            const data = await loadStepData(currentStep.id);
            setStepData(data);
        })();
    }, [currentIdx, currentStep, loadStepData]);

    const isCompleted = (id: string) => progress?.steps?.find((s) => s.id === id)?.completed ?? false;
    const isRequired = (id: string) => STEPS.find((s) => s.id === id)?.required ?? false;
    const canReach = (idx: number) => {
        if (idx <= currentIdx) return true;
        for (let i = currentIdx; i < idx; i++) {
            if (STEPS[i].required && !isCompleted(STEPS[i].id)) return false;
        }
        return true;
    };

    const goTo = (idx: number) => {
        if (idx >= 0 && idx < STEPS.length) {
            setCurrentIdx(idx);
        }
    };

    const goNext = () => {
        if (currentIdx < STEP_INDEX) goTo(currentIdx + 1);
    };

    const goBack = () => {
        if (currentIdx > 0) goTo(currentIdx - 1);
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            await postJson('/school/setup/complete', {});
            toast.success('School setup complete!');
            router.get('/school/reports/dashboard');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const stepContent = () => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            );
        }
        switch (currentStep.id) {
            case 'profile':
                return <ProfileStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'school_operations':
                return <SchoolOperationsStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'academic_structure':
                return <AcademicStructureStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'subjects':
                return <SubjectsStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'academic_year':
                return <AcademicYearStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'assessment':
                return <AssessmentStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'grading':
                return <GradingStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'streams':
                return <StreamsStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'branding':
                return <BrandingStep data={stepData} onSaved={loadProgress} goNext={goNext} />;
            case 'ready':
                return <ReadyStep allRequired={progress?.all_required ?? false} summary={progress?.summary} onComplete={handleComplete} saving={saving} />;
            default:
                return null;
        }
    };

    return (
        <AppLayout title="School Setup Wizard">
            <Head title="School Setup Wizard" />
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold">School Setup</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {progress?.required_done ?? 0} of {progress?.required_total ?? 0} required steps completed
                        </p>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Desktop sidebar - always visible */}
                    <aside className="w-64 shrink-0 hidden md:block">
                        <nav className="space-y-1 sticky top-4">
                            {STEPS.map((step, idx) => {
                                const done = isCompleted(step.id);
                                const active = idx === currentIdx;
                                const locked = !canReach(idx) && idx !== currentIdx;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => !locked && goTo(idx)}
                                        disabled={locked}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                            active && "bg-primary text-primary-foreground shadow-sm",
                                            !active && done && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
                                            !active && !done && !locked && "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            locked && "opacity-40 cursor-not-allowed text-muted-foreground",
                                        )}
                                    >
                                        <span className={cn(
                                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0",
                                            active && "bg-primary-foreground/20 text-primary-foreground",
                                            done && !active && "bg-emerald-500 text-white",
                                            !done && !active && "bg-muted-foreground/20 text-muted-foreground",
                                        )}>
                                            {done ? <Check className="w-3.5 h-3.5" /> : locked ? <Lock className="w-3 h-3" /> : idx + 1}
                                        </span>
                                        <span className="flex-1 truncate">{step.label}</span>
                                        {step.required && <span className="text-[10px] text-muted-foreground">REQ</span>}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Mobile step indicator - horizontal scrollable pills */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border p-3 shadow-lg">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {STEPS.map((step, idx) => {
                                const done = isCompleted(step.id);
                                const active = idx === currentIdx;
                                const locked = !canReach(idx) && idx !== currentIdx;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => !locked && goTo(idx)}
                                        disabled={locked}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                                            active && "bg-primary text-primary-foreground",
                                            !active && done && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
                                            !active && !done && !locked && "bg-muted text-muted-foreground",
                                            locked && "opacity-40 cursor-not-allowed",
                                        )}
                                    >
                                        {done && <Check className="w-3 h-3" />}
                                        {step.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 pb-16 md:pb-0">
                        <Card>
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                                        <currentStep.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{currentStep.label}</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            Step {currentIdx + 1} of {STEPS.length}
                                            {currentStep.required && <Badge variant="secondary" className="ml-2 text-[10px]">Required</Badge>}
                                            {!currentStep.required && <Badge variant="outline" className="ml-2 text-[10px]">Optional</Badge>}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6" key={currentStep.id}>
                                {stepContent()}
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between mt-4">
                            <Button
                                variant="outline"
                                onClick={goBack}
                                disabled={currentIdx === 0}
                                size="sm"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <div className="flex gap-2">
                                {!currentStep.required && currentStep.id !== 'ready' && (
                                    <Button variant="ghost" size="sm" onClick={goNext}>
                                        Skip <SkipForward className="w-4 h-4 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function SubmitButton({ saving, onClick, label = 'Save & Continue' }: { saving: boolean; onClick?: () => void; label?: string }) {
    return (
        <Button type="submit" disabled={saving} onClick={onClick} className="mt-4">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-1" />}
            {label}
        </Button>
    );
}

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <Label className="text-sm font-medium">
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <div className="mt-1.5">{children}</div>
            <FieldError msg={error} />
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return <h3 className="text-base font-semibold mt-6 mb-3 pb-2 border-b">{children}</h3>;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p>{message}</p>
        </div>
    );
}

type StepProps = { data: Record<string, unknown>; onSaved: () => Promise<void>; goNext: () => void };

function ProfileStep({ data, onSaved, goNext }: StepProps) {
    const defaults = (data as any)?.defaults || {};
    const existing = (data as any)?.data || {};

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(z.object({
            name: z.string().min(1, 'School name is required').max(200),
            short_name: z.string().max(50).optional().or(z.literal('')),
            motto: z.string().max(300).optional().or(z.literal('')),
            school_type: z.string().min(1, 'School type is required'),
            school_level: z.string().min(1, 'School level is required'),
            district_name: z.string().max(100).optional().or(z.literal('')),
            chiefdom: z.string().max(100).optional().or(z.literal('')),
            province: z.string().max(100).optional().or(z.literal('')),
            city: z.string().max(100).optional().or(z.literal('')),
            address: z.string().max(300).optional().or(z.literal('')),
            country: z.string().max(5).optional().or(z.literal('')),
            phone: z.string().max(30).optional().or(z.literal('')),
            email: z.string().email().optional().or(z.literal('')),
            website: z.string().url().optional().or(z.literal('')),
            emis_code: z.string().max(50).optional().or(z.literal('')),
            whatsapp_number: z.string().max(30).optional().or(z.literal('')),
            about_school: z.string().max(2000).optional().or(z.literal('')),
            school_mission: z.string().max(1000).optional().or(z.literal('')),
            school_vision: z.string().max(1000).optional().or(z.literal('')),
            working_days: z.string().max(50).optional().or(z.literal('')),
            school_opening_time: z.string().optional().or(z.literal('')),
            school_closing_time: z.string().optional().or(z.literal('')),
            gps_latitude: z.string().optional().or(z.literal('')),
            gps_longitude: z.string().optional().or(z.literal('')),
        })),
        defaultValues: {
            name: existing.name || '',
            short_name: existing.short_name || '',
            motto: existing.motto || '',
            school_type: existing.school_type || '',
            school_level: existing.school_level || '',
            district_name: existing.district_name || '',
            chiefdom: existing.chiefdom || '',
            province: existing.province || '',
            city: existing.city || '',
            address: existing.address || '',
            country: existing.country || defaults.country || 'SL',
            phone: existing.phone || '',
            email: existing.email || '',
            website: existing.website || '',
            emis_code: existing.emis_code || '',
            whatsapp_number: existing.whatsapp_number || '',
            about_school: existing.about_school || '',
            school_mission: existing.school_mission || '',
            school_vision: existing.school_vision || '',
            working_days: existing.working_days || 'Mon,Tue,Wed,Thu,Fri',
            school_opening_time: existing.school_opening_time || '08:00',
            school_closing_time: existing.school_closing_time || '16:00',
            gps_latitude: existing.gps_latitude || '',
            gps_longitude: existing.gps_longitude || '',
        },
    });

    const schoolType = watch('school_type');
    const schoolLevel = watch('school_level');
    const [saving, setSaving] = useState(false);

    const onSubmit = async (formData: Record<string, unknown>) => {
        setSaving(true);
        try {
            await postJson('/school/setup/profile', formData);
            toast.success('School profile saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <SectionHeader>Basic Information</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="School Name" required error={errors.name?.message}>
                    <Input {...register('name')} placeholder="e.g. Government Secondary School" />
                </Field>
                <Field label="Short Name" error={errors.short_name?.message}>
                    <Input {...register('short_name')} placeholder="e.g. GSS" />
                </Field>
            </div>
            <Field label="Motto" error={errors.motto?.message}>
                <Input {...register('motto')} placeholder="e.g. Knowledge is Power" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="School Type" required error={errors.school_type?.message}>
                    <Select value={schoolType} onValueChange={(v) => setValue('school_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="government_assisted">Government Assisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="faith_based">Faith-Based</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="School Level" required error={errors.school_level?.message}>
                    <Select value={schoolLevel} onValueChange={(v) => setValue('school_level', v)}>
                        <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="nursery">Nursery</SelectItem>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="junior_secondary">Junior Secondary</SelectItem>
                            <SelectItem value="senior_secondary">Senior Secondary</SelectItem>
                            <SelectItem value="combined">Combined</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <SectionHeader>Location</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="District" error={errors.district_name?.message}>
                    <Input {...register('district_name')} placeholder="e.g. Western Area Urban" />
                </Field>
                <Field label="Chiefdom" error={errors.chiefdom?.message}>
                    <Input {...register('chiefdom')} placeholder="e.g. Central" />
                </Field>
                <Field label="Province" error={errors.province?.message}>
                    <Input {...register('province')} placeholder="e.g. Western Area" />
                </Field>
                <Field label="City/Town" error={errors.city?.message}>
                    <Input {...register('city')} placeholder="e.g. Freetown" />
                </Field>
                <Field label="Address" error={errors.address?.message}>
                    <Input {...register('address')} placeholder="Full address" />
                </Field>
                <Field label="Country" error={errors.country?.message}>
                    <Input {...register('country')} defaultValue="SL" />
                </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="GPS Latitude" error={errors.gps_latitude?.message}>
                    <Input type="number" step="any" {...register('gps_latitude')} placeholder="e.g. 8.4841" />
                </Field>
                <Field label="GPS Longitude" error={errors.gps_longitude?.message}>
                    <Input type="number" step="any" {...register('gps_longitude')} placeholder="e.g. -13.2344" />
                </Field>
            </div>

            <SectionHeader>Contact</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Phone" error={errors.phone?.message}>
                    <Input {...register('phone')} placeholder="+232 XX XXX XXXX" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                    <Input type="email" {...register('email')} placeholder="school@example.com" />
                </Field>
                <Field label="WhatsApp Number" error={errors.whatsapp_number?.message}>
                    <Input {...register('whatsapp_number')} placeholder="+232 XX XXX XXXX" />
                </Field>
                <Field label="EMIS Code" error={errors.emis_code?.message}>
                    <Input {...register('emis_code')} placeholder="Ministry EMIS code" />
                </Field>
                <Field label="Website" error={errors.website?.message}>
                    <Input {...register('website')} placeholder="https://..." />
                </Field>
            </div>

            <SectionHeader>Operations</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Working Days" error={errors.working_days?.message}>
                    <Input {...register('working_days')} placeholder="Mon,Tue,Wed,Thu,Fri" />
                </Field>
                <Field label="Opening Time" error={errors.school_opening_time?.message}>
                    <Input type="time" {...register('school_opening_time')} />
                </Field>
                <Field label="Closing Time" error={errors.school_closing_time?.message}>
                    <Input type="time" {...register('school_closing_time')} />
                </Field>
            </div>

            <SectionHeader>About the School</SectionHeader>
            <Field label="About School" error={errors.about_school?.message}>
                <Textarea {...register('about_school')} rows={3} placeholder="Brief description of the school..." />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Mission" error={errors.school_mission?.message}>
                    <Textarea {...register('school_mission')} rows={3} placeholder="School mission statement" />
                </Field>
                <Field label="Vision" error={errors.school_vision?.message}>
                    <Textarea {...register('school_vision')} rows={3} placeholder="School vision statement" />
                </Field>
            </div>

            <SubmitButton saving={saving} />
        </form>
    );
}

function SchoolOperationsStep({ data, onSaved, goNext }: StepProps) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels: Record<string, string> = {
        monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
        friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
    };
    const dayFull: Record<string, string> = {
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
    };

    const defaults = (data as any)?.defaults || {};
    const existing = (data as any)?.data || {};
    const storedDays = Array.isArray(existing.working_days)
        ? existing.working_days
        : (existing.working_days ? String(existing.working_days).split(',').map((d: string) => d.trim().toLowerCase()) : []);

    const [workingDays, setWorkingDays] = useState<string[]>(
        storedDays.length > 0 ? storedDays : (defaults.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
    );
    const [openingTime, setOpeningTime] = useState(existing.opening_time || defaults.opening_time || '07:30');
    const [closingTime, setClosingTime] = useState(existing.closing_time || defaults.closing_time || '15:00');
    const [saving, setSaving] = useState(false);

    const toggleDay = (day: string) => {
        setWorkingDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (workingDays.length === 0) { toast.error('Select at least one working day'); return; }
        if (closingTime <= openingTime) { toast.error('Closing time must be after opening time'); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/school_operations', {
                working_days: workingDays,
                opening_time: openingTime,
                closing_time: closingTime,
            });
            toast.success('School operations saved');
            await onSaved();
            goNext();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <SectionHeader>Working Days</SectionHeader>
            <p className="text-xs text-muted-foreground -mt-2">
                Select the days classes and school activities operate. Used for timetables and attendance.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {validDays.map((day) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                            workingDays.includes(day)
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {dayLabels[day]}
                    </button>
                ))}
            </div>

            <SectionHeader>School Hours</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Opening Time" required>
                    <Input type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                </Field>
                <Field label="Closing Time" required>
                    <Input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
                </Field>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
                These hours define the school day. Timetable periods must fall within them and respect scheduled breaks.
            </p>

            <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground">
                <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
                Current selection: {workingDays.map((d) => dayFull[d] || d).join(', ') || 'None'} · {openingTime} – {closingTime}
            </div>

            <SubmitButton saving={saving} />
        </form>
    );
}

function AcademicStructureStep({ data, onSaved, goNext }: StepProps) {
    const defaults = (data as any)?.defaults || {};
    const existing = (data as any)?.existing_classes || [];
    const initialLevels: string[] = (data as any)?.selected_levels || [];

    const allLevelKeys = ['nursery', 'primary', 'junior_secondary', 'senior_secondary'] as const;
    type LevelKey = typeof allLevelKeys[number];

    const levelLabels: Record<LevelKey, string> = {
        nursery: 'Nursery',
        primary: 'Primary',
        junior_secondary: 'Junior Secondary (JSS)',
        senior_secondary: 'Senior Secondary (SSS)',
    };

    const levelDescriptions: Record<LevelKey, string> = {
        nursery: 'Nursery 1, Nursery 2, Nursery 3',
        primary: 'Class 1 through Class 6',
        junior_secondary: 'JSS 1, JSS 2, JSS 3',
        senior_secondary: 'SSS 1, SSS 2, SSS 3',
    };

    const [levels, setLevels] = useState<string[]>(initialLevels);
    const [classes, setClasses] = useState<any[]>(() => {
        if (existing.length > 0) return existing;
        const result: any[] = [];
        initialLevels.forEach((lvl) => {
            (defaults[lvl] || []).forEach((c: any, i: number) => {
                result.push({ ...c, school_level: lvl, numeric_name: (i + 1) * 10, _key: crypto.randomUUID() });
            });
        });
        return result;
    });
    const [saving, setSaving] = useState(false);

    const toggleLevel = (level: string) => {
        setLevels((prev) => {
            const wasOn = prev.includes(level);
            const next = wasOn ? prev.filter((l) => l !== level) : [...prev, level];

            if (!wasOn) {
                setClasses((cls) => {
                    const hasExisting = cls.some((c) => c.school_level === level);
                    if (hasExisting) return cls;
                    return [
                        ...cls,
                        ...(defaults[level] || []).map((c: any, i: number) => ({
                            ...c,
                            school_level: level,
                            numeric_name: cls.length + i + 1,
                            _key: crypto.randomUUID(),
                        })),
                    ];
                });
            } else {
                setClasses((cls) => cls.filter((c) => c.school_level !== level));
            }
            return next;
        });
    };

    const updateClass = (key: string, field: string, value: string | number) => {
        setClasses((prev) => prev.map((c) => c._key === key ? { ...c, [field]: value } : c));
    };

    const addClass = (level: string) => {
        setClasses((prev) => [...prev, {
            name: '',
            short_name: '',
            school_level: level,
            level_order: prev.length,
            numeric_name: prev.length * 10 + 10,
            _key: crypto.randomUUID(),
        }]);
    };

    const removeClass = (key: string) => {
        setClasses((prev) => prev.filter((c) => c._key !== key));
    };

    const moveClass = (key: string, direction: 'up' | 'down') => {
        setClasses((prev) => {
            const idx = prev.findIndex((c) => c._key === key);
            if (idx === -1) return prev;
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
            return next;
        });
    };

    const classesByLevel = (level: string) => classes.filter((c) => c.school_level === level);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (levels.length === 0) { toast.error('Select at least one school level'); return; }
        if (classes.length === 0) { toast.error('Add at least one class'); return; }
        const invalid = classes.some((c) => !c.name.trim());
        if (invalid) { toast.error('All classes must have a name'); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/academic_structure', {
                levels,
                classes: classes.map(({ _key, ...c }) => c),
            });
            toast.success('Academic structure saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Label className="text-sm font-medium">Which levels does your school offer?</Label>
                    <span className="text-destructive text-sm">*</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                    Select all academic levels your school operates. Recommended classes will be generated automatically.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allLevelKeys.map((val) => {
                        const isActive = levels.includes(val);
                        return (
                            <button
                                key={val}
                                type="button"
                                onClick={() => toggleLevel(val)}
                                className={cn(
                                    "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                                    isActive
                                        ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                        : "border-border hover:bg-muted/50 hover:border-muted-foreground/30"
                                )}
                            >
                                <div className="mt-0.5">
                                    <Checkbox checked={isActive} onCheckedChange={() => toggleLevel(val)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                                        {levelLabels[val]}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {levelDescriptions[val]}
                                    </div>
                                </div>
                                {isActive && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                            </button>
                        );
                    })}
                </div>
                {levels.length === 0 && (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Select at least one level to continue. The system will generate recommended classes for each selected level.
                        </p>
                    </div>
                )}
            </div>

            {levels.length > 0 && (
                <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Label className="text-sm font-medium">Classes</Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                        Recommended classes have been generated. You can rename, reorder, add, or remove them.
                    </p>
                </div>
            )}

            {levels.map((level) => {
                const levelClasses = classesByLevel(level);
                return (
                    <div key={level} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold">{levelLabels[level as LevelKey]}</h4>
                                <p className="text-xs text-muted-foreground">{levelClasses.length} class{levelClasses.length !== 1 ? 'es' : ''}</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addClass(level)}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add
                            </Button>
                        </div>
                        {levelClasses.length === 0 ? (
                            <EmptyState message={`No ${levelLabels[level as LevelKey]} classes. Click "Add" to create one.`} />
                        ) : (
                            <div className="space-y-1.5">
                                {levelClasses.map((cls, clsIdx) => {
                                    const globalIdx = classes.findIndex((c) => c._key === cls._key);
                                    const isFirst = globalIdx === 0;
                                    const isLast = globalIdx === classes.length - 1;
                                    return (
                                        <div key={cls._key} className="p-2 sm:p-0 sm:flex sm:items-center sm:gap-1.5 group">
                                            <div className="hidden sm:flex flex-col shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => moveClass(cls._key, 'up')}
                                                    disabled={isFirst}
                                                    className={cn("p-0.5 rounded hover:bg-muted", isFirst && "opacity-30")}
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveClass(cls._key, 'down')}
                                                    disabled={isLast}
                                                    className={cn("p-0.5 rounded hover:bg-muted", isLast && "opacity-30")}
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 sm:flex-1">
                                                <div className="flex items-center gap-1 sm:hidden shrink-0">
                                                    <button type="button" onClick={() => moveClass(cls._key, 'up')} disabled={isFirst} className={cn("p-1 rounded", isFirst && "opacity-30")}>
                                                        <ArrowUp className="w-3 h-3" />
                                                    </button>
                                                    <button type="button" onClick={() => moveClass(cls._key, 'down')} disabled={isLast} className={cn("p-1 rounded", isLast && "opacity-30")}>
                                                        <ArrowDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <Input
                                                    value={cls.name}
                                                    onChange={(e) => updateClass(cls._key, 'name', e.target.value)}
                                                    placeholder="Class name (e.g. Class 1, Grade 1, Form 1)"
                                                    className="flex-1 min-w-0"
                                                />
                                                <Input
                                                    value={cls.short_name}
                                                    onChange={(e) => updateClass(cls._key, 'short_name', e.target.value)}
                                                    placeholder="Short"
                                                    className="w-20 sm:w-28 shrink-0"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeClass(cls._key)}
                                                    className="shrink-0 text-destructive hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            <SubmitButton saving={saving} />
        </form>
    );
}

function StreamsStep({ data, onSaved, goNext }: StepProps) {
    const existingDepts = (data as any)?.departments || [];
    const existingSections = (data as any)?.sections || [];
    const sssClasses = (data as any)?.sss_classes || [];
    const rawDefaults = (data as any)?.defaults;
    const defaults = {
        departments: (rawDefaults?.departments ?? ['Science', 'Arts', 'Commercial']) as string[],
        sections: (rawDefaults?.sections ?? ['A', 'B', 'C']) as string[],
    };

    const [departments, setDepartments] = useState<any[]>(
        existingDepts.length > 0
            ? existingDepts.map((d: any) => ({ name: d.name, code: d.code || '', id: d.id, _key: crypto.randomUUID() }))
            : defaults.departments.map((d: string) => ({ name: d, code: '', _key: crypto.randomUUID() }))
    );
    const [sections, setSections] = useState<any[]>(
        existingSections.length > 0
            ? existingSections.map((s: any) => ({ name: s.name, class_id: s.class_id, section_code: s.section_code || '', id: s.id, _key: crypto.randomUUID() }))
            : []
    );
    const [saving, setSaving] = useState(false);

    const addDept = () => setDepartments((p) => [...p, { name: '', code: '', _key: crypto.randomUUID() }]);
    const removeDept = (key: string) => setDepartments((p) => p.filter((d) => d._key !== key));
    const updateDept = (key: string, field: string, value: string) => {
        setDepartments((p) => p.map((d) => d._key === key ? { ...d, [field]: value } : d));
    };

    const addSection = () => setSections((p) => [...p, { name: '', class_id: sssClasses[0]?.id || 0, section_code: '', _key: crypto.randomUUID() }]);
    const removeSection = (key: string) => setSections((p) => p.filter((s) => s._key !== key));
    const updateSection = (key: string, field: string, value: string | number) => {
        setSections((p) => p.map((s) => s._key === key ? { ...s, [field]: value } : s));
    };

    const autoFillSections = () => {
        const newSections: any[] = [];
        sssClasses.forEach((cls: any) => {
            defaults.sections.forEach((name: string) => {
                newSections.push({ name: `${cls.name} - Section ${name}`, class_id: cls.id, section_code: name, _key: crypto.randomUUID() });
            });
        });
        setSections(newSections);
        toast.success(`Created ${newSections.length} sections`);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await postJson('/school/setup/streams', {
                departments: departments.filter((d) => d.name.trim()).map(({ _key, ...d }) => d),
                sections: sections.filter((s) => s.name.trim()).map(({ _key, ...s }) => s),
            });
            toast.success('Streams and sections saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div>
                <div className="flex items-center justify-between">
                    <SectionHeader>Academic Departments</SectionHeader>
                    <Button type="button" variant="outline" size="sm" onClick={addDept}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                </div>
                <div className="space-y-2">
                    {departments.map((dept) => (
                        <div key={dept._key} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input value={dept.name} onChange={(e) => updateDept(dept._key, 'name', e.target.value)} placeholder="Department name" className="flex-1" />
                            <div className="flex items-center gap-2">
                                <Input value={dept.code} onChange={(e) => updateDept(dept._key, 'code', e.target.value)} placeholder="Code" className="w-full sm:w-24" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeDept(dept._key)} className="shrink-0 text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {sssClasses.length > 0 && (
                <div>
                    <div className="flex items-center justify-between">
                        <SectionHeader>Class Sections</SectionHeader>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={autoFillSections}>
                                <RotateCcw className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Auto-fill
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={addSection}>
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {sections.map((sec) => (
                            <div key={sec._key} className="p-3 border rounded-lg space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                                <Select value={String(sec.class_id)} onValueChange={(v) => updateSection(sec._key, 'class_id', Number(v))}>
                                    <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Class" /></SelectTrigger>
                                    <SelectContent>
                                        {sssClasses.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input value={sec.name} onChange={(e) => updateSection(sec._key, 'name', e.target.value)} placeholder="Section name" className="flex-1" />
                                <div className="flex items-center gap-2">
                                    <Input value={sec.section_code} onChange={(e) => updateSection(sec._key, 'section_code', e.target.value)} placeholder="Code" className="w-full sm:w-20" />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(sec._key)} className="shrink-0 text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SubmitButton saving={saving} />
        </form>
    );
}

function AcademicYearStep({ data, onSaved, goNext }: StepProps) {
    const defaults = (data as any)?.defaults || {};
    const existing = (data as any)?.current_year;
    const existingTerms = (data as any)?.terms || [];
    const template = (data as any)?.template;

    const [yearName, setYearName] = useState(existing?.name || defaults.year_name || '');
    const [startDate, setStartDate] = useState(existing?.start_date || defaults.start_date || '');
    const [endDate, setEndDate] = useState(existing?.end_date || defaults.end_date || '');
    const [terms, setTerms] = useState<any[]>(
        existingTerms.length > 0
            ? existingTerms.map((t: any) => ({ name: t.name, start_date: t.start_date, end_date: t.end_date, id: t.id, _key: crypto.randomUUID() }))
            : (defaults.terms || []).map((t: any) => ({ ...t, _key: crypto.randomUUID() }))
    );
    const [saving, setSaving] = useState(false);

    const addTerm = () => setTerms((p) => [...p, { name: '', start_date: '', end_date: '', _key: crypto.randomUUID() }]);
    const removeTerm = (key: string) => setTerms((p) => p.filter((t) => t._key !== key));
    const updateTerm = (key: string, field: string, value: string) => {
        setTerms((p) => p.map((t) => t._key === key ? { ...t, [field]: value } : t));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!yearName.trim()) { toast.error('Year name is required'); return; }
        if (!startDate || !endDate) { toast.error('Start and end dates are required'); return; }
        if (terms.length === 0) { toast.error('Add at least one term'); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/academic_year', {
                year_name: yearName,
                start_date: startDate,
                end_date: endDate,
                terms: terms.map(({ _key, ...t }) => t),
            });
            toast.success('Academic year and terms saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {template && (
                <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                    <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span>
                        Defaults pre-filled from the approved national calendar <strong>{template.name}</strong>
                        {template.country === 'SL' ? ' (Sierra Leone)' : ''} with {template.terms?.length ?? 0} terms. Adjust if needed.
                    </span>
                </div>
            )}
            <SectionHeader>Academic Year</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Year Name" required>
                    <Input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="e.g. 2026/2027" />
                </Field>
                <Field label="Start Date" required>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
                <Field label="End Date" required>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Field>
            </div>

            <div className="flex items-center justify-between">
                <SectionHeader>Terms</SectionHeader>
                <Button type="button" variant="outline" size="sm" onClick={addTerm}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Term
                </Button>
            </div>
            <div className="space-y-3">
                {terms.map((term, idx) => (
                    <div key={term._key} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                            <Input value={term.name} onChange={(e) => updateTerm(term._key, 'name', e.target.value)} placeholder="Term name" className="flex-1" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTerm(term._key)} className="shrink-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <span className="text-xs text-muted-foreground">Start</span>
                                <Input type="date" value={term.start_date} onChange={(e) => updateTerm(term._key, 'start_date', e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">End</span>
                                <Input type="date" value={term.end_date} onChange={(e) => updateTerm(term._key, 'end_date', e.target.value)} className="mt-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <SubmitButton saving={saving} />
        </form>
    );
}

function AssessmentStep({ data, onSaved, goNext }: StepProps) {
    const defaults = (data as any)?.defaults || {};
    const existing = (data as any)?.components || [];
    const config = (data as any)?.config;
    const hasYear = (data as any)?.has_year;

    const [components, setComponents] = useState<any[]>(
        existing.length > 0
            ? existing.map((c: any) => ({ name: c.name, category: c.category, weight_percentage: Number(c.weight_percentage), max_marks: Number(c.max_marks), sort_order: c.sort_order, id: c.id, _key: crypto.randomUUID() }))
            : (defaults.components || []).map((c: any) => ({ ...c, sort_order: 0, _key: crypto.randomUUID() }))
    );
    const [cwWeight, setCwWeight] = useState(config?.total_coursework_weight ?? defaults.total_coursework_weight ?? 40);
    const [examWeight, setExamWeight] = useState(config?.total_examination_weight ?? defaults.total_examination_weight ?? 60);
    const [saving, setSaving] = useState(false);

    const totalWeight = components.reduce((sum, c) => sum + (Number(c.weight_percentage) || 0), 0);
    const isValid = Math.abs(totalWeight - 100) < 0.01;

    const addComponent = (category: string) => {
        setComponents((p) => [...p, { name: '', category, weight_percentage: 0, max_marks: 100, sort_order: p.length, _key: crypto.randomUUID() }]);
    };
    const removeComponent = (key: string) => setComponents((p) => p.filter((c) => c._key !== key));
    const updateComponent = (key: string, field: string, value: any) => {
        setComponents((p) => p.map((c) => c._key === key ? { ...c, [field]: value } : c));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) { toast.error(`Weights must sum to 100% (currently ${totalWeight}%)`); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/assessment', {
                components: components.map(({ _key, ...c }) => c),
                total_coursework_weight: cwWeight,
                total_examination_weight: examWeight,
            });
            toast.success('Assessment setup saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (!hasYear) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Please complete the Academic Year step first.</p>
                <Button variant="outline" className="mt-4" onClick={goNext}>Skip This Step</Button>
            </div>
        );
    }

    const coursework = components.filter((c) => c.category === 'coursework');
    const examination = components.filter((c) => c.category === 'examination');

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
                <div className={cn("text-2xl font-bold", isValid ? "text-emerald-600" : "text-destructive")}>
                    {totalWeight}%
                </div>
                <div>
                    <p className="text-sm font-medium">Total Weight</p>
                    <p className="text-xs text-muted-foreground">Must equal 100%</p>
                </div>
            </div>

            <SectionHeader>Coursework Components</SectionHeader>
            <div className="space-y-3">
                {coursework.map((comp) => (
                    <div key={comp._key} className="p-3 border rounded-lg space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                        <Input value={comp.name} onChange={(e) => updateComponent(comp._key, 'name', e.target.value)} placeholder="Name" className="flex-1" />
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <Input type="number" min={0} max={100} value={comp.weight_percentage} onChange={(e) => updateComponent(comp._key, 'weight_percentage', Number(e.target.value))} className="w-16" />
                                <span className="text-xs text-muted-foreground">%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Input type="number" min={1} value={comp.max_marks} onChange={(e) => updateComponent(comp._key, 'max_marks', Number(e.target.value))} className="w-16" />
                                <span className="text-xs text-muted-foreground hidden sm:inline">marks</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(comp._key)} className="shrink-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addComponent('coursework')}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Coursework
                </Button>
            </div>

            <SectionHeader>Examination Components</SectionHeader>
            <div className="space-y-3">
                {examination.map((comp) => (
                    <div key={comp._key} className="p-3 border rounded-lg space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                        <Input value={comp.name} onChange={(e) => updateComponent(comp._key, 'name', e.target.value)} placeholder="Name" className="flex-1" />
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <Input type="number" min={0} max={100} value={comp.weight_percentage} onChange={(e) => updateComponent(comp._key, 'weight_percentage', Number(e.target.value))} className="w-16" />
                                <span className="text-xs text-muted-foreground">%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Input type="number" min={1} value={comp.max_marks} onChange={(e) => updateComponent(comp._key, 'max_marks', Number(e.target.value))} className="w-16" />
                                <span className="text-xs text-muted-foreground hidden sm:inline">marks</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(comp._key)} className="shrink-0 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addComponent('examination')}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Examination
                </Button>
            </div>

            <SubmitButton saving={saving} />
        </form>
    );
}

function SubjectsStep({ data, onSaved, goNext }: StepProps) {
    const allClasses = (data as any)?.classes || [];
    const existing = (data as any)?.subjects || [];
    const departments = (data as any)?.departments || [];
    const catalogue = (data as any)?.catalogue || [];
    const defaults = (data as any)?.defaults || {};

    const [subjects, setSubjects] = useState<any[]>(() => {
        if (existing.length > 0) {
            return existing.map((s: any) => ({
                name: s.name, code: s.code || '', class_id: s.class_id, is_core: s.is_core,
                school_level: s.school_level || '', department_id: s.department_id || null,
                id: s.id, _key: crypto.randomUUID(),
            }));
        }
        const result: any[] = [];
        allClasses.forEach((cls: any) => {
            const level = cls.school_level || 'primary';
            const classDefaults = defaults[level];
            if (Array.isArray(classDefaults)) {
                classDefaults.forEach((s: any) => {
                    result.push({ name: s.name, code: s.code, class_id: cls.id, is_core: s.is_core, school_level: level, department_id: null, _key: crypto.randomUUID() });
                });
            } else if (classDefaults && typeof classDefaults === 'object') {
                Object.values(classDefaults).flat().forEach((s: any) => {
                    result.push({ name: s.name, code: s.code, class_id: cls.id, is_core: s.is_core, school_level: level, department_id: null, _key: crypto.randomUUID() });
                });
            }
        });
        return result;
    });

    const [selectedClass, setSelectedClass] = useState(allClasses[0]?.id ? String(allClasses[0].id) : '');
    const [saving, setSaving] = useState(false);

    const filteredSubjects = subjects.filter((s) => String(s.class_id) === selectedClass);

    const addSubject = () => {
        setSubjects((p) => [...p, {
            name: '', code: '', class_id: Number(selectedClass), is_core: true,
            school_level: allClasses.find((c: any) => String(c.id) === selectedClass)?.school_level || '',
            department_id: null, _key: crypto.randomUUID(),
        }]);
    };
    const removeSubject = (key: string) => setSubjects((p) => p.filter((s) => s._key !== key));
    const updateSubject = (key: string, field: string, value: any) => {
        setSubjects((p) => p.map((s) => s._key === key ? { ...s, [field]: value } : s));
    };

    const loadCatalogueForClass = () => {
        const cls = allClasses.find((c: any) => String(c.id) === selectedClass);
        if (!cls) return;
        const rows = catalogue.filter(
            (x: any) => x.school_level === cls.school_level && (x.section_group === null || x.section_group === 'core')
        );
        if (rows.length === 0) { toast.info('No national curriculum catalogue entries for this level'); return; }
        const existingNames = new Set(
            subjects.filter((s: any) => String(s.class_id) === selectedClass).map((s: any) => s.name.trim().toLowerCase())
        );
        const additions = rows
            .filter((x: any) => !existingNames.has(x.name.trim().toLowerCase()))
            .map((x: any) => ({
                name: x.name, code: x.code || '', class_id: Number(selectedClass),
                is_core: x.is_core, school_level: cls.school_level, department_id: null, _key: crypto.randomUUID(),
            }));
        if (additions.length === 0) { toast.info('National curriculum subjects already loaded for this class'); return; }
        setSubjects((p) => [...p, ...additions]);
        toast.success(`Loaded ${additions.length} subject(s) from the national curriculum`);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmpty = subjects.filter((s) => s.name.trim());
        if (nonEmpty.length === 0) { toast.error('Add at least one subject'); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/subjects', {
                subjects: nonEmpty.map(({ _key, ...s }) => s),
            });
            toast.success('Subjects saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Field label="Select Class" required>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Choose class" /></SelectTrigger>
                    <SelectContent>
                        {allClasses.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </Field>

            <div className="flex items-center justify-between">
                <SectionHeader>Subjects for {allClasses.find((c: any) => String(c.id) === selectedClass)?.name || 'Selected Class'}</SectionHeader>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={loadCatalogueForClass} disabled={!selectedClass || catalogue.length === 0}>
                        <BookOpen className="w-3.5 h-3.5 mr-1" /> From National Curriculum
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addSubject} disabled={!selectedClass}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
                    </Button>
                </div>
            </div>

            {filteredSubjects.length === 0 ? (
                <EmptyState message={`No subjects for this class. Click "Add Subject" to create one.`} />
            ) : (
                <div className="space-y-3">
                    {filteredSubjects.map((sub) => (
                        <div key={sub._key} className="p-3 border rounded-lg space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                            <Input value={sub.name} onChange={(e) => updateSubject(sub._key, 'name', e.target.value)} placeholder="Subject name" className="flex-1" />
                            <div className="flex items-center gap-2">
                                <Input value={sub.code} onChange={(e) => updateSubject(sub._key, 'code', e.target.value)} placeholder="Code" className="w-full sm:w-20" />
                                {departments.length > 0 && (
                                    <Select value={String(sub.department_id || '')} onValueChange={(v) => updateSubject(sub._key, 'department_id', v ? Number(v) : null)}>
                                        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Dept" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Checkbox
                                        checked={sub.is_core}
                                        onCheckedChange={(v) => updateSubject(sub._key, 'is_core', !!v)}
                                    />
                                    <span className="text-xs text-muted-foreground">Core</span>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSubject(sub._key)} className="shrink-0 text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SubmitButton saving={saving} />
        </form>
    );
}

function GradingStep({ data, onSaved, goNext }: StepProps) {
    const defaults = (data as any)?.defaults || {};
    const existingScales = (data as any)?.grade_scales || [];

    const [caWeight, setCaWeight] = useState(Number(data.ca_weight) || defaults.ca_weight || 40);
    const [examWeight, setExamWeight] = useState(Number(data.exam_weight) || defaults.exam_weight || 60);
    const [passMark, setPassMark] = useState(Number(data.pass_mark) || defaults.pass_mark || 50);
    const [gradeScale, setGradeScale] = useState<any[]>(
        existingScales.length > 0
            ? existingScales.map((g: any) => ({
                grade: g.grade, gpa: Number(g.gpa), min_marks: Number(g.min_marks),
                max_marks: Number(g.max_marks), remarks: g.remarks || '', sort_order: g.sort_order,
                _key: crypto.randomUUID(),
            }))
            : (defaults.grade_scale || []).map((g: any) => ({ ...g, _key: crypto.randomUUID() }))
    );
    const [saving, setSaving] = useState(false);

    const cwValid = Math.abs(caWeight + examWeight - 100) < 0.01;

    const addGrade = () => {
        setGradeScale((p) => [...p, { grade: '', gpa: 0, min_marks: 0, max_marks: 100, remarks: '', sort_order: p.length + 1, _key: crypto.randomUUID() }]);
    };
    const removeGrade = (key: string) => setGradeScale((p) => p.filter((g) => g._key !== key));
    const updateGrade = (key: string, field: string, value: any) => {
        setGradeScale((p) => p.map((g) => g._key === key ? { ...g, [field]: value } : g));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cwValid) { toast.error('CA + Exam must equal 100%'); return; }
        if (gradeScale.length === 0) { toast.error('Add at least one grade'); return; }
        setSaving(true);
        try {
            await postJson('/school/setup/grading', {
                ca_weight: caWeight,
                exam_weight: examWeight,
                pass_mark: passMark,
                grade_scale: gradeScale.map(({ _key, ...g }) => g),
            });
            toast.success('Grading settings saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <SectionHeader>Weight Distribution</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="CA Weight %" required>
                    <Input type="number" min={0} max={100} value={caWeight} onChange={(e) => setCaWeight(Number(e.target.value))} />
                </Field>
                <Field label="Exam Weight %" required>
                    <Input type="number" min={0} max={100} value={examWeight} onChange={(e) => setExamWeight(Number(e.target.value))} />
                </Field>
                <Field label="Pass Mark %" required>
                    <Input type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} />
                </Field>
            </div>
            {!cwValid && (
                <p className="text-sm text-destructive">CA + Exam must equal 100% (currently {caWeight + examWeight}%)</p>
            )}

            <div className="flex items-center justify-between">
                <SectionHeader>Grade Scale</SectionHeader>
                <Button type="button" variant="outline" size="sm" onClick={addGrade}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Grade
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm hidden md:table">
                    <thead>
                        <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 pr-2">Grade</th>
                            <th className="text-left py-2 pr-2">GPA</th>
                            <th className="text-left py-2 pr-2">Min %</th>
                            <th className="text-left py-2 pr-2">Max %</th>
                            <th className="text-left py-2 pr-2">Remarks</th>
                            <th className="py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {gradeScale.map((g) => (
                            <tr key={g._key} className="border-b last:border-0">
                                <td className="py-1.5 pr-2"><Input value={g.grade} onChange={(e) => updateGrade(g._key, 'grade', e.target.value)} className="w-16" placeholder="A" /></td>
                                <td className="py-1.5 pr-2"><Input type="number" step="0.1" min={0} max={5} value={g.gpa} onChange={(e) => updateGrade(g._key, 'gpa', Number(e.target.value))} className="w-16" /></td>
                                <td className="py-1.5 pr-2"><Input type="number" min={0} max={100} value={g.min_marks} onChange={(e) => updateGrade(g._key, 'min_marks', Number(e.target.value))} className="w-20" /></td>
                                <td className="py-1.5 pr-2"><Input type="number" min={0} max={100} value={g.max_marks} onChange={(e) => updateGrade(g._key, 'max_marks', Number(e.target.value))} className="w-20" /></td>
                                <td className="py-1.5 pr-2"><Input value={g.remarks} onChange={(e) => updateGrade(g._key, 'remarks', e.target.value)} className="w-28" placeholder="Excellent" /></td>
                                <td className="py-1.5">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGrade(g._key)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="md:hidden space-y-3">
                    {gradeScale.map((g) => (
                        <div key={g._key} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Input value={g.grade} onChange={(e) => updateGrade(g._key, 'grade', e.target.value)} className="w-16 text-center font-bold" placeholder="A" />
                                    <Input type="number" step="0.1" min={0} max={5} value={g.gpa} onChange={(e) => updateGrade(g._key, 'gpa', Number(e.target.value))} className="w-16" placeholder="GPA" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeGrade(g._key)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" min={0} max={100} value={g.min_marks} onChange={(e) => updateGrade(g._key, 'min_marks', Number(e.target.value))} placeholder="Min %" />
                                <Input type="number" min={0} max={100} value={g.max_marks} onChange={(e) => updateGrade(g._key, 'max_marks', Number(e.target.value))} placeholder="Max %" />
                            </div>
                            <Input value={g.remarks} onChange={(e) => updateGrade(g._key, 'remarks', e.target.value)} placeholder="Remarks (e.g. Excellent)" />
                        </div>
                    ))}
                </div>
            </div>

            <SubmitButton saving={saving} />
        </form>
    );
}

function BrandingStep({ data, onSaved, goNext }: StepProps) {
    const existing = (data as any)?.data || {};
    const [primaryColor, setPrimaryColor] = useState(existing.primary_color || '#1E3A5F');
    const [secondaryColor, setSecondaryColor] = useState(existing.secondary_color || '#2563EB');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [badgeFile, setBadgeFile] = useState<File | null>(null);
    const [stampFile, setStampFile] = useState<File | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const logoRef = useRef<HTMLInputElement>(null);
    const badgeRef = useRef<HTMLInputElement>(null);
    const stampRef = useRef<HTMLInputElement>(null);
    const sigRef = useRef<HTMLInputElement>(null);
    const bannerRef = useRef<HTMLInputElement>(null);

    const FileUpload = ({ label, file, setFile, inputRef, existingUrl }: { label: string; file: File | null; setFile: (f: File | null) => void; inputRef: React.RefObject<HTMLInputElement | null>; existingUrl?: string }) => (
        <div>
            <Label className="text-sm font-medium">{label}</Label>
            <div
                className="mt-1.5 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                {file ? (
                    <p className="text-sm text-primary font-medium">{file.name}</p>
                ) : existingUrl ? (
                    <img src={`/${existingUrl}`} alt={label} className="h-16 mx-auto object-contain" />
                ) : (
                    <p className="text-xs text-muted-foreground">Click to upload</p>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
    );

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('primary_color', primaryColor);
            fd.append('secondary_color', secondaryColor);
            if (logoFile) fd.append('logo', logoFile);
            if (badgeFile) fd.append('badge', badgeFile);
            if (stampFile) fd.append('official_stamp', stampFile);
            if (signatureFile) fd.append('official_signature', signatureFile);
            if (bannerFile) fd.append('banner', bannerFile);
            await postMultipart('/school/setup/branding', fd);
            toast.success('Branding saved');
            await onSaved();
            goNext();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <SectionHeader>School Colors</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Primary Color">
                    <div className="flex items-center gap-3">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer shrink-0" />
                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 sm:w-32" />
                    </div>
                </Field>
                <Field label="Secondary Color">
                    <div className="flex items-center gap-3">
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer shrink-0" />
                        <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 sm:w-32" />
                    </div>
                </Field>
            </div>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: primaryColor + '15' }}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: primaryColor }} />
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                    <p className="text-sm text-muted-foreground">Preview</p>
                </div>
            </div>

            <SectionHeader>Documents & Images</SectionHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUpload label="School Logo" file={logoFile} setFile={setLogoFile} inputRef={logoRef} existingUrl={existing.logo} />
                <FileUpload label="School Badge" file={badgeFile} setFile={setBadgeFile} inputRef={badgeRef} existingUrl={existing.badge} />
                <FileUpload label="Official Stamp" file={stampFile} setFile={setStampFile} inputRef={stampRef} existingUrl={existing.official_stamp} />
                <FileUpload label="Official Signature" file={signatureFile} setFile={setSignatureFile} inputRef={sigRef} existingUrl={existing.official_signature} />
            </div>
            <FileUpload label="Banner" file={bannerFile} setFile={setBannerFile} inputRef={bannerRef} existingUrl={existing.banner} />

            <SubmitButton saving={saving} />
        </form>
    );
}

function ReadyStep({ allRequired, summary, onComplete, saving }: { allRequired: boolean; summary?: Record<string, any> | null; onComplete: () => void; saving: boolean }) {
    const rows = summary
        ? [
              ['School', summary.school_name],
              ['Academic Year', summary.academic_year],
              ['Terms', summary.terms ? `${summary.terms}` : null],
              ['Classes', summary.classes ? `${summary.classes}` : null],
              ['Sections', summary.sections ? `${summary.sections}` : null],
              ['Subjects', summary.subjects ? `${summary.subjects}` : null],
              ['Periods', summary.periods ? `${summary.periods}` : null],
              ['Working Days', Array.isArray(summary.working_days) && summary.working_days.length ? summary.working_days.map((d: string) => d[0].toUpperCase() + d.slice(1, 3)).join(', ') : null],
              ['School Hours', summary.opening_time || summary.closing_time ? `${summary.opening_time} – ${summary.closing_time}` : null],
              ['CA / Exam Weight', summary.ca_weight != null || summary.exam_weight != null ? `${summary.ca_weight}% / ${summary.exam_weight}%` : null],
              ['Pass Mark', summary.pass_mark != null ? `${summary.pass_mark}%` : null],
              ['Grading Bands', summary.grading_bands ? `${summary.grading_bands}` : null],
          ].filter((row) => row[1] !== null && row[1] !== undefined) as [string, string][]
        : [];

    return (
        <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
                <Rocket className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold">School Setup Complete</h2>
                <p className="text-muted-foreground mt-2">
                    {allRequired
                        ? 'All required steps are done. Your school is ready to launch!'
                        : 'Some optional steps are pending. You can complete them later from Settings, or launch now.'}
                </p>
            </div>

            {rows.length > 0 && (
                <div className="max-w-xl mx-auto rounded-lg border divide-y text-left">
                    {rows.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2 text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium capitalize">{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {allRequired ? (
                <Button onClick={onComplete} disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
                    Launch School
                </Button>
            ) : (
                <Button onClick={onComplete} disabled={saving} variant="outline" size="lg">
                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Rocket className="w-5 h-5 mr-2" />}
                    Launch Anyway
                </Button>
            )}
        </div>
    );
}
