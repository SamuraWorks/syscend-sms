import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Mail, Phone } from 'lucide-react';

interface Staff {
    id: number; full_name: string; emp_id: string;
    designation: string | null; department: string | null;
    email: string | null; phone: string | null;
    photo_url: string | null; gender: string | null;
    date_of_birth: string | null; blood_group: string | null;
    religion: string | null; nationality: string | null;
    address: string | null; joining_date: string | null; status: string | null;
}
interface Props {
    linked: boolean; staff: Staff | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

export default function LibrarianProfile({ linked, staff }: Props) {
    if (!linked || !staff) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {staff.photo_url
                            ? <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">Emp# {staff.emp_id}{staff.designation ? ` · ${staff.designation}` : ''}{staff.department ? ` · ${staff.department}` : ''}</p>
                        <Badge variant="secondary" className="mt-1 text-[10px] bg-white/20 text-white border-0">Librarian</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="w-4 h-4 text-blue-500" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Full Name" value={staff.full_name} />
                            <Field label="Employee ID" value={staff.emp_id} />
                            <Field label="Gender" value={staff.gender} />
                            <Field label="Date of Birth" value={staff.date_of_birth} />
                            <Field label="Blood Group" value={staff.blood_group} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="w-4 h-4 text-emerald-500" /> Professional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Designation" value={staff.designation} />
                            <Field label="Department" value={staff.department} />
                            <Field label="Join Date" value={staff.joining_date} />
                            <Field label="Status" value={staff.status} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Mail className="w-4 h-4 text-violet-500" /> Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Email" value={staff.email} />
                            <Field label="Phone" value={staff.phone} />
                            <Field label="Address" value={staff.address} />
                            <Field label="Nationality" value={staff.nationality} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
