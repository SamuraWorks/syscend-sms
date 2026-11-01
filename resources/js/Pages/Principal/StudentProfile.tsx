import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, GraduationCap, CreditCard, CheckCircle2, XCircle, Clock, ArrowLeft, Phone, Mail, ChevronRight } from 'lucide-react';
import { router, Link } from '@inertiajs/react';

interface Student {
    id: number; full_name: string; admission_no: string | null; student_id: string | null;
    gender: string | null; date_of_birth: string | null; blood_group: string | null;
    phone: string | null; email: string | null; address: string | null;
    photo_url: string | null; class: string | null; section: string | null;
    department: string | null; status: string; medical_info: string | null;
    guardian: { name: string; phone: string; email: string; relation: string | null } | null;
}
interface AttendanceSummary { present: number; absent: number; late: number; }
interface MarkRow { exam: string | null; subject: string | null; marks: number | null; grade: string | null; absent: boolean; }
interface FeeStatus { total_fees: number; paid: number; outstanding: number; status: string; }
interface Props {
    linked: boolean;
    student: Student; attendanceSummary: AttendanceSummary;
    recentMarks: MarkRow[]; feeStatus: FeeStatus;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

export default function StudentProfile({ linked, student, attendanceSummary, recentMarks, feeStatus }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Student Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalAtt = (attendanceSummary.present ?? 0) + (attendanceSummary.absent ?? 0) + (attendanceSummary.late ?? 0);
    const attRate = totalAtt > 0 ? Math.round((attendanceSummary.present / totalAtt) * 100) : 0;

    return (
        <AppLayout title={student.full_name}>
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/school/principal/students" className="hover:text-slate-700 dark:hover:text-slate-300">Students</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{student.full_name}</span>
                </div>

                <button onClick={() => router.visit('/school/principal/students')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Students
                </button>

                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photo_url
                            ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{student.full_name}</h1>
                        <p className="text-white/80 text-sm">{student.class}{student.section ? ` — ${student.section}` : ''}{student.department ? ` · ${student.department}` : ''}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 capitalize">{student.status}</Badge>
                            {student.admission_no && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">#{student.admission_no}</Badge>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{attendanceSummary.present}</p>
                            <p className="text-xs text-slate-500">Present</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{attendanceSummary.absent}</p>
                            <p className="text-xs text-slate-500">Absent</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{attendanceSummary.late}</p>
                            <p className="text-xs text-slate-500">Late</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <GraduationCap className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{attRate}%</p>
                            <p className="text-xs text-slate-500">Attendance Rate</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="w-4 h-4 text-indigo-500" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Full Name" value={student.full_name} />
                            <Field label="Gender" value={student.gender} />
                            <Field label="Date of Birth" value={student.date_of_birth} />
                            <Field label="Blood Group" value={student.blood_group} />
                            <Field label="Phone" value={student.phone} />
                            <Field label="Email" value={student.email} />
                            <Field label="Address" value={student.address} />
                            <Field label="Medical Info" value={student.medical_info} />
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <GraduationCap className="w-4 h-4 text-green-500" /> Academic Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Field label="Admission No" value={student.admission_no} />
                                <Field label="Student ID" value={student.student_id} />
                                <Field label="Class" value={student.class} />
                                <Field label="Section" value={student.section} />
                                <Field label="Department" value={student.department} />
                                <Field label="Status" value={student.status} />
                            </CardContent>
                        </Card>

                        {student.guardian && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                        <Phone className="w-4 h-4 text-violet-500" /> Guardian
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Field label="Name" value={student.guardian.name} />
                                    <Field label="Relation" value={student.guardian.relation} />
                                    <Field label="Phone" value={student.guardian.phone} />
                                    <Field label="Email" value={student.guardian.email} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <CreditCard className="w-4 h-4 text-emerald-500" /> Fee Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Total Fees</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Le {feeStatus.total_fees.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Paid</p>
                                <p className="text-lg font-bold text-green-600">Le {feeStatus.paid.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Outstanding</p>
                                <p className="text-lg font-bold text-red-600">Le {feeStatus.outstanding.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <Badge variant="secondary" className={`text-xs capitalize ${feeStatus.status === 'paid' ? 'bg-green-100 text-green-700' : feeStatus.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{feeStatus.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {recentMarks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <GraduationCap className="w-4 h-4 text-indigo-500" /> Recent Marks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-center">Marks</TableHead>
                                        <TableHead>Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentMarks.map((m, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-sm">{m.exam ?? '—'}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-900 dark:text-white">{m.subject ?? '—'}</TableCell>
                                            <TableCell className="text-center text-sm">{m.absent ? 'Absent' : m.marks ?? '—'}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">{m.grade ?? '—'}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
