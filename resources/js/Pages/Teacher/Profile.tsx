import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, BookOpen, Phone, Mail, MapPin, Calendar, Shield, Heart } from 'lucide-react';

interface Subject { id: number; name: string; }
interface AssignedClass { class: string | null; section: string | null; }
interface Props {
    linked: boolean;
    teacher: {
        id: number; full_name: string; emp_id: string; photo_url: string | null;
        gender: string | null; date_of_birth: string | null; blood_group: string | null;
        religion: string | null; nationality: string | null; phone: string | null;
        email: string | null; address: string | null; joining_date: string | null;
        status: string; teacher_type: string; department: string | null;
        designation: string | null; is_form_master: boolean; is_subject_teacher: boolean;
        form_master_class: string | null; form_master_section: string | null;
    } | null;
    assignedSubjects: Subject[]; assignedClasses: AssignedClass[];
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
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TeacherProfile({ linked, teacher, assignedSubjects, assignedClasses }: Props) {
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

    if (!teacher) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Teacher record not found</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {teacher.photo_url
                            ? <img src={teacher.photo_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{teacher.full_name}</h1>
                        <p className="text-white/80 text-sm">Emp# {teacher.emp_id}{teacher.designation ? ` · ${teacher.designation}` : ''}{teacher.department ? ` · ${teacher.department}` : ''}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 capitalize">{teacher.status}</Badge>
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 capitalize">{teacher.teacher_type}</Badge>
                            {teacher.is_form_master && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">Form Master</Badge>}
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
                            <Field label="Full Name" value={teacher.full_name} />
                            <Field label="Gender" value={teacher.gender} />
                            <Field label="Date of Birth" value={teacher.date_of_birth} />
                            <Field label="Blood Group" value={teacher.blood_group} />
                            <Field label="Religion" value={teacher.religion} />
                            <Field label="Nationality" value={teacher.nationality} />
                            <Field label="Phone" value={teacher.phone} />
                            <Field label="Email" value={teacher.email} />
                            <Field label="Address" value={teacher.address} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="w-4 h-4 text-green-500" /> Professional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Employee ID" value={teacher.emp_id} />
                            <Field label="Joining Date" value={teacher.joining_date} />
                            <Field label="Status" value={teacher.status} />
                            <Field label="Teacher Type" value={teacher.teacher_type} />
                            <Field label="Department" value={teacher.department} />
                            <Field label="Designation" value={teacher.designation} />
                            {teacher.is_form_master && (
                                <div>
                                    <p className="text-xs text-slate-500">Form Master Class</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {teacher.form_master_class}{teacher.form_master_section ? ` — ${teacher.form_master_section}` : ''}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <BookOpen className="w-4 h-4 text-violet-500" /> Assigned Subjects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {assignedSubjects.length === 0 ? (
                                <p className="text-sm text-slate-400">No subjects assigned.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {assignedSubjects.map(s => (
                                        <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Shield className="w-4 h-4 text-amber-500" /> Assigned Classes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {assignedClasses.length === 0 ? (
                                <p className="text-sm text-slate-400">No classes assigned.</p>
                            ) : (
                                <div className="space-y-2">
                                    {assignedClasses.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{c.class}</span>
                                            {c.section && <span className="text-slate-500">— {c.section}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
