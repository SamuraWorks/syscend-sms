import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronRight, ArrowLeft, Users, GraduationCap, Heart, KeyRound, Check } from 'lucide-react';
import type { PageProps } from '@/Types';
import { usePage } from '@inertiajs/react';

interface Props {
    roles: string[];
    classes: Array<{ id: number; name: string }>;
    sections: Array<{ id: number; class_id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
    designations: Array<{ id: number; department_id: number; name: string }>;
    staffTypes: string[];
}

const STEPS = ['Account Type', 'Personal Info', 'Account & Roles', 'Review & Create'];

const ACCOUNT_TYPES = [
    { value: 'staff', label: 'Staff', icon: Users, description: 'Teachers, administrators, and support staff' },
    { value: 'student', label: 'Student', icon: GraduationCap, description: 'Enrolled students' },
    { value: 'parent', label: 'Parent / Guardian', icon: Heart, description: 'Parents or guardians of students' },
] as const;

export default function CreateUser({ roles, classes, sections, departments, designations }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [step, setStep] = useState(0);
    const [accountType, setAccountType] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        account_type: '',
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        blood_group: '',
        religion: '',
        nationality: 'Sierra Leonean',
        phone: '',
        email: '',
        address: '',
        username: '',
        password_mode: 'generated',
        custom_password: '',
        roles: [] as string[],
        send_welcome_email: false,
        department_id: '',
        designation_id: '',
        joining_date: '',
        salary_type: 'fixed',
        salary: '',
        teacher_type: '',
        form_master_class_id: '',
        form_master_section_id: '',
        class_id: '',
        section_id: '',
        admission_date: '',
        roll_no: '',
        guardian_name: '',
        guardian_relation: '',
        guardian_phone: '',
        guardian_email: '',
    });

    const filteredDesignations = useMemo(
        () => data.department_id
            ? designations.filter(d => d.department_id === Number(data.department_id))
            : designations,
        [data.department_id, designations],
    );

    const filteredSections = useMemo(
        () => data.class_id
            ? sections.filter(s => s.class_id === Number(data.class_id))
            : [],
        [data.class_id, sections],
    );

    const fmSections = useMemo(
        () => data.form_master_class_id
            ? sections.filter(s => s.class_id === Number(data.form_master_class_id))
            : [],
        [data.form_master_class_id, sections],
    );

    function next() {
        if (step === 0 && !accountType) return;
        if (step === 0) setData('account_type', accountType);
        setStep(s => Math.min(s + 1, STEPS.length - 1));
    }

    function prev() { setStep(s => Math.max(s - 1, 0)); }

    function handleGenerateUsername() {
        router.post('/school/users/generate-password', {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                const props = page.props as Record<string, unknown>;
                const flash = props.flash as Record<string, unknown> | undefined;
                if (flash?.username) {
                    setData('username', flash.username as string);
                }
            },
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/users');
    }

    function canAdvance(): boolean {
        if (step === 0) return !!accountType;
        if (step === 1) return !!data.first_name && !!data.gender;
        if (step === 2) return data.roles.length > 0;
        return true;
    }

    return (
        <AppLayout title="Create User">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New User</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Unified user creation with temporary password and role assignment</p>
                </div>

                {flash?.error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                                i <= step ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500',
                            )}>
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={cn('text-sm font-medium hidden sm:inline', i <= step ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
                                {label}
                            </span>
                            {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">

                            {/* Step 0: Account Type */}
                            {step === 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Account Type</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {ACCOUNT_TYPES.map(({ value, label, icon: Icon, description }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setAccountType(value)}
                                                className={cn(
                                                    'p-6 rounded-xl border-2 text-left transition-all hover:shadow-md',
                                                    accountType === value
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500'
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300',
                                                )}
                                            >
                                                <Icon className={cn('w-8 h-8 mb-3', accountType === value ? 'text-indigo-600' : 'text-slate-400')} />
                                                <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Personal Info */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>First Name <span className="text-red-500">*</span></Label>
                                            <Input value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                                            {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Last Name</Label>
                                            <Input value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Gender <span className="text-red-500">*</span></Label>
                                            <Select value={data.gender} onValueChange={v => setData('gender', v)}>
                                                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Date of Birth</Label>
                                            <Input type="date" value={data.date_of_birth} onChange={e => setData('date_of_birth', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>Phone</Label>
                                            <Input value={data.phone} onChange={e => setData('phone', e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Email</Label>
                                            <Input type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Address</Label>
                                        <Textarea value={data.address} onChange={e => setData('address', e.target.value)} rows={2} />
                                    </div>

                                    {/* Staff-specific fields */}
                                    {accountType === 'staff' && (
                                        <>
                                            <hr className="border-slate-200 dark:border-slate-700" />
                                            <h3 className="text-md font-semibold text-slate-900 dark:text-white">Employment Details</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Department</Label>
                                                    <Select value={data.department_id} onValueChange={v => setData({ department_id: v, designation_id: '' })}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Designation</Label>
                                                    <Select value={data.designation_id} onValueChange={v => setData('designation_id', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {filteredDesignations.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Joining Date</Label>
                                                    <Input type="date" value={data.joining_date} onChange={e => setData('joining_date', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Salary Type</Label>
                                                    <Select value={data.salary_type} onValueChange={v => setData('salary_type', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">Fixed</SelectItem>
                                                            <SelectItem value="hourly">Hourly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Salary</Label>
                                                    <Input type="number" value={data.salary} onChange={e => setData('salary', e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Teacher Type</Label>
                                                    <Select value={data.teacher_type} onValueChange={v => setData('teacher_type', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="subject_teacher">Subject Teacher</SelectItem>
                                                            <SelectItem value="form_master">Form Master</SelectItem>
                                                            <SelectItem value="both">Both</SelectItem>
                                                            <SelectItem value="non_teaching">Non-Teaching</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Form Master Class</Label>
                                                    <Select value={data.form_master_class_id} onValueChange={v => setData({ form_master_class_id: v, form_master_section_id: '' })}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Form Master Section</Label>
                                                    <Select value={data.form_master_section_id} onValueChange={v => setData('form_master_section_id', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {fmSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Student-specific fields */}
                                    {accountType === 'student' && (
                                        <>
                                            <hr className="border-slate-200 dark:border-slate-700" />
                                            <h3 className="text-md font-semibold text-slate-900 dark:text-white">Enrollment Details</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Class <span className="text-red-500">*</span></Label>
                                                    <Select value={data.class_id} onValueChange={v => setData({ class_id: v, section_id: '' })}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Section</Label>
                                                    <Select value={data.section_id} onValueChange={v => setData('section_id', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Roll No</Label>
                                                    <Input value={data.roll_no} onChange={e => setData('roll_no', e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Admission Date</Label>
                                                    <Input type="date" value={data.admission_date} onChange={e => setData('admission_date', e.target.value)} />
                                                </div>
                                            </div>

                                            <hr className="border-slate-200 dark:border-slate-700" />
                                            <h3 className="text-md font-semibold text-slate-900 dark:text-white">Guardian Information</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Guardian Name <span className="text-red-500">*</span></Label>
                                                    <Input value={data.guardian_name} onChange={e => setData('guardian_name', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Relation <span className="text-red-500">*</span></Label>
                                                    <Select value={data.guardian_relation} onValueChange={v => setData('guardian_relation', v)}>
                                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="father">Father</SelectItem>
                                                            <SelectItem value="mother">Mother</SelectItem>
                                                            <SelectItem value="guardian">Guardian</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label>Guardian Phone</Label>
                                                    <Input value={data.guardian_phone} onChange={e => setData('guardian_phone', e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Guardian Email</Label>
                                                    <Input type="email" value={data.guardian_email} onChange={e => setData('guardian_email', e.target.value)} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Account & Roles */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account & Roles</h2>

                                    <div className="space-y-1.5">
                                        <Label>Username</Label>
                                        <div className="flex gap-2">
                                            <Input value={data.username} onChange={e => setData('username', e.target.value)} placeholder="auto-generated if empty" className="flex-1" />
                                            <Button type="button" variant="outline" onClick={handleGenerateUsername} className="shrink-0">
                                                <KeyRound className="w-4 h-4 mr-1" /> Generate
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="password_mode" value="generated" checked={data.password_mode === 'generated'} onChange={() => setData('password_mode', 'generated')} className="accent-indigo-600" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Auto-generate</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="password_mode" value="manual" checked={data.password_mode === 'manual'} onChange={() => setData('password_mode', 'manual')} className="accent-indigo-600" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Set manually</span>
                                            </label>
                                        </div>
                                        {data.password_mode === 'manual' && (
                                            <div className="mt-2">
                                                <Input type="password" value={data.custom_password} onChange={e => setData('custom_password', e.target.value)} placeholder="Min 6 characters" />
                                                {errors.custom_password && <p className="text-xs text-red-500 mt-1">{errors.custom_password}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Roles <span className="text-red-500">*</span></Label>
                                        {errors.roles && <p className="text-xs text-red-500">{errors.roles}</p>}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {roles.map(role => (
                                                <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.roles.includes(role)}
                                                        onChange={e => {
                                                            const newRoles = e.target.checked
                                                                ? [...data.roles, role]
                                                                : data.roles.filter(r => r !== role);
                                                            setData('roles', newRoles);
                                                        }}
                                                        className="accent-indigo-600 rounded"
                                                    />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{role.replace(/-/g, ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.send_welcome_email}
                                            onChange={e => setData('send_welcome_email', e.target.checked)}
                                            className="accent-indigo-600 rounded"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Welcome Email</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Include login credentials in the email</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Step 3: Review */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Review & Create</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Personal Info</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-slate-500">Name:</span> <span className="text-slate-900 dark:text-white font-medium">{data.first_name} {data.last_name}</span></div>
                                                <div><span className="text-slate-500">Gender:</span> <span className="text-slate-900 dark:text-white">{data.gender}</span></div>
                                                <div><span className="text-slate-500">Phone:</span> <span className="text-slate-900 dark:text-white">{data.phone || '—'}</span></div>
                                                <div><span className="text-slate-500">Email:</span> <span className="text-slate-900 dark:text-white">{data.email || '—'}</span></div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Account</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-slate-500">Type:</span> <span className="text-slate-900 dark:text-white font-medium capitalize">{data.account_type}</span></div>
                                                <div><span className="text-slate-500">Username:</span> <span className="text-slate-900 dark:text-white font-mono">{data.username || '(auto-generated)'}</span></div>
                                                <div><span className="text-slate-500">Password:</span> <span className="text-slate-900 dark:text-white">{data.password_mode === 'generated' ? 'Auto-generated' : 'Custom'}</span></div>
                                                <div><span className="text-slate-500">Roles:</span> <span className="text-slate-900 dark:text-white">{data.roles.map(r => r.replace(/-/g, ' ')).join(', ')}</span></div>
                                                <div><span className="text-slate-500">Welcome Email:</span> <span className="text-slate-900 dark:text-white">{data.send_welcome_email ? 'Yes' : 'No'}</span></div>
                                            </div>
                                        </div>

                                        {data.account_type === 'student' && (
                                            <div>
                                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Guardian</h3>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div><span className="text-slate-500">Name:</span> <span className="text-slate-900 dark:text-white">{data.guardian_name || '—'}</span></div>
                                                    <div><span className="text-slate-500">Relation:</span> <span className="text-slate-900 dark:text-white">{data.guardian_relation || '—'}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-6">
                        {step > 0 ? (
                            <Button type="button" variant="outline" onClick={prev}>
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        ) : <div />}

                        {step < STEPS.length - 1 ? (
                            <Button type="button" onClick={next} disabled={!canAdvance()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {processing ? 'Creating...' : 'Create User'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
