import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, FileUp, Trash2, FileText, User, GraduationCap, Users, Flag, BookOpen, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { PageProps, Student } from '@/Types';

interface Props extends PageProps { student: Student }

const statusColors: Record<string, string> = {
    active:      'bg-emerald-100 text-emerald-700',
    alumni:      'bg-blue-100 text-blue-700',
    transferred: 'bg-amber-100 text-amber-700',
    inactive:    'bg-slate-100 text-slate-600',
};

const docSchema = z.object({
    title: z.string().min(1, 'Title required'),
    file:  z.instanceof(FileList).refine((f) => f.length > 0, 'File required'),
    visible_to_parent: z.boolean().optional(),
});
type DocForm = z.infer<typeof docSchema>;

export default function ShowStudent() {
    const { student } = usePage<Props>().props;
    const [tab, setTab]       = useState<'personal' | 'guardian' | 'documents'>('personal');
    const [docOpen, setDocOpen] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<DocForm>({ resolver: zodResolver(docSchema), defaultValues: { visible_to_parent: false } });

    const visibleToParent = watch('visible_to_parent');

    const uploadDoc = (data: DocForm) => {
        const form = new FormData();
        form.append('title', data.title);
        form.append('file',  data.file[0]);
        form.append('visible_to_parent', data.visible_to_parent ? '1' : '0');
        router.post(`/school/students/${student.id}/documents`, form, {
            forceFormData: true,
            onSuccess: () => { setDocOpen(false); reset({ visible_to_parent: false }); },
        });
    };

    const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
        <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{value || '—'}</p>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[
            { label: 'Students', href: '/school/students' },
            { label: student.full_name },
        ]}>
            <Head title={student.full_name} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/school/students"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-xl font-bold text-indigo-600 shrink-0">
                            {student.photo_url
                                ? <img src={student.photo_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                : (student.initials || student.first_name[0].toUpperCase())
                            }
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{student.full_name}</h1>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status] ?? statusColors.inactive}`}>
                                    {student.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 font-mono">{student.admission_no}</p>
                        </div>
                    </div>
                </div>
                <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Link href={`/school/students/${student.id}/edit`}>
                        <Pencil className="w-4 h-4" /> Edit
                    </Link>
                </Button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { icon: GraduationCap, label: 'Class', value: student.school_class?.name ?? '—' },
                    { icon: Users,         label: 'Section', value: student.section?.name ?? '—' },
                    { icon: Flag,          label: 'House', value: student.house?.name ?? '—' },
                    { icon: BookOpen,      label: 'Department', value: student.department?.name ?? '—' },
                    { icon: FileText,      label: 'Documents', value: String(student.documents?.length ?? 0) },
                ].map((s) => (
                    <Card key={s.label} className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                <s.icon className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-800">
                {(['personal', 'guardian', 'documents'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >{t}</button>
                ))}
            </div>

            {/* Personal tab */}
            {tab === 'personal' && (
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        <InfoRow label="Full Name"      value={student.full_name} />
                        <InfoRow label="Gender"         value={student.gender} />
                        <InfoRow label="Date of Birth"  value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : null} />
                        <InfoRow label="Place of Birth" value={student.place_of_birth} />
                        <InfoRow label="Blood Group"    value={student.blood_group} />
                        <InfoRow label="Religion"       value={student.religion} />
                        <InfoRow label="Nationality"    value={student.nationality} />
                        <InfoRow label="Phone"          value={student.phone} />
                        <InfoRow label="Email"          value={student.email} />
                        <InfoRow label="Category"       value={student.category} />
                        <InfoRow label="Roll No"        value={student.roll_no} />
                        <InfoRow label="Admission Date" value={student.admission_date ? new Date(student.admission_date).toLocaleDateString() : null} />
                        <InfoRow label="Admission Type" value={student.admission_type} />
                        <InfoRow label="House"          value={student.house?.name} />
                        <InfoRow label="Department"     value={student.department?.name} />
                        <InfoRow label="Previous School" value={student.previous_school} />
                        {student.address && (
                            <div className="col-span-3">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Address</p>
                                <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{student.address}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Guardian tab */}
            {tab === 'guardian' && (
                <div className="space-y-4">
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Guardians</CardTitle></CardHeader>
                        <CardContent>
                            {student.guardians?.length ? (
                                <div className="space-y-2">
                                    {student.guardians.map((g: any) => (
                                        <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                        {g.name}
                                                        {g.pivot?.is_primary ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Primary</span> : null}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{[g.pivot?.relationship ?? g.relation, g.phone].filter(Boolean).join(' · ')}</p>
                                                </div>
                                            </div>
                                            {g.email && <span className="text-xs text-slate-500">{g.email}</span>}
                                        </div>
                                    ))}
                                </div>
                            ) : student.guardian ? (
                                <p className="text-sm text-slate-400">Legacy guardian record — see details below.</p>
                            ) : (
                                <p className="text-sm text-slate-400">No guardians on record.</p>
                            )}
                        </CardContent>
                    </Card>

                    {student.guardian && !student.guardians?.length && (
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Guardian Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                <InfoRow label="Name"       value={student.guardian.name} />
                                <InfoRow label="Relation"   value={student.guardian.relation} />
                                <InfoRow label="Phone"      value={student.guardian.phone} />
                                <InfoRow label="Email"      value={student.guardian.email} />
                                <InfoRow label="Occupation" value={student.guardian.occupation} />
                                {student.guardian.address && (
                                    <div className="col-span-3">
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">Address</p>
                                        <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{student.guardian.address}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Documents tab */}
            {tab === 'documents' && (
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 flex-row items-center justify-between">
                        <CardTitle className="text-sm">Documents</CardTitle>
                        <Button size="sm" variant="outline" onClick={() => setDocOpen(true)} className="inline-flex items-center gap-2">
                            <FileUp className="w-3.5 h-3.5" /> Upload
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {!student.documents?.length ? (
                            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {student.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.title}</p>
                                                {doc.file_size && <p className="text-xs text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => router.put(`/school/students/documents/${doc.id}/visibility`)}
                                                className={`text-[10px] px-2 py-1 rounded-full font-medium ${doc.visible_to_parent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                                                title={doc.visible_to_parent ? 'Visible to parents — click to hide' : 'Hidden from parents — click to share'}
                                            >
                                                {doc.visible_to_parent ? 'Parent-visible' : 'Private'}
                                            </button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:text-indigo-600" asChild>
                                                <a href={`/school/students/documents/${doc.id}/download`} download>
                                                    <Download className="w-3.5 h-3.5" />
                                                </a>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                                                onClick={() => { if (confirm('Delete this document?')) router.delete(`/school/students/documents/${doc.id}`); }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Upload dialog */}
            <Dialog open={docOpen} onOpenChange={setDocOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(uploadDoc)} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Document Title <span className="text-red-500">*</span></Label>
                            <Input placeholder="e.g. Birth Certificate" {...register('title')} />
                            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>File <span className="text-red-500">*</span></Label>
                            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" {...register('file')} />
                            {errors.file && <p className="text-xs text-red-500">{errors.file.message as string}</p>}
                            <p className="text-xs text-slate-400">PDF, JPG, PNG · max 5 MB</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 dark:border-slate-600"
                                checked={visibleToParent ?? false}
                                onChange={(e) => setValue('visible_to_parent', e.target.checked)}
                            />
                            Visible to parents in the portal
                        </label>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDocOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">Upload</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
