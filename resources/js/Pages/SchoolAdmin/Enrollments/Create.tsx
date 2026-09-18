import { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, CheckCircle2, Search, GraduationCap } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { PageProps } from '@/Types';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    student_id: string;
    school_class: { id: number; name: string } | null;
    section: { id: number; name: string } | null;
}

interface SubjectOffering {
    id: number;
    subject_name: string;
    subject_code: string;
    subject_type: 'compulsory' | 'elective' | 'selective';
    selection_group: string | null;
    is_required: boolean;
    min_selection: number;
    max_selection: number;
}

interface Props extends PageProps {
    student: Student | null;
    availableOfferings: SubjectOffering[];
    compulsoryOfferings: SubjectOffering[];
    enrolledIds: number[];
    academicYears: { id: number; name: string }[];
    currentYear: { id: number; name: string };
    students?: { id: number; first_name: string; last_name: string; admission_no: string; school_class: { id: number; name: string } | null }[];
}

export default function CreateEnrollment() {
    const { student, availableOfferings = [], compulsoryOfferings = [], enrolledIds = [], academicYears = [], currentYear, students = [] } = usePage<Props>().props;

    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(student?.id ?? null);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(enrolledIds));
    const [academicYearId, setAcademicYearId] = useState<string>(String(currentYear.id));
    const [submitting, setSubmitting] = useState(false);

    const electiveGroups = useMemo(() => {
        const groups: Record<string, SubjectOffering[]> = {};
        availableOfferings
            .filter((o) => !compulsoryOfferings.some((c) => c.id === o.id) && !enrolledIds.includes(o.id))
            .forEach((o) => {
                const group = o.selection_group || 'Electives';
                if (!groups[group]) groups[group] = [];
                groups[group].push(o);
            });
        return groups;
    }, [availableOfferings, compulsoryOfferings, enrolledIds]);

    const groupSelectionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.keys(electiveGroups).forEach((group) => {
            counts[group] = electiveGroups[group].filter((o) => selectedIds.has(o.id)).length;
        });
        return counts;
    }, [electiveGroups, selectedIds]);

    const groupValidation = useMemo(() => {
        const errors: Record<string, string> = {};
        Object.entries(electiveGroups).forEach(([group, offerings]) => {
            const count = groupSelectionCounts[group] ?? 0;
            const minOffering = offerings[0];
            if (minOffering && count < minOffering.min_selection) {
                errors[group] = `Select at least ${minOffering.min_selection} subject${minOffering.min_selection !== 1 ? 's' : ''}`;
            }
            if (minOffering && count > minOffering.max_selection) {
                errors[group] = `Select at most ${minOffering.max_selection} subject${minOffering.max_selection !== 1 ? 's' : ''}`;
            }
        });
        return errors;
    }, [electiveGroups, groupSelectionCounts]);

    const canSubmit = Object.keys(groupValidation).length === 0 && academicYearId;

    const toggleId = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSubmit = () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        router.post('/school-admin/enrollments', {
            student_id: student!.id,
            subject_offering_ids: Array.from(selectedIds),
            academic_year_id: Number(academicYearId),
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    // Student picker mode — no student selected yet
    if (!student && students.length > 0) {
        const filteredStudents = students.filter(s =>
            s.first_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.last_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.admission_no?.toLowerCase().includes(studentSearch.toLowerCase())
        );

        return (
            <AppLayout breadcrumbs={[
                { label: 'Enrollments', href: '/school-admin/enrollments' },
                { label: 'New Enrollment' },
            ]}>
                <Head title="New Enrollment" />
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/school-admin/enrollments"><ArrowLeft className="w-4 h-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Select Student</h1>
                            <p className="text-sm text-slate-500">Choose a student to enroll in subjects</p>
                        </div>
                    </div>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or admission number..."
                                    className="pl-9 h-9"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <p className="text-sm text-slate-400 py-8 text-center">No students found</p>
                                ) : filteredStudents.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            params.set('student_id', String(s.id));
                                            if (currentYear) params.set('academic_year_id', String(currentYear.id));
                                            router.get(`/school-admin/enrollments/create?${params.toString()}`);
                                        }}
                                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                                            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</p>
                                            <p className="text-xs text-slate-400">{s.admission_no} · {s.school_class?.name ?? 'No class'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={[
            { label: 'Enrollments', href: '/school-admin/enrollments' },
            { label: 'New Enrollment' },
        ]}>
            <Head title="New Enrollment" />

            <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/school-admin/enrollments"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Enrollment</h1>
                        <p className="text-sm text-slate-500">Enroll {student!.first_name} {student!.last_name} in subjects</p>
                    </div>
                </div>

                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Name</p>
                                <p className="font-medium text-slate-900 dark:text-white">{student!.first_name} {student!.last_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Student ID</p>
                                <p className="font-medium text-slate-900 dark:text-white font-mono">{student!.student_id}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Class</p>
                                <p className="font-medium text-slate-900 dark:text-white">{student!.school_class?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Section</p>
                                <p className="font-medium text-slate-900 dark:text-white">{student!.section?.name ?? '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-1.5 mb-6">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">Academic Year <span className="text-red-500">*</span></label>
                    <Select value={academicYearId} onValueChange={setAcademicYearId}>
                        <SelectTrigger className="w-full sm:w-60 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {academicYears.map((y) => (
                                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {compulsoryOfferings.length > 0 && (
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Compulsory Subjects ({compulsoryOfferings.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {compulsoryOfferings.map((o) => {
                                const alreadyEnrolled = enrolledIds.includes(o.id);
                                return (
                                    <div key={o.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <Checkbox checked disabled />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{o.subject_name}</p>
                                                <p className="text-xs text-slate-400">{o.subject_code}</p>
                                            </div>
                                        </div>
                                        {alreadyEnrolled && (
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Already enrolled</span>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {Object.entries(electiveGroups).map(([group, offerings]) => {
                    const min = offerings[0]?.min_selection ?? 0;
                    const max = offerings[0]?.max_selection ?? 0;
                    const count = groupSelectionCounts[group] ?? 0;
                    const hasError = !!groupValidation[group];

                    return (
                        <Card key={group} className={`dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6 ${hasError ? 'border-red-300 dark:border-red-800' : ''}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">{group}</CardTitle>
                                    <span className={`text-xs font-medium ${hasError ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        Selected {count} of {min}-{max}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {offerings.map((o) => (
                                    <div key={o.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedIds.has(o.id)}
                                                onCheckedChange={() => toggleId(o.id)}
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{o.subject_name}</p>
                                                <p className="text-xs text-slate-400">{o.subject_code}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}

                {Object.keys(groupValidation).length > 0 && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Selection constraints not met</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5 text-sm text-red-700 dark:text-red-400">
                                    {Object.entries(groupValidation).map(([group, msg]) => (
                                        <li key={group}><strong>{group}:</strong> {msg}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pb-8">
                    <Button variant="outline" asChild>
                        <Link href="/school-admin/enrollments">Cancel</Link>
                    </Button>
                    <Button
                        disabled={!canSubmit || submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Enrolling…' : 'Enroll Student'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
