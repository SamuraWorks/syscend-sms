import { Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ArrowLeft, Save, Loader2, User, Mail, Phone, AtSign, ShieldCheck,
    Briefcase, Heart, Calendar,
} from 'lucide-react';
import type { PageProps } from '@/Types';

interface StaffRecord {
    id: number; first_name: string; last_name: string; gender: string | null;
    date_of_birth: string | null; blood_group: string | null; religion: string | null;
    nationality: string | null; phone: string | null; email: string | null;
    address: string | null; emp_id: string | null; joining_date: string | null;
    salary: number | null; salary_type: string | null;
    teacher_type: string | null; department_id: number | null;
    designation_id: number | null; form_master_class_id: number | null;
    form_master_section_id: number | null;
}

interface IdName { id: number; name: string; }
interface SectionItem { id: number; class_id: number; name: string; }

interface Props {
    user: {
        id: number; name: string; email: string | null; phone: string | null;
        username: string | null; status: string;
        roles: Array<{ id: number; name: string }>;
    };
    staff: StaffRecord | null;
    roles: string[];
    classes: IdName[];
    sections: SectionItem[];
    departments: IdName[];
    designations: IdName[];
    staffTypes: string[];
}

export default function EditUser({ user, staff, roles, classes, sections, departments, designations, staffTypes }: Props) {
    const { flash } = usePage<PageProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email ?? '',
        phone: user.phone ?? '',
        username: user.username ?? '',
        status: user.status,
        roles: user.roles.map(r => r.name),
        // Staff fields
        gender: staff?.gender ?? '',
        date_of_birth: staff?.date_of_birth ? staff.date_of_birth.split('T')[0] : '',
        blood_group: staff?.blood_group ?? '',
        religion: staff?.religion ?? '',
        nationality: staff?.nationality ?? '',
        address: staff?.address ?? '',
        teacher_type: staff?.teacher_type ?? '',
        department_id: staff?.department_id?.toString() ?? '',
        designation_id: staff?.designation_id?.toString() ?? '',
        form_master_class_id: staff?.form_master_class_id?.toString() ?? '',
        form_master_section_id: staff?.form_master_section_id?.toString() ?? '',
        salary_type: staff?.salary_type ?? '',
        salary: staff?.salary?.toString() ?? '',
        joining_date: staff?.joining_date ? staff.joining_date.split('T')[0] : '',
    });

    function handleToggleRole(roleName: string) {
        setData('roles', data.roles.includes(roleName)
            ? data.roles.filter(r => r !== roleName)
            : [...data.roles, roleName]
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(`/school/users/${user.id}`);
    }

    const filteredSections = sections.filter(s =>
        data.form_master_class_id ? s.class_id === Number(data.form_master_class_id) : true
    );

    const hasStaffChanges = staff ? (
        data.gender !== (staff.gender ?? '')
        || data.date_of_birth !== (staff.date_of_birth ? staff.date_of_birth.split('T')[0] : '')
        || data.blood_group !== (staff.blood_group ?? '')
        || data.religion !== (staff.religion ?? '')
        || data.nationality !== (staff.nationality ?? '')
        || data.address !== (staff.address ?? '')
        || data.teacher_type !== (staff.teacher_type ?? '')
        || data.department_id !== (staff.department_id?.toString() ?? '')
        || data.designation_id !== (staff.designation_id?.toString() ?? '')
        || data.form_master_class_id !== (staff.form_master_class_id?.toString() ?? '')
        || data.form_master_section_id !== (staff.form_master_section_id?.toString() ?? '')
        || data.salary_type !== (staff.salary_type ?? '')
        || data.salary !== (staff.salary?.toString() ?? '')
        || data.joining_date !== (staff.joining_date ? staff.joining_date.split('T')[0] : '')
    ) : false;

    const hasChanges = data.name !== user.name
        || data.email !== (user.email ?? '')
        || data.phone !== (user.phone ?? '')
        || data.username !== (user.username ?? '')
        || data.status !== user.status
        || JSON.stringify(data.roles.sort()) !== JSON.stringify(user.roles.map(r => r.name).sort())
        || hasStaffChanges;

    return (
        <AppLayout title={`Edit — ${user.name}`}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href={`/school/users/${user.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> Back to User
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Account Info */}
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-600" /> Account Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Full Name *</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="mt-1" />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="pl-9" placeholder="user@example.com" />
                                    </div>
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <div className="relative mt-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} className="pl-9" placeholder="+23276123456" />
                                    </div>
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <div className="relative mt-1">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input id="username" value={data.username} onChange={e => setData('username', e.target.value)} className="pl-9" />
                                </div>
                                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Staff Personal Info */}
                    {staff && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-rose-600" /> Personal Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Employee ID</Label>
                                        <Input value={staff.emp_id ?? '—'} disabled className="mt-1 bg-slate-50 dark:bg-slate-800" />
                                    </div>
                                    <div>
                                        <Label htmlFor="gender">Gender</Label>
                                        <select
                                            id="gender"
                                            value={data.gender}
                                            onChange={e => setData('gender', e.target.value)}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                                        <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={e => setData('date_of_birth', e.target.value)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="blood_group">Blood Group</Label>
                                        <Input id="blood_group" value={data.blood_group} onChange={e => setData('blood_group', e.target.value)} className="mt-1" placeholder="e.g. O+" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="religion">Religion</Label>
                                        <Input id="religion" value={data.religion} onChange={e => setData('religion', e.target.value)} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="nationality">Nationality</Label>
                                        <Input id="nationality" value={data.nationality} onChange={e => setData('nationality', e.target.value)} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" value={data.address} onChange={e => setData('address', e.target.value)} className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Staff Professional Info */}
                    {staff && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" /> Professional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="teacher_type">Teacher Type</Label>
                                        <select
                                            id="teacher_type"
                                            value={data.teacher_type}
                                            onChange={e => setData('teacher_type', e.target.value)}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">Select</option>
                                            {staffTypes.map(t => (
                                                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="joining_date">Joining Date</Label>
                                        <Input id="joining_date" type="date" value={data.joining_date} onChange={e => setData('joining_date', e.target.value)} className="mt-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="department_id">Department</Label>
                                        <select
                                            id="department_id"
                                            value={data.department_id}
                                            onChange={e => setData('department_id', e.target.value)}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">None</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="designation_id">Designation</Label>
                                        <select
                                            id="designation_id"
                                            value={data.designation_id}
                                            onChange={e => setData('designation_id', e.target.value)}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">None</option>
                                            {designations.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="form_master_class_id">Form Master Class</Label>
                                        <select
                                            id="form_master_class_id"
                                            value={data.form_master_class_id}
                                            onChange={e => { setData('form_master_class_id', e.target.value); setData('form_master_section_id', ''); }}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">None</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="form_master_section_id">Form Master Section</Label>
                                        <select
                                            id="form_master_section_id"
                                            value={data.form_master_section_id}
                                            onChange={e => setData('form_master_section_id', e.target.value)}
                                            disabled={!data.form_master_class_id}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                                        >
                                            <option value="">None</option>
                                            {filteredSections.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="salary_type">Salary Type</Label>
                                        <select
                                            id="salary_type"
                                            value={data.salary_type}
                                            onChange={e => setData('salary_type', e.target.value)}
                                            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="">None</option>
                                            <option value="fixed">Fixed</option>
                                            <option value="hourly">Hourly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="salary">Salary</Label>
                                        <Input id="salary" type="number" min="0" step="0.01" value={data.salary} onChange={e => setData('salary', e.target.value)} className="mt-1" placeholder="0.00" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Status */}
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Account Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio" name="status" value="active"
                                        checked={data.status === 'active'}
                                        onChange={() => setData('status', 'active')}
                                        className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio" name="status" value="inactive"
                                        checked={data.status === 'inactive'}
                                        onChange={() => setData('status', 'inactive')}
                                        className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Inactive (Suspended)</span>
                                </label>
                            </div>
                            {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
                        </CardContent>
                    </Card>

                    {/* Roles */}
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Roles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {roles.map(roleName => (
                                    <label
                                        key={roleName}
                                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                                            data.roles.includes(roleName)
                                                ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/50'
                                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Checkbox
                                            checked={data.roles.includes(roleName)}
                                            onCheckedChange={() => handleToggleRole(roleName)}
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                            {roleName.replace(/-/g, ' ')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {errors.roles && <p className="text-xs text-red-500 mt-1">{errors.roles}</p>}
                            {data.roles.length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">At least one role is required.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/school/users/${user.id}`}>
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing || !hasChanges || data.roles.length === 0}>
                            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
