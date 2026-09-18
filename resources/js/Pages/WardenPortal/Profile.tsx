import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { User, Briefcase, Mail, Phone, MapPin, Calendar, ChevronRight } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Staff {
    id: number; full_name: string; emp_id: string; photo_url: string | null;
    gender: string | null; date_of_birth: string | null; blood_group: string | null;
    religion: string | null; nationality: string | null; phone: string | null;
    email: string | null; address: string | null; joining_date: string | null;
    status: string; department: string | null; designation: string | null;
}
interface Props {
    linked: boolean;
    staff: Staff | null;
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

export default function WardenProfile({ linked, staff }: Props) {
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
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Profile</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar src={staff.photo_url} name={staff.full_name} size="2xl" showRing />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">Emp# {staff.emp_id}{staff.designation ? ` · ${staff.designation}` : ''}{staff.department ? ` · ${staff.department}` : ''}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">Warden</Badge>
                            <Badge className={cn('text-[10px] border-0', statusColor[staff.status] ?? 'bg-white/20 text-white')}>{staff.status}</Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <User className="w-4 h-4 text-violet-500" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Full Name" value={staff.full_name} />
                            <Field label="Gender" value={staff.gender} />
                            <Field label="Date of Birth" value={staff.date_of_birth} />
                            <Field label="Blood Group" value={staff.blood_group} />
                            <Field label="Religion" value={staff.religion} />
                            <Field label="Nationality" value={staff.nationality} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Professional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Employee ID" value={staff.emp_id} />
                            <Field label="Department" value={staff.department} />
                            <Field label="Designation" value={staff.designation} />
                            <Field label="Joining Date" value={staff.joining_date} />
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <Badge className={cn('text-[10px]', statusColor[staff.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{staff.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Phone className="w-4 h-4 text-emerald-500" /> Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Phone" value={staff.phone} />
                            <Field label="Email" value={staff.email} />
                            <Field label="Address" value={staff.address} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
