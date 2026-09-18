import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    ArrowLeft, MoreHorizontal, KeyRound, ShieldCheck, RotateCcw, Pencil, Trash2,
    Mail, Copy, Printer, Eye, EyeOff, User, Briefcase, GraduationCap,
    ClipboardList, Save, Loader2, CheckCircle2,
} from 'lucide-react';
import type { PageProps } from '@/Types';

interface Props {
    user: {
        id: number;
        name: string;
        email: string | null;
        phone: string | null;
        username: string | null;
        status: string;
        is_temporary_password: boolean;
        must_change_password: boolean;
        last_login_at: string | null;
        created_at: string;
        roles: Array<{ id: number; name: string }>;
        avatar_url: string | null;
        created_by: number | null;
        createdBy?: { id: number; name: string } | null;
    };
    staff: {
        id: number;
        emp_id: string | null;
        department?: { name: string };
        designation?: { name: string };
        joining_date: string | null;
        teacher_type: string | null;
    } | null;
    student: {
        id: number;
        admission_no: string | null;
        school_class?: { name: string };
        section?: { name: string };
    } | null;
    auditLogs: Array<{
        id: number;
        action: string;
        description: string | null;
        created_at: string;
        performer?: { name: string } | null;
    }>;
    allRoles: string[];
}

const statusColors: Record<string, string> = {
    active:   'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const statusLabels: Record<string, string> = {
    active: 'Active', inactive: 'Inactive',
};

type Tab = 'overview' | 'roles' | 'linked' | 'audit';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide w-36 shrink-0">{label}</span>
            <span className="text-sm text-slate-900 dark:text-white">{value ?? '—'}</span>
        </div>
    );
}

export default function ShowUser({ user, staff, student, auditLogs, allRoles }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showPassword, setShowPassword] = useState(false);
    const [editingRoles, setEditingRoles] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles.map(r => r.name));
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [roleSaving, setRoleSaving] = useState(false);

    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'overview', label: 'Overview', icon: User },
        { key: 'roles', label: 'Roles', icon: ShieldCheck },
        { key: 'linked', label: 'Linked Records', icon: staff ? Briefcase : GraduationCap },
        { key: 'audit', label: 'Audit Log', icon: ClipboardList },
    ];

    function handleToggleStatus() {
        router.post(`/school/users/${user.id}/toggle-status`);
    }

    function handleSendWelcome() {
        router.post(`/school/users/${user.id}/send-welcome`);
    }

    function handleResetPassword() {
        router.post(`/school/users/${user.id}/reset-password`);
        setResetDialogOpen(false);
    }

    function handleRoleToggle(roleName: string) {
        setSelectedRoles(prev =>
            prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName]
        );
    }

    function handleSaveRoles() {
        setRoleSaving(true);
        router.put(`/school/users/${user.id}/roles`, { roles: selectedRoles }, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['auth'] });
            },
            onFinish: () => { setRoleSaving(false); setEditingRoles(false); },
        });
    }

    function handleCopyCredentials() {
        const email = user.email ?? '';
        const username = user.username ?? '';
        const pwd = String((flash as Record<string, unknown>)?.temp_password ?? '');
        const text = `Name: ${user.name}\nEmail: ${email}\nUsername: ${username}\nPassword: ${pwd}\n\nLogin: ${window.location.origin}/login\n\nPlease change your password after first login.`;
        navigator.clipboard.writeText(text);
    }

    function handlePrintCredentials() {
        const pwd = (flash as Record<string, unknown>)?.temp_password ?? '********';
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<html><head><title>Login Credentials — ${user.name}</title><style>body{font-family:sans-serif;padding:40px}h2{margin-bottom:4px}h3{margin:0 0 16px;color:#666;font-weight:normal}p{margin:4px 0;font-size:14px}.label{font-weight:bold;width:80px;display:inline-block}.note{margin-top:24px;padding:12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;font-size:13px;color:#92400e}</style></head><body>
            <h2>Login Credentials</h2>
            <h3>${user.name}</h3>
            <p><span class="label">Email:</span> ${user.email ?? '—'}</p>
            <p><span class="label">Username:</span> ${user.username ?? '—'}</p>
            <p><span class="label">Password:</span> <strong>${pwd}</strong></p>
            <p><span class="label">Login URL:</span> ${window.location.origin}/login</p>
            <div class="note">Please change your password after first login. Do not share this password.</div>
        </body></html>`);
        w.document.close();
        w.print();
    }

    function toggleRoleChecked(roleName: string) {
        return selectedRoles.includes(roleName);
    }

    return (
        <AppLayout title={`User — ${user.name}`}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/school/users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> Back to Users
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" className="inline-flex items-center gap-2" />}>
                            <MoreHorizontal className="w-4 h-4" /> Actions
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/school/users/${user.id}/edit`} className="flex items-center gap-2 text-sm">
                                    <Pencil className="w-4 h-4" /> Edit User
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSendWelcome} className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4" /> Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggleStatus} className="flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4" /> Toggle Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetDialogOpen(true)} className="flex items-center gap-2 text-sm">
                                <RotateCcw className="w-4 h-4" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                if (confirm(`Delete "${user.name}"? This cannot be undone.`)) {
                                    router.delete(`/school/users/${user.id}`);
                                }
                            }} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <Trash2 className="w-4 h-4" /> Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {flash.success}
                    </div>
                )}

                {/* Credentials card */}
                {flash?.temp_password && (
                    <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                        <KeyRound className="w-5 h-5" />
                                        <h3 className="font-semibold text-sm">
                                            {flash?.parent_name ? `Parent Credentials — ${flash.parent_name}` : 'Temporary Credentials'}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                                        Copy, print, or email these credentials to the parent. They will be asked to change this password on first login.
                                    </p>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase w-20">Username</span>
                                            <span className="font-mono text-sm text-slate-900 dark:text-white">{user.username ?? '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase w-20">Password</span>
                                            <span className="font-mono text-sm text-slate-900 dark:text-white">
                                                {showPassword ? String(flash.temp_password) : '••••••••'}
                                            </span>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Button variant="outline" size="sm" onClick={handleSendWelcome} className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handlePrintCredentials} className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                                        <Printer className="w-3.5 h-3.5" /> Print
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCopyCredentials} className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                                        <Copy className="w-3.5 h-3.5" /> Copy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Profile card */}
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.email ?? 'No email'}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge className={`border-0 ${statusColors[user.status] ?? ''}`}>
                                        {statusLabels[user.status] ?? user.status}
                                    </Badge>
                                    {user.is_temporary_password && (
                                        <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border-0">
                                            <KeyRound className="w-3 h-3 mr-1" /> Temp Password
                                        </Badge>
                                    )}
                                    {user.must_change_password && (
                                        <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
                                            Must Change Password
                                        </Badge>
                                    )}
                                    {user.roles.map(role => (
                                        <Badge key={role.id} variant="secondary" className="text-xs">{role.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === key
                                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                            >
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <InfoRow label="Full Name" value={user.name} />
                            <InfoRow label="Email" value={user.email} />
                            <InfoRow label="Phone" value={user.phone} />
                            <InfoRow label="Username" value={user.username} />
                            <InfoRow label="Status" value={statusLabels[user.status] ?? user.status} />
                            <InfoRow label="Roles" value={user.roles.map(r => r.name).join(', ') || undefined} />
                            <InfoRow label="Created At" value={new Date(user.created_at).toLocaleString()} />
                            <InfoRow label="Last Login" value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : undefined} />
                            <InfoRow label="Created By" value={user.createdBy?.name ?? undefined} />
                        </CardContent>
                    </Card>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Assigned Roles</CardTitle>
                            {!editingRoles ? (
                                <Button variant="outline" size="sm" onClick={() => { setSelectedRoles(user.roles.map(r => r.name)); setEditingRoles(true); }}>
                                    Edit Roles
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingRoles(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSaveRoles} disabled={roleSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-1.5">
                                        {roleSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                        {roleSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-6">
                            {!editingRoles ? (
                                <div className="flex flex-wrap gap-2">
                                    {user.roles.length === 0 ? (
                                        <p className="text-sm text-slate-400">No roles assigned.</p>
                                    ) : user.roles.map(role => (
                                        <Badge key={role.id} variant="secondary" className="text-sm px-3 py-1">{role.name}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {allRoles.map(roleName => (
                                        <label key={roleName} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors">
                                            <Checkbox
                                                checked={toggleRoleChecked(roleName)}
                                                onCheckedChange={() => handleRoleToggle(roleName)}
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{roleName}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Linked Records Tab */}
                {activeTab === 'linked' && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            {staff ? (
                                <>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-indigo-600" /> Staff Record
                                    </h3>
                                    <InfoRow label="Employee ID" value={staff.emp_id} />
                                    <InfoRow label="Department" value={staff.department?.name} />
                                    <InfoRow label="Designation" value={staff.designation?.name} />
                                    <InfoRow label="Joining Date" value={staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : undefined} />
                                    <InfoRow label="Teacher Type" value={staff.teacher_type} />
                                </>
                            ) : student ? (
                                <>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-indigo-600" /> Student Record
                                    </h3>
                                    <InfoRow label="Admission No" value={student.admission_no} />
                                    <InfoRow label="Class" value={student.school_class?.name} />
                                    <InfoRow label="Section" value={student.section?.name} />
                                </>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-8">No linked staff or student record found.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Audit Log Tab */}
                {activeTab === 'audit' && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-0">
                            {auditLogs.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-12">No audit logs yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                                                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Action</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Description</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide hidden sm:table-cell">Performed By</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.map(log => (
                                                <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.description ?? '—'}</td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">{log.performer?.name ?? '—'}</td>
                                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-500 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to reset the password for <strong className="text-slate-900 dark:text-white">{user.name}</strong>? A new temporary password will be generated and the user will need to change it on next login.
                    </p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} className="bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4" /> Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
