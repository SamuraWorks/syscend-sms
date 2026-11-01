import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, BookOpen, Hash, Heart, Phone, FileText } from 'lucide-react';

interface Props {
    linked: boolean;
    student: {
        id: number; full_name: string; admission_no: string; student_id: string | null;
        emis_number: string | null; roll_no: number | null;
        class: string | null; section: string | null; department: string | null;
        gender: string | null; date_of_birth: string | null; blood_group: string | null;
        religion: string | null; nationality: string | null; phone: string | null;
        email: string | null; address: string | null; photo_url: string | null;
        admission_date: string | null; previous_school: string | null;
        status: string; medical_info: string | null;
        npse_index_number: string | null; bece_index_number: string | null;
        wassce_index_number: string | null;
        guardian: { name: string; phone: string; email: string | null } | null;
    } | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    graduated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    expelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Profile({ linked, student }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    if (!student) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Student record not found</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {student.photo_url
                            ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{student.full_name}</h1>
                        <p className="text-white/80 text-sm">{student.class} — {student.section} · Adm# {student.admission_no}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 capitalize">{student.status}</Badge>
                            {student.student_id && <span className="text-xs text-white/60">ID: {student.student_id}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                            <Field label="Religion" value={student.religion} />
                            <Field label="Nationality" value={student.nationality} />
                            <Field label="Phone" value={student.phone} />
                            <Field label="Email" value={student.email} />
                            <Field label="Address" value={student.address} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <BookOpen className="w-4 h-4 text-green-500" /> Academic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Class" value={student.class} />
                            <Field label="Section" value={student.section} />
                            <Field label="Department" value={student.department} />
                            <Field label="Admission No" value={student.admission_no} />
                            <Field label="Student ID" value={student.student_id} />
                            <Field label="EMIS Number" value={student.emis_number} />
                            <Field label="Roll No" value={student.roll_no != null ? String(student.roll_no) : null} />
                            <Field label="Admission Date" value={student.admission_date} />
                            <Field label="Previous School" value={student.previous_school} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Hash className="w-4 h-4 text-violet-500" /> Exam Index Numbers
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="NPSE Index Number" value={student.npse_index_number} />
                            <Field label="BECE Index Number" value={student.bece_index_number} />
                            <Field label="WASSCE Index Number" value={student.wassce_index_number} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Shield className="w-4 h-4 text-amber-500" /> Guardian Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {student.guardian ? (
                                <>
                                    <Field label="Guardian Name" value={student.guardian.name} />
                                    <Field label="Guardian Phone" value={student.guardian.phone} />
                                    <Field label="Guardian Email" value={student.guardian.email} />
                                </>
                            ) : (
                                <p className="text-sm text-slate-400">No guardian information available.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Heart className="w-4 h-4 text-red-500" /> Medical Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{student.medical_info || 'No medical information recorded.'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="w-4 h-4 text-sky-500" /> Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge className={cn('capitalize', statusColor[student.status] ?? 'bg-slate-100 text-slate-600')}>{student.status}</Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
