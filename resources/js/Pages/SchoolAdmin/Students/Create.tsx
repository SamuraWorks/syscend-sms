import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PageProps, SchoolClass, Section } from '@/Types';

interface Props extends PageProps {
    classes:     (Pick<SchoolClass, 'id' | 'name'> & { school_level?: string })[];
    sections:    (Pick<Section, 'id' | 'name'> & { class_id: number })[];
    houses:      { id: number; name: string; color: string | null }[];
    departments: { id: number; name: string }[];
    next_admission_no?: string;
    id_generation_enabled?: boolean;
}

const schema = z.object({
    // Personal
    first_name:      z.string().min(1, 'First name is required'),
    last_name:       z.string().optional(),
    gender:          z.enum(['male', 'female', 'other']),
    date_of_birth:   z.string().optional(),
    place_of_birth:  z.string().optional(),
    blood_group:     z.string().optional(),
    religion:        z.string().optional(),
    nationality:     z.string().optional(),
    phone:           z.string().optional(),
    email:           z.string().email().optional().or(z.literal('')),
    address:         z.string().optional(),
    category:        z.enum(['general', 'disabled', 'quota']),
    status:          z.enum(['active', 'alumni', 'transferred', 'inactive']),
    admission_date:  z.string().optional(),
    admission_type:  z.enum(['new', 'transfer', 'returning']).optional(),
    previous_school: z.string().optional(),
    roll_no:         z.string().optional(),
    // Student identifiers
    admission_no:    z.string().max(50, 'Max 50 characters').optional(),
    student_id:      z.string().max(30, 'Max 30 characters').optional(),
    // Placement
    class_id:      z.coerce.number().int().positive('Select a class'),
    section_id:    z.coerce.number().int().positive().nullable().optional(),
    house_id:      z.coerce.number().int().positive().nullable().optional(),
    department_id: z.coerce.number().int().positive().nullable().optional(),
    // Guardian
    guardian: z.object({
        name:       z.string().min(1, 'Guardian name is required'),
        relation:   z.string().min(1, 'Relation is required'),
        phone:      z.string().optional(),
        email:      z.string().email().optional().or(z.literal('')),
        occupation: z.string().optional(),
        address:    z.string().optional(),
    }),
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Personal Info', 'Class & Roll', 'Guardian Info'];

// Fields validated before the wizard advances past each step. The root key is
// used for nested paths (e.g. "guardian" covers guardian.name/relation).
const STEP_FIELDS: string[][] = [
    ['first_name', 'last_name', 'gender', 'date_of_birth', 'place_of_birth', 'blood_group', 'religion', 'nationality', 'phone', 'email', 'category', 'status', 'address'],
    ['admission_no', 'student_id', 'class_id', 'section_id', 'house_id', 'department_id', 'roll_no', 'admission_date', 'admission_type', 'previous_school'],
    ['guardian'],
];

const STEP_OF_FIELD: Record<string, number> = Object.fromEntries(
    STEP_FIELDS.flatMap((fields, index) => fields.map((f) => [f, index])),
);

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'disabled', label: 'Disabled' },
    { value: 'quota', label: 'Quota' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'transferred', label: 'Transferred' },
];

const ADMISSION_TYPE_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'returning', label: 'Returning' },
];

const RELATION_OPTIONS = [
    { value: 'Father', label: 'Father' },
    { value: 'Mother', label: 'Mother' },
    { value: 'Guardian', label: 'Guardian' },
    { value: 'Uncle', label: 'Uncle' },
    { value: 'Aunt', label: 'Aunt' },
    { value: 'Sibling', label: 'Sibling' },
];

interface Option { value: string; label: string }

// Native <select> deliberately: on phones the OS renders its own picker, so we
// avoid the stack of custom popover "overlays" that made this form awkward on
// small screens. It is also the most accessible control for touch.
const SelectField = ({ label, value, onValueChange, options, placeholder, disabled = false, required = false, error }: {
    label: string;
    value?: string | number | null;
    onValueChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
}) => (
    <div className="space-y-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
        <select
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

export default function CreateStudent() {
    const { classes, sections, houses = [], departments = [], next_admission_no, id_generation_enabled = true } = usePage<Props>().props;
    const [step, setStep] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);

    const { register, handleSubmit, setValue, watch, setError, trigger, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            resolver: zodResolver(schema) as unknown as Resolver<FormData>,
            defaultValues: { gender: 'male', category: 'general', status: 'active', admission_type: 'new', nationality: 'Sierra Leonean', guardian: { relation: 'Father' } },
        });

    const selectedClassId = watch('class_id');
    const visibleSections = selectedClassId ? sections.filter((s) => s.class_id === Number(selectedClassId)) : [];
    const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
    const isSss = selectedClass?.school_level === 'senior_secondary';
    const firstName = watch('first_name');
    const lastName = watch('last_name');

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Jump to the earliest wizard step that contains a validation error so the
    // message is visible instead of silently failing on a hidden field.
    const goToFirstError = (errs: Record<string, unknown>) => {
        const roots = Object.keys(errs).map((k) => k.split('.')[0]);
        const steps = roots.map((r) => STEP_OF_FIELD[r]).filter((n): n is number => n !== undefined);
        if (steps.length > 0) setStep(Math.min(...steps));
    };

    const onInvalid = (errs: Record<string, unknown>) => {
        setSubmitError('Please fix the highlighted fields before admitting the student.');
        goToFirstError(errs);
    };

    const goNext = async () => {
        setSubmitError(null);
        const valid = await trigger(STEP_FIELDS[step] as never[], { shouldFocus: true });
        if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    // Validate the whole form before showing the confirmation dialog.
    const requestAdmit = handleSubmit(
        () => setShowConfirm(true),
        (errs) => onInvalid(errs as Record<string, unknown>),
    );

    const onSubmit = (data: FormData) => {
        setSubmitError(null);
        setSubmitting(true);
        const payload = { ...data, guardian: { ...data.guardian } };
        const onError = (errs: Record<string, string>) => {
            setSubmitting(false);
            setShowConfirm(false);
            setSubmitError('The school could not admit this student. Please review the highlighted fields.');
            Object.entries(errs).forEach(([f, m]) => setError(f as keyof FormData, { message: m }));
            goToFirstError(errs);
        };

        if (photo) {
            const fd = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([k2, v2]) => {
                        if (v2 !== null && v2 !== undefined && v2 !== '') fd.append(`${key}[${k2}]`, String(v2));
                    });
                } else if (value !== '') {
                    fd.append(key, String(value));
                }
            });
            fd.append('photo', photo);
            router.post('/school/students', fd, { onError });
        } else {
            router.post('/school/students', payload, { onError });
        }
    };

    const confirmAdmit = handleSubmit(onSubmit, (errs) => onInvalid(errs as Record<string, unknown>));

    const classOptions: Option[] = classes.map((c) => ({ value: String(c.id), label: c.name }));
    const sectionOptions: Option[] = visibleSections.map((s) => ({ value: String(s.id), label: s.name }));
    const houseOptions: Option[] = [{ value: '_none', label: 'None' }, ...houses.map((h) => ({ value: String(h.id), label: h.name }))];
    const departmentOptions: Option[] = [{ value: '_none', label: 'None' }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))];

    const Field = ({ name, label, placeholder, type = 'text', required = false }: {
        name: string; label: string; placeholder?: string; type?: string; required?: boolean;
    }) => {
        const keys = name.split('.');
        const err  = keys.length === 2
            ? (errors as Record<string, Record<string, { message?: string }>>)[keys[0]]?.[keys[1]]
            : (errors as Record<string, { message?: string }>)[name];
        return (
            <div className="space-y-1.5">
                <Label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
                <Input type={type} placeholder={placeholder} className="h-10 sm:h-9" {...register(name as keyof FormData)} />
                {err && <p className="text-xs text-red-500">{err.message as string}</p>}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Students', href: '/school/students' },
            { label: 'Admit Student' },
        ]}>
            <Head title="Admit Student" />

            <div className="mx-auto max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/school/students"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admit Student</h1>
                        <p className="text-sm text-slate-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
                    </div>
                </div>

                {/* Error summary — visible feedback when a step/submit is invalid */}
                {submitError && (
                    <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{submitError}</span>
                    </div>
                )}

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => i < step && setStep(i)}
                                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${i === step ? 'bg-indigo-600 text-white' : i < step ? 'bg-emerald-500 text-white cursor-pointer' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}
                            >{i + 1}</button>
                            <span className={`text-xs hidden sm:block ${i === step ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}`}>{s}</span>
                            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Step 0 — Personal */}
                    {step === 0 && (
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field name="first_name" label="First Name" placeholder="John" required />
                                <Field name="last_name"  label="Last Name"  placeholder="Doe" />
                                <SelectField
                                    label="Gender"
                                    required
                                    value={watch('gender')}
                                    onValueChange={(v) => setValue('gender', v as FormData['gender'], { shouldValidate: true })}
                                    options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                                />
                                <Field name="date_of_birth"  label="Date of Birth"   type="date" />
                                <Field name="place_of_birth" label="Place of Birth"  placeholder="Freetown" />
                                <Field name="blood_group" label="Blood Group" placeholder="A+" />
                                <Field name="religion"    label="Religion"    placeholder="Islam" />
                                <Field name="nationality" label="Nationality"  placeholder="Sierra Leonean" />
                                <Field name="phone"       label="Phone"        placeholder="+2327000000000" />
                                <Field name="email"       label="Email"        placeholder="student@email.com" type="email" />
                                <SelectField
                                    label="Category"
                                    value={watch('category')}
                                    onValueChange={(v) => setValue('category', v as FormData['category'], { shouldValidate: true })}
                                    options={[{ value: 'general', label: 'General' }, { value: 'disabled', label: 'Disabled' }, { value: 'quota', label: 'Quota' }]}
                                />
                                <SelectField
                                    label="Status"
                                    value={watch('status')}
                                    onValueChange={(v) => setValue('status', v as FormData['status'], { shouldValidate: true })}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'inactive', label: 'Inactive' },
                                        { value: 'alumni', label: 'Alumni' },
                                        { value: 'transferred', label: 'Transferred' },
                                    ]}
                                />
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-sm font-medium">Address</Label>
                                    <Textarea rows={2} className="resize-none" placeholder="House, Road, Area…" {...register('address')} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Photo</Label>
                                    <Input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="h-10 sm:h-9 file:mr-2 file:text-xs"
                                        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                                    />
                                    <p className="text-xs text-slate-400">JPG/PNG/WebP, max 2MB</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 1 — Class */}
                    {step === 1 && (
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Class &amp; Placement</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field name="admission_no" label="Admission No" placeholder={next_admission_no || (id_generation_enabled ? 'Auto-generated' : 'Required')} />
                                <Field name="student_id"   label="Student ID"   placeholder="Optional" />
                                <SelectField
                                    label="Class"
                                    required
                                    value={selectedClassId}
                                    onValueChange={(v) => {
                                        setValue('class_id', v ? Number(v) : ('' as unknown as number), { shouldValidate: true });
                                        setValue('section_id', undefined);
                                        setValue('department_id', undefined);
                                    }}
                                    options={classOptions}
                                    placeholder="Select class"
                                    error={errors.class_id?.message as string | undefined}
                                />
                                <SelectField
                                    label="Section"
                                    value={watch('section_id')}
                                    onValueChange={(v) => setValue('section_id', v ? Number(v) : undefined)}
                                    options={sectionOptions}
                                    placeholder={visibleSections.length === 0 ? 'Select class first' : 'Select section'}
                                    disabled={visibleSections.length === 0}
                                />
                                <SelectField
                                    label="House"
                                    value={watch('house_id') ?? '_none'}
                                    onValueChange={(v) => setValue('house_id', v === '_none' ? undefined : Number(v))}
                                    options={houseOptions}
                                    disabled={houses.length === 0}
                                />
                                <SelectField
                                    label="Department"
                                    value={watch('department_id') ?? '_none'}
                                    onValueChange={(v) => setValue('department_id', v === '_none' ? undefined : Number(v))}
                                    options={departmentOptions}
                                    placeholder={isSss ? (departments.length === 0 ? 'No departments' : 'Select department') : 'SSS classes only'}
                                    disabled={!isSss || departments.length === 0}
                                />
                                <Field name="roll_no"        label="Roll No"        placeholder="01" />
                                <Field name="admission_date" label="Admission Date" type="date" />
                                <SelectField
                                    label="Admission Type"
                                    value={watch('admission_type') ?? 'new'}
                                    onValueChange={(v) => setValue('admission_type', v as FormData['admission_type'])}
                                    options={[
                                        { value: 'new', label: 'New' },
                                        { value: 'transfer', label: 'Transfer' },
                                        { value: 'returning', label: 'Returning' },
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2 — Guardian */}
                    {step === 2 && (
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field name="guardian.name" label="Guardian Name" placeholder="Full name" required />
                                <SelectField
                                    label="Relation"
                                    required
                                    value={watch('guardian.relation') ?? 'Father'}
                                    onValueChange={(v) => setValue('guardian.relation', v)}
                                    options={RELATION_OPTIONS}
                                />
                                <Field name="guardian.phone"      label="Phone"      placeholder="+2327000000000" />
                                <Field name="guardian.email"      label="Email"      placeholder="guardian@email.com" type="email" />
                                <Field name="guardian.occupation" label="Occupation" placeholder="e.g. Teacher" />
                                <Field name="guardian.address"    label="Address"    placeholder="House, Road, Area…" />
                            </CardContent>
                        </Card>
                    )}

                    {/* Nav buttons */}
                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {step > 0 && (
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep(step - 1)}>Back</Button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <Button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white sm:w-auto" onClick={goNext}>
                                Next — {STEPS[step + 1]}
                            </Button>
                        ) : (
                            <Button type="button" disabled={isSubmitting || submitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white sm:w-auto" onClick={requestAdmit}>
                                {isSubmitting || submitting ? 'Admitting…' : 'Admit Student'}
                            </Button>
                        )}
                    </div>
                </form>

                <ConfirmDialog
                    open={showConfirm}
                    onOpenChange={setShowConfirm}
                    title="Confirm Student Admission"
                    description={`Admit ${firstName || 'this student'} ${lastName || ''}? No login is created automatically — the student and parent sign up themselves with the school portal.`}
                    confirmText="Admit Student"
                    onConfirm={confirmAdmit}
                />
            </div>
        </AppLayout>
    );
}
