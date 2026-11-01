import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Mail, Phone, Calendar, FileText, GraduationCap } from 'lucide-react';

interface Staff {
    id: number; full_name: string; emp_id: string;
    designation: string | null; department: string | null;
    email: string | null; phone: string | null;
    qualification: string | null; join_date: string | null;
    photo_url: string | null;
}
interface StaffDocument { id: number; title: string; file_type: string | null; date: string; }
interface Props {
    linked: boolean; staff: Staff | null; documents: StaffDocument[];
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

function docTypeBadge(type: string | null) {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === 'pdf') return <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">PDF</Badge>;
    if (['doc', 'docx'].includes(t)) return <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">DOC</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{type.toUpperCase()}</Badge>;
}

export default function AccountantProfile({ linked, staff, documents }: Props) {
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

    if (!staff) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Staff record not found</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {staff.photo_url
                            ? <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">Emp# {staff.emp_id}{staff.designation ? ` · ${staff.designation}` : ''}{staff.department ? ` · ${staff.department}` : ''}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">Accountant</Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="w-4 h-4 text-emerald-500" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Full Name" value={staff.full_name} />
                            <Field label="Employee ID" value={staff.emp_id} />
                            <Field label="Email" value={staff.email} />
                            <Field label="Phone" value={staff.phone} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Professional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Designation" value={staff.designation} />
                            <Field label="Department" value={staff.department} />
                            <Field label="Qualification" value={staff.qualification} />
                            <Field label="Join Date" value={staff.join_date} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="w-4 h-4 text-violet-500" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {documents.length === 0 ? (
                                <p className="text-sm text-slate-400">No documents on file.</p>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{doc.title}</span>
                                                {docTypeBadge(doc.file_type)}
                                            </div>
                                            <span className="text-xs text-slate-400 shrink-0 ml-2">{doc.date}</span>
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
