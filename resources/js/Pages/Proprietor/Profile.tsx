import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    User, Building2, Phone, Mail, MapPin, FileText, Download, Briefcase, ChevronRight,
} from 'lucide-react';

interface Staff { id: number; full_name: string; emp_id: string; photo_url: string | null; designation: string | null; department: string | null; phone: string | null; email: string | null; status: string; }
interface School { name: string; address: string | null; phone: string | null; email: string | null; }
interface Document { id: number; title: string; file_type: string | null; file_size: number | null; file_url: string; }
interface Props {
    linked: boolean; staff: Staff | null; school: School | null; documents: Document[];
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
        </div>
    );
}

function formatSize(bytes: number | null) {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ProprietorProfile({ linked, staff, school, documents }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Profile">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Profile</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {staff?.photo_url
                            ? <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff?.full_name || 'Proprietor'}</h1>
                        <p className="text-white/80 text-sm">
                            {staff?.emp_id ? `Emp# ${staff.emp_id}` : ''}
                            {staff?.designation ? ` · ${staff.designation}` : ''}
                            {staff?.department ? ` · ${staff.department}` : ''}
                        </p>
                        {staff && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className={cn('text-[10px] border-0 capitalize', statusColor[staff.status] || 'bg-white/20 text-white')}>
                                    {staff.status}
                                </Badge>
                            </div>
                        )}
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
                            <Field label="Full Name" value={staff?.full_name} />
                            <Field label="Phone" value={staff?.phone} />
                            <Field label="Email" value={staff?.email} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Building2 className="w-4 h-4 text-blue-500" /> School Association
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {school ? (
                                <>
                                    <Field label="School Name" value={school.name} />
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{school.address || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{school.phone || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{school.email || '—'}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-400">No school associated.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Briefcase className="w-4 h-4 text-violet-500" /> Professional Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Field label="Employee ID" value={staff?.emp_id} />
                            <Field label="Designation" value={staff?.designation} />
                            <Field label="Department" value={staff?.department} />
                            <Field label="Status" value={staff?.status} />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <FileText className="w-4 h-4 text-amber-500" /> Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {documents.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No documents available.</p>
                        ) : (
                            <div className="space-y-3">
                                {documents.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                                            <p className="text-xs text-slate-500">{formatSize(doc.file_size)} · {doc.file_type?.toUpperCase() || '—'}</p>
                                        </div>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
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
