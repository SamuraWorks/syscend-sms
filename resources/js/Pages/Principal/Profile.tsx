import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { User, ChevronRight, Mail, Phone, Building, Shield, FileText } from 'lucide-react';

interface PrincipalDocument {
    id: number;
    title: string;
    file_type: string;
    file_size: string;
    file_url: string;
    date: string;
}

interface Props {
    linked: boolean;
    principal: {
        id: number;
        full_name: string;
        emp_id: string;
        photo_url: string | null;
        gender: string | null;
        date_of_birth: string | null;
        blood_group: string | null;
        religion: string | null;
        nationality: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        joining_date: string | null;
        status: string | null;
        department: string | null;
        designation: string | null;
    };
    documents: PrincipalDocument[];
}

export default function Profile({ linked, principal, documents }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Profile">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Profile">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Profile</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" /> My Profile
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Your personal and professional information</p>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {principal.photo_url
                            ? <img src={principal.photo_url} alt={principal.full_name} className="w-full h-full object-cover" />
                            : <User className="w-10 h-10 text-white/80" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{principal.full_name}</h2>
                        {principal.designation && <p className="text-white/80 text-sm">{principal.designation}</p>}
                        <p className="text-white/70 text-xs mt-0.5">Emp ID: {principal.emp_id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" /> Personal Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Full Name</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Gender</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{principal.gender ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Date of Birth</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.date_of_birth ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Blood Group</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.blood_group ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Religion</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.religion ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Nationality</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.nationality ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.phone ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.email ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Address</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.address ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-violet-500" /> Professional Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Employee ID</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.emp_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Department</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.department ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Designation</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.designation ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Joining Date</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{principal.joining_date ?? '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Status</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{principal.status ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-500" /> Documents
                        </h3>
                        {documents.length === 0 ? (
                            <p className="text-sm text-slate-500">No documents uploaded.</p>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {documents.map((doc) => (
                                    <a
                                        key={doc.id}
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                                            <p className="text-xs text-slate-500">{doc.file_type} · {doc.file_size} · {doc.date}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
