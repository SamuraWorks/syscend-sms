import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { PageProps, Student, SchoolClass, Section } from '@/Types';
import type { RequestPayload } from '@inertiajs/core';

interface Props extends PageProps {
    student:     Student;
    classes:     (Pick<SchoolClass, 'id' | 'name'> & { school_level?: string })[];
    sections:    (Pick<Section, 'id' | 'name'> & { class_id: number })[];
    houses:      { id: number; name: string; color: string | null }[];
    departments: { id: number; name: string }[];
}

const schema = z.object({
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
    admission_no:    z.string().min(1, 'Student ID is required').max(50, 'Max 50 characters'),
    student_id:      z.string().max(30, 'Max 30 characters').optional(),
    class_id:        z.coerce.number().int().positive('Select a class'),
    section_id:      z.coerce.number().int().positive().nullable().optional(),
    house_id:        z.coerce.number().int().positive().nullable().optional(),
    department_id:   z.coerce.number().int().positive().nullable().optional(),
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

export default function EditStudent() {
    const { student, classes, sections, houses = [], departments = [] } = usePage<Props>().props;
    const [photo, setPhoto] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);

    const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            resolver: zodResolver(schema) as unknown as Resolver<FormData>,
            defaultValues: {
                first_name:      student.first_name,
                last_name:       student.last_name ?? '',
                gender:          student.gender,
                date_of_birth:   student.date_of_birth?.slice(0, 10) ?? '',
                place_of_birth:  student.place_of_birth ?? '',
                blood_group:     student.blood_group ?? '',
                religion:        student.religion ?? '',
                nationality:     student.nationality,
                phone:           student.phone ?? '',
                email:           student.email ?? '',
                address:         student.address ?? '',
                category:        student.category,
                status:          student.status,
                admission_date:  student.admission_date?.slice(0, 10) ?? '',
                admission_type:  (student.admission_type ?? undefined),
                previous_school: student.previous_school ?? '',
                roll_no:         student.roll_no ?? '',
                admission_no:    student.admission_no ?? '',
                student_id:      (student as any).student_id ?? '',
                class_id:        student.class_id,
                section_id:      student.section_id ?? undefined,
                house_id:        (student.house_id ?? undefined),
                department_id:   (student.department_id ?? undefined),
                guardian: {
                    name:       student.guardian?.name ?? '',
                    relation:   student.guardian?.relation ?? 'Father',
                    phone:      student.guardian?.phone ?? '',
                    email:      student.guardian?.email ?? '',
                    occupation: student.guardian?.occupation ?? '',
                    address:    student.guardian?.address ?? '',
                },
            },
        });

    const selectedClassId = watch('class_id');
    const visibleSections = sections.filter((s) => s.class_id === Number(selectedClassId));
    const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
    const isSss = selectedClass?.school_level === 'senior_secondary';

    const onSubmit = (data: FormData) => {
        const payload: Record<string, unknown> = {
            ...data,
            house_id: data.house_id ?? null,
            department_id: isSss ? (data.department_id ?? null) : null,
        };

        if (photo || removePhoto) {
            payload._method = 'PUT';
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
            if (removePhoto && !photo) fd.append('remove_photo', '1');
            if (photo) fd.append('photo', photo);
            router.post(`/school/students/${student.id}`, fd, {
                onError: (errs) => Object.entries(errs).forEach(([f, m]) => setError(f as keyof FormData, { message: m })),
            });
        } else {
            router.put(`/school/students/${student.id}`, payload as unknown as RequestPayload, {
                onError: (errs) => Object.entries(errs).forEach(([f, m]) => setError(f as keyof FormData, { message: m })),
            });
        }
    };

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
                <Input type={type} placeholder={placeholder} className="h-9" {...register(name as keyof FormData)} />
                {err && <p className="text-xs text-red-500">{err.message as string}</p>}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Students', href: '/school/students' },
            { label: student.full_name, href: `/school/students/${student.id}` },
            { label: 'Edit' },
        ]}>
            <Head title={`Edit ${student.full_name}`} />

            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/school/students/${student.id}`}><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Student</h1>
                        <p className="text-sm text-slate-500">{student.full_name} · {student.admission_no}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Personal */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field name="first_name" label="First Name" required />
                            <Field name="last_name"  label="Last Name" />
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Gender</Label>
                                <Select defaultValue={student.gender} onValueChange={(v) => setValue('gender', v as 'male' | 'female' | 'other')}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Field name="date_of_birth"  label="Date of Birth"  type="date" />
                            <Field name="place_of_birth" label="Place of Birth" />
                            <Field name="blood_group" label="Blood Group" />
                            <Field name="religion"    label="Religion" />
                            <Field name="phone"       label="Phone" />
                            <Field name="email"       label="Email" type="email" />
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select defaultValue={student.status} onValueChange={(v) => setValue('status', v as FormData['status'])}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="alumni">Alumni</SelectItem>
                                        <SelectItem value="transferred">Transferred</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Category</Label>
                                <Select defaultValue={student.category} onValueChange={(v) => setValue('category', v as FormData['category'])}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                        <SelectItem value="quota">Quota</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-sm font-medium">Address</Label>
                                <Textarea rows={2} className="resize-none" {...register('address')} />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-sm font-medium">Photo</Label>
                                {student.photo_url && !removePhoto && !photo && (
                                    <div className="flex items-center gap-3">
                                        <img src={student.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border" />
                                        <Button type="button" variant="outline" size="sm" onClick={() => setRemovePhoto(true)}>Remove</Button>
                                    </div>
                                )}
                                {removePhoto && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setRemovePhoto(false)}>Undo removal</Button>
                                )}
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="h-9 file:mr-2 file:text-xs"
                                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                                />
                                <p className="text-xs text-slate-400">JPG/PNG/WebP, max 2MB</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Class Assignment</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Class <span className="text-red-500">*</span></Label>
                                <Select defaultValue={String(student.class_id)} onValueChange={(v) => { setValue('class_id', Number(v)); setValue('section_id', null); if (!classes.find((c) => c.id === Number(v))?.school_level || classes.find((c) => c.id === Number(v))?.school_level !== 'senior_secondary') setValue('department_id', undefined); }}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.class_id && <p className="text-xs text-red-500">{errors.class_id.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Section</Label>
                                <Select defaultValue={student.section_id ? String(student.section_id) : undefined} onValueChange={(v) => setValue('section_id', Number(v))}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select section" /></SelectTrigger>
                                    <SelectContent>
                                        {visibleSections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">House</Label>
                                <Select
                                    key={`house-${student.house_id ?? 'none'}`}
                                    defaultValue={student.house_id ? String(student.house_id) : '_none'}
                                    onValueChange={(v) => setValue('house_id', v === '_none' ? undefined : Number(v))}
                                >
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {houses.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Department</Label>
                                <Select
                                    key={`dept-${isSss}`}
                                    defaultValue={isSss && student.department_id ? String(student.department_id) : '_none'}
                                    onValueChange={(v) => setValue('department_id', v === '_none' ? undefined : Number(v))}
                                    disabled={!isSss || departments.length === 0}
                                >
                                    <SelectTrigger className="h-9"><SelectValue placeholder={isSss ? 'Select department' : 'SSS classes only'} /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Field name="admission_no"   label="Student ID" required />
                            <Field name="student_id"     label="Alt / National ID (optional)" />
                            <Field name="roll_no"        label="Roll No" />
                            <Field name="admission_date" label="Admission Date" type="date" />
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Admission Type</Label>
                                <Select
                                    defaultValue={student.admission_type ?? 'new'}
                                    onValueChange={(v) => setValue('admission_type', v as 'new' | 'transfer' | 'returning')}
                                >
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="returning">Returning</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guardian */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field name="guardian.name"  label="Guardian Name" required />
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Relation</Label>
                                <Select defaultValue={student.guardian?.relation ?? 'Father'} onValueChange={(v) => setValue('guardian.relation', v)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['Father','Mother','Guardian','Uncle','Aunt','Sibling'].map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Field name="guardian.phone"      label="Phone" />
                            <Field name="guardian.email"      label="Email" type="email" />
                            <Field name="guardian.occupation" label="Occupation" />
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-sm font-medium">Guardian Address</Label>
                                <Textarea rows={2} className="resize-none" {...register('guardian.address')} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/school/students/${student.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
