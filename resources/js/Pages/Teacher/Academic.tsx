import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, GraduationCap, Users } from 'lucide-react';

interface Subject { id: number; name: string; code: string | null; }
interface LoadSlot { subject: string | null; day: string | null; start_time: string | null; end_time: string | null; room: string | null; }
interface TeachingLoadItem { label: string; classes: LoadSlot[]; }
interface ClassCount { label: string; count: number; }
interface Props {
    linked: boolean; teacher: { full_name: string; teacher_type: string; };
    assignedSubjects: Subject[]; teachingLoad: TeachingLoadItem[];
    studentsPerClass: ClassCount[];
    academicYear: string | null; academicTerm: string | null;
}

export default function Academic({ linked, teacher, assignedSubjects, teachingLoad, studentsPerClass, academicYear, academicTerm }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Academic Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const maxStudents = studentsPerClass.length > 0
        ? Math.max(...studentsPerClass.map(c => c.count))
        : 1;

    return (
        <AppLayout title="Academic Overview">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Overview</h1>
                        <p className="text-sm text-slate-500">{teacher.full_name} · {teacher.teacher_type}</p>
                    </div>
                    {(academicYear || academicTerm) && (
                        <Badge variant="secondary" className="text-xs">{academicYear}{academicTerm ? ` · ${academicTerm}` : ''}</Badge>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BookOpen className="w-4 h-4 text-indigo-500" /> Assigned Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assignedSubjects.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No subjects assigned.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {assignedSubjects.map(s => (
                                    <Badge key={s.id} variant="secondary" className="text-xs">
                                        {s.name}{s.code ? ` (${s.code})` : ''}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-4 h-4 text-violet-500" /> Teaching Load
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teachingLoad.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No teaching load assigned.</p>
                        ) : (
                            <div className="space-y-4">
                                {teachingLoad.map(item => (
                                    <div key={item.label}>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{item.label}</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                        <th className="text-left py-2 font-medium">Subject</th>
                                                        <th className="text-left py-2 font-medium">Day</th>
                                                        <th className="text-left py-2 font-medium">Time</th>
                                                        <th className="text-left py-2 font-medium">Room</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {item.classes.map((slot, i) => (
                                                        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                                                            <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{slot.subject ?? '—'}</td>
                                                            <td className="py-2 text-slate-500 capitalize">{slot.day ?? '—'}</td>
                                                            <td className="py-2 text-slate-500">{slot.start_time && slot.end_time ? `${slot.start_time} – ${slot.end_time}` : '—'}</td>
                                                            <td className="py-2 text-slate-500">{slot.room ?? '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Users className="w-4 h-4 text-emerald-500" /> Students Per Class
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentsPerClass.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No class data available.</p>
                        ) : (
                            <div className="space-y-3">
                                {studentsPerClass.map(c => (
                                    <div key={c.label}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">{c.label}</span>
                                            <span className="text-slate-500 font-semibold">{c.count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 transition-all"
                                                style={{ width: `${maxStudents > 0 ? (c.count / maxStudents) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
