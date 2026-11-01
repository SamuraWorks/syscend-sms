import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, GraduationCap, Mail, MapPin, Phone, User, Users } from 'lucide-react';

interface Guardian { name: string; phone: string | null; email: string | null; relation: string | null }
interface StudentInfo {
    id: number; full_name: string; admission_no: string; student_id: string | null;
    gender: string | null; date_of_birth: string | null; blood_group: string | null;
    phone: string | null; email: string | null; address: string | null; photo_url: string | null;
    class: string | null; section: string | null; department: string | null;
    status: string; medical_info: string | null; guardian: Guardian | null;
}
interface MarkRow { exam: string | null; subject: string | null; marks: number | null; grade: string | null; absent: boolean }
interface HomeworkRow { id: number; title: string; subject: string | null; due_date: string | null; submitted: boolean; status: string }

interface Props {
    linked: boolean;
    teacher: { full_name: string };
    student: StudentInfo;
    attendance: Record<string, number>;
    marks: MarkRow[];
    homework: HomeworkRow[];
}

const field = (label: string, value: string | null | undefined) => (
    <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-900 dark:text-white mt-0.5">{value || '—'}</p>
    </div>
);

const presenceTotal = (attendance: Record<string, number>) =>
    Object.values(attendance).reduce((a, b) => a + b, 0);

export default function StudentProfile({ linked, teacher, student, attendance, marks, homework }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Student Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Student Profile">
            <Head title="Student Profile" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Student Profile</h1>
                        <p className="text-sm text-slate-500">{teacher.full_name}</p>
                    </div>
                    <Link href="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Users className="w-4 h-4" /> Back to Students
                    </Link>
                </div>

                <Card>
                    <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 overflow-hidden text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {student.photo_url
                                ? <img src={student.photo_url} className="w-20 h-20 rounded-full object-cover" alt="" />
                                : (student.full_name[0] ?? '?').toUpperCase()
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student.full_name}</h2>
                                <Badge variant="secondary" className="capitalize">{student.status}</Badge>
                                {student.blood_group && <Badge variant="outline" className="text-xs">{student.blood_group}</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {student.student_id ?? student.admission_no}</span>
                                <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {student.class ?? '—'}{student.section ? ` / ${student.section}` : ''}</span>
                                {student.department && <span className="inline-flex items-center gap-1.5">{student.department}</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Personal & Contact</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {field('Gender', student.gender)}
                            {field('Date of Birth', student.date_of_birth)}
                            <div>
                                <p className="text-xs text-slate-400">Phone</p>
                                <p className="text-sm text-slate-900 dark:text-white mt-0.5 inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Email</p>
                                <p className="text-sm text-slate-900 dark:text-white mt-0.5 inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Address</p>
                                <p className="text-sm text-slate-900 dark:text-white mt-0.5 inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {student.address || '—'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Guardian</CardTitle></CardHeader>
                            <CardContent>
                                {student.guardian ? (
                                    <div className="space-y-2">
                                        <p className="text-base font-medium text-slate-900 dark:text-white">{student.guardian.name}<span className="text-xs text-slate-400 ml-2 capitalize">({student.guardian.relation ?? 'guardian'})</span></p>
                                        <p className="text-sm text-slate-500 inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {student.guardian.phone || '—'}</p>
                                        <p className="text-sm text-slate-500 inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {student.guardian.email || '—'}</p>
                                    </div>
                                ) : <p className="text-sm text-slate-400">No guardian on record</p>}
                            </CardContent>
                        </Card>
                        {student.medical_info && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Medical Notes</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-slate-600 dark:text-slate-400">{student.medical_info}</p></CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm inline-flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-500" /> Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(attendance).length === 0 ? (
                            <p className="text-sm text-slate-400">No attendance records</p>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(attendance).map(([status, count]) => {
                                    const colors: Record<string, string> = {
                                        present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
                                        absent: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                                        late: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
                                        excused: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
                                    };
                                    return (
                                        <span key={status} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize ${colors[status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {status}: {count}
                                        </span>
                                    );
                                })}
                                {presenceTotal(attendance) > 0 && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        Total: {presenceTotal(attendance)}
                                    </span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm">Recent Marks</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        {marks.length === 0 ? (
                            <p className="text-sm text-slate-400">No marks recorded yet</p>
                        ) : (
                            <Table className="min-w-[640px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-right">Marks</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {marks.map((m, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">{m.exam ?? '—'}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{m.subject ?? '—'}</TableCell>
                                            <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">{m.marks ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{m.grade ? <Badge variant="secondary">{m.grade}</Badge> : '—'}</TableCell>
                                            <TableCell>{m.absent ? <Badge variant="destructive">Absent</Badge> : <Badge variant="secondary">Marked</Badge>}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm">Recent Homework</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        {homework.length === 0 ? (
                            <p className="text-sm text-slate-400">No homework assigned</p>
                        ) : (
                            <Table className="min-w-[640px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Title</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homework.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{h.title}</TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">{h.subject ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">{h.due_date ?? '—'}</TableCell>
                                            <TableCell>
                                                {h.submitted ? (
                                                    <Badge className="capitalize" variant={h.status === 'graded' ? 'secondary' : 'default'}>{h.status}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">Pending</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
