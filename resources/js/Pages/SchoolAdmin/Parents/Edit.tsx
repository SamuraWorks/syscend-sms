import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { PageProps } from '@/Types';

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    school_class: { id: number; name: string } | null;
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
    user_id: number | null;
}

interface Props extends PageProps {
    parent: Guardian;
    linkedStudentIds: number[];
    unlinkedStudents: Student[];
}

export default function EditParent() {
    const { parent, linkedStudentIds = [], unlinkedStudents = [] } = usePage<Props>().props;
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>(linkedStudentIds);
    const [studentSearch, setStudentSearch] = useState('');

    const [form, setForm] = useState({
        name: parent.name,
        relation: parent.relation,
        phone: parent.phone ?? '',
        alt_phone: parent.alt_phone ?? '',
        email: parent.email ?? '',
        occupation: parent.occupation ?? '',
        address: parent.address ?? '',
        create_account: false,
    });

    const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

    const toggleStudent = (id: number) => {
        setSelectedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    };

    const allStudents = unlinkedStudents.filter((s) => selectedIds.includes(s.id));
    const availableStudents = unlinkedStudents.filter((s) =>
        !selectedIds.includes(s.id) &&
        `${s.first_name} ${s.last_name} ${s.admission_no}`.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.put(`/school-admin/parents/${parent.id}`, {
            ...form,
            student_ids: selectedIds,
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Parents', href: '/school-admin/parents' },
            { label: parent.name, href: `/school-admin/parents/${parent.id}` },
            { label: 'Edit' },
        ]}>
            <Head title={`Edit ${parent.name}`} />

            <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/school-admin/parents/${parent.id}`}><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Parent</h1>
                        <p className="text-sm text-slate-500">{parent.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-base">Parent Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                                    <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relation *</label>
                                    <Select value={form.relation} onValueChange={(v) => set('relation', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mother">Mother</SelectItem>
                                            <SelectItem value="father">Father</SelectItem>
                                            <SelectItem value="guardian">Guardian</SelectItem>
                                            <SelectItem value="uncle">Uncle</SelectItem>
                                            <SelectItem value="aunt">Aunt</SelectItem>
                                            <SelectItem value="sibling">Sibling</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                    <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+232..." required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alternative Phone</label>
                                    <Input value={form.alt_phone} onChange={(e) => set('alt_phone', e.target.value)} placeholder="+232..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Occupation</label>
                                    <Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                    <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
                                </div>
                            </div>

                            {form.email && !parent.user_id && (
                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <Checkbox
                                        id="create_account"
                                        checked={form.create_account}
                                        onCheckedChange={(v) => set('create_account', !!v)}
                                    />
                                    <label htmlFor="create_account" className="text-sm text-slate-700 dark:text-slate-300">
                                        Create parent login account
                                    </label>
                                </div>
                            )}
                            {form.email && !parent.user_id && (
                                <p className="text-xs text-slate-400">
                                    If a user with this email already exists (e.g. a teacher), the parent role will be added to their existing account.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-base">Link Children ({selectedIds.length})</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {allStudents.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 mb-1">Currently linked:</p>
                                    {allStudents.map((s) => (
                                        <label
                                            key={s.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800"
                                        >
                                            <Checkbox checked={true} onCheckedChange={() => toggleStudent(s.id)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</p>
                                                <p className="text-xs text-slate-400">{s.admission_no} · {s.school_class?.name ?? 'No class'}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-slate-500 mb-1">Available students:</p>
                                <Input
                                    placeholder="Search to add more..."
                                    className="h-9 mb-2"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                    {availableStudents.length === 0 ? (
                                        <p className="text-xs text-slate-400 py-4 text-center">No more unlinked students</p>
                                    ) : availableStudents.map((s) => (
                                        <label
                                            key={s.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent"
                                        >
                                            <Checkbox checked={false} onCheckedChange={() => toggleStudent(s.id)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</p>
                                                <p className="text-xs text-slate-400">{s.admission_no} · {s.school_class?.name ?? 'No class'}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/school-admin/parents/${parent.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {submitting ? 'Saving...' : 'Update Parent'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
