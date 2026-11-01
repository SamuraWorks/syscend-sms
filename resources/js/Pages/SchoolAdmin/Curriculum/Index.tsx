import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Layers, Upload, Plus, ChevronRight, X, AlertCircle } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import ImportUploadDialog from '@/components/ImportUploadDialog';
import type { PageProps } from '@/Types';

interface SubjectOffering {
    id: number;
    subject_name: string;
    subject_code: string;
    subject_type: 'compulsory' | 'elective' | 'selective';
    selection_group: string | null;
    is_required: boolean;
    enrollments_count: number;
}

interface ClassData {
    id: number;
    name: string;
    school_level: string | null;
    sections: { id: number; name: string }[];
    offerings: SubjectOffering[];
    offerings_count: number;
}

interface AcademicYear {
    id: number;
    name: string;
}

interface Props extends PageProps {
    classes: ClassData[];
    academicYears: AcademicYear[];
    currentYear: AcademicYear | null;
}

const TYPE_BADGE: Record<string, string> = {
    compulsory: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    elective: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    selective: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
};

export default function CurriculumIndex() {
    const { classes = [], academicYears = [], currentYear, flash } = usePage<Props>().props;
    const [addFormClassId, setAddFormClassId] = useState<number | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [form, setForm] = useState({
        subject_code: '',
        subject_name: '',
        subject_type: 'compulsory' as SubjectOffering['subject_type'],
    });

    function handleSubmit(classId: number) {
        if (!currentYear) return;
        setFormError(null);
        router.post('/school-admin/curriculum', {
            ...form,
            class_id: classId,
            academic_year_id: currentYear.id,
        }, {
            onSuccess: () => {
                setAddFormClassId(null);
                setForm({ subject_code: '', subject_name: '', subject_type: 'compulsory' });
                setFormError(null);
            },
            onError: (errors) => {
                const first = Object.values(errors)[0];
                setFormError(typeof first === 'string' ? first : 'Failed to add subject. Please check all fields.');
            },
        });
    }

    const yearParam = currentYear ? `?academic_year_id=${currentYear.id}` : '';

    return (
        <AppLayout breadcrumbs={[{ label: 'Curriculum' }]}>
            <Head title="Curriculum" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Subject offerings organized by class</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Import Curriculum
                    </Button>
                </div>
            </div>

            {!currentYear && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">No active academic year. Please set one in School Settings.</p>
                </div>
            )}

            {flash?.success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300">{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{flash.error}</p>
                </div>
            )}

            {classes.length === 0 ? (
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="py-16 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No classes found. Create classes in Academic Structure first.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <Card
                            key={cls.id}
                            className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <Link href={`/school-admin/curriculum/class/${cls.id}${yearParam}`} className="block">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {cls.name}
                                    </CardTitle>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        <span className="inline-flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            {cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {cls.offerings_count} subject{cls.offerings_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {cls.offerings?.length > 0 && (
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {cls.offerings.slice(0, 8).map((offering) => (
                                                <div key={offering.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-700 dark:text-slate-300 truncate">
                                                        <span className="font-medium text-slate-500 dark:text-slate-400 mr-1">{offering.subject_code}</span>
                                                        {offering.subject_name}
                                                    </span>
                                                    <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TYPE_BADGE[offering.subject_type]}`}>
                                                        {offering.subject_type}
                                                    </span>
                                                </div>
                                            ))}
                                            {cls.offerings.length > 8 && (
                                                <p className="text-[10px] text-slate-400">+{cls.offerings.length - 8} more</p>
                                            )}
                                        </div>
                                    )}
                                    {(cls.offerings?.length ?? 0) === 0 && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No subjects added yet</p>
                                    )}
                                </CardContent>
                            </Link>

                            <div className="px-6 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800">
                                {addFormClassId === cls.id ? (
                                    <div className="space-y-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">Add Subject</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAddFormClassId(null);
                                                    setForm({ subject_code: '', subject_name: '', subject_type: 'compulsory' });
                                                }}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Code"
                                                value={form.subject_code}
                                                onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                placeholder="Name"
                                                value={form.subject_name}
                                                onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Select value={form.subject_type} onValueChange={(val) => setForm({ ...form, subject_type: val as SubjectOffering['subject_type'] })}>
                                            <SelectTrigger className="h-8 text-xs w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="compulsory">Compulsory</SelectItem>
                                                <SelectItem value="elective">Elective</SelectItem>
                                                <SelectItem value="selective">Selective</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {formError && (
                                            <p className="text-xs text-red-500 mt-1">{formError}</p>
                                        )}
                                        <Button
                                            size="sm"
                                            className="w-full h-7 text-xs"
                                            onClick={() => handleSubmit(cls.id)}
                                            disabled={!form.subject_code.trim() || !form.subject_name.trim() || !currentYear}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-xs text-slate-500 hover:text-indigo-600 mt-2 inline-flex items-center gap-1"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setAddFormClassId(cls.id);
                                        }}
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Subject
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <ImportUploadDialog open={importOpen} onOpenChange={setImportOpen} type="curriculum" label="Curriculum" />
        </AppLayout>
    );
}
