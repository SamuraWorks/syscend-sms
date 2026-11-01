import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2, UserPlus, Phone, Mail, MapPin, Briefcase, GraduationCap, CheckCircle2, Clock, ShieldCheck, KeyRound, Copy } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/Types';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    status: string;
    school_class: { id: number; name: string } | null;
    section: { id: number; name: string } | null;
}

interface Guardian {
    id: number;
    name: string;
    relation: string;
    phone: string | null;
    alt_phone: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    registration_status: string;
    children_count: number;
    children: Student[];
    user: { id: number; name: string; email: string; status: string } | null;
    created_at: string;
}

interface Props extends PageProps {
    parent: Guardian;
    roles: string[];
}

export default function ShowParent() {
    const { parent, roles = [] } = usePage<Props>().props;
    const { flash } = usePage<PageProps>().props;
    const [copied, setCopied] = useState(false);

    const confirmDelete = () => {
        if (confirm(`Remove parent "${parent.name}"? Linked students will be unlinked.`)) {
            router.delete(`/school-admin/parents/${parent.id}`);
        }
    };

    const resetPassword = () => {
        if (!parent.user) return;
        if (confirm(`Issue a new temporary password for ${parent.name} (${parent.user.email})? Their current password stops working immediately.`)) {
            router.post(`/school-admin/parents/${parent.id}/reset-password`, {}, { preserveScroll: true });
        }
    };

    const copyCredentials = () => {
        if (!flash?.temp_password) return;
        navigator.clipboard.writeText(
            `Login: ${window.location.origin}/login\nEmail: ${parent.user?.email ?? ''}\nPassword: ${flash.temp_password}\n\nPlease change your password after first login.`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Parents', href: '/school-admin/parents' },
            { label: parent.name },
        ]}>
            <Head title={parent.name} />

            <div className="max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/school-admin/parents"><ArrowLeft className="w-4 h-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{parent.name}</h1>
                            <p className="text-sm text-slate-500 capitalize">{parent.relation}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {parent.user && (
                            <Button variant="outline" size="sm" onClick={resetPassword} className="inline-flex items-center gap-1.5">
                                <KeyRound className="w-4 h-4" /> Reset Password
                            </Button>
                        )}
                        <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-1.5">
                            <Link href={`/school-admin/parents/${parent.id}/edit`}><Pencil className="w-4 h-4" /> Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={confirmDelete} className="text-red-600 hover:text-red-700 inline-flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4" /> Remove
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">{flash.success}</div>
                )}

                {flash?.temp_password && (
                    <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                    <KeyRound className="w-5 h-5" />
                                    <h3 className="font-semibold text-sm">New Temporary Password</h3>
                                </div>
                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                                    Shown only once. Share it securely — {parent.name} must change it at next login.
                                </p>
                                <div className="flex items-center gap-2 font-mono text-sm text-slate-900 dark:text-white select-all">
                                    <span className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">Password</span>
                                    <span>{flash.temp_password}</span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={copyCredentials} className="shrink-0 inline-flex items-center gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300">{parent.phone ?? 'No phone'}</span>
                                </div>
                                {parent.alt_phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span className="text-slate-500 dark:text-slate-400">{parent.alt_phone} <span className="text-xs">(alt)</span></span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300">{parent.email ?? 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300">{parent.occupation ?? 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300">{parent.address ?? 'No address'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Children ({parent.children?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!parent.children || parent.children.length === 0 ? (
                                    <p className="text-sm text-slate-400 py-6 text-center">No children linked</p>
                                ) : (
                                    <div className="space-y-2">
                                        {parent.children.map((s) => (
                                            <Link
                                                key={s.id}
                                                href={`/school/students/${s.id}`}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                    {(s.first_name?.[0] ?? '?').toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</p>
                                                    <p className="text-xs text-slate-400">{s.admission_no} · {s.school_class?.name ?? '—'}{s.section ? ` / ${s.section.name}` : ''}</p>
                                                </div>
                                                {(s as any).pivot?.relationship && (
                                                    <Badge className="border-0 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 capitalize">
                                                        {(s as any).pivot.relationship}
                                                    </Badge>
                                                )}
                                                <Badge className={`border-0 text-xs ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
                                                    {s.status}
                                                </Badge>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader><CardTitle className="text-base">Account Status</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {parent.registration_status === 'registered' ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{parent.registration_status}</p>
                                        <p className="text-xs text-slate-400">
                                            {parent.user ? `User: ${parent.user.email}` : 'No login account'}
                                        </p>
                                    </div>
                                </div>
                                {roles.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">System Roles</p>
                                            <div className="flex flex-wrap gap-1">
                                                {roles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${role === 'parent' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' : role === 'teacher' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'}`}
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                            {roles.includes('teacher') && roles.includes('parent') && (
                                                <p className="text-xs text-slate-400 mt-1">This user is both a teacher and a parent</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Created</span>
                                    <span className="text-slate-900 dark:text-white">{new Date(parent.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Children</span>
                                    <span className="text-slate-900 dark:text-white">{parent.children_count}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
