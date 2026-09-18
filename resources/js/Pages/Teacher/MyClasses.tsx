import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Users, BookOpen, GraduationCap, ClipboardList } from 'lucide-react';

interface Subject { id: number; name: string; }
interface ClassItem {
    class_id: number; section_id: number;
    class_name: string; section_name: string;
    subjects: Subject[]; student_count: number; slots: number;
}
interface FormMasterInfo {
    class_id: number; section_id: number;
    class_name: string; section_name: string;
    student_count: number;
}
interface Props {
    linked: boolean;
    teacher: { full_name: string; teacher_type: string; };
    classes: ClassItem[];
    formMasterInfo: FormMasterInfo | null;
}

export default function MyClasses({ linked, teacher, classes, formMasterInfo }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Classes">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-400 mt-1">Contact your administrator to link your account.</p>
                </div>
            </AppLayout>
        );
    }

    const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);
    const totalSubjects = classes.reduce((sum, c) => sum + c.subjects.length, 0);

    return (
        <AppLayout title="My Classes">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Classes</h1>
                    <p className="text-sm text-slate-500">{teacher.full_name} · {teacher.teacher_type.replace(/_/g, ' ')}</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{classes.length}</p>
                                <p className="text-xs text-slate-500">Assigned Classes</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
                                <p className="text-xs text-slate-500">Total Students</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSubjects}</p>
                                <p className="text-xs text-slate-500">Subjects Taught</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Master badge */}
                {formMasterInfo && (
                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Form Master</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        {formMasterInfo.class_name} - {formMasterInfo.section_name} · {formMasterInfo.student_count} students
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Class cards */}
                {classes.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="py-12 text-center">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No classes assigned yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classes.map(c => (
                            <Card key={`${c.class_id}-${c.section_id}`} className="border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-base font-semibold text-slate-800 dark:text-white">
                                            {c.class_name} - {c.section_name}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">{c.student_count} students</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-1.5">Subjects</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {c.subjects.map(s => (
                                                <Badge key={s.id} variant="outline" className="text-xs">{s.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Link
                                            href={`/school/teacher/attendance/take?class=${c.class_id}&section=${c.section_id}`}
                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            <ClipboardList className="w-3 h-3" /> Take Attendance
                                        </Link>
                                        <Link
                                            href={`/school/teacher/students?class=${c.class_id}&section=${c.section_id}`}
                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        >
                                            <Users className="w-3 h-3" /> View Students
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
