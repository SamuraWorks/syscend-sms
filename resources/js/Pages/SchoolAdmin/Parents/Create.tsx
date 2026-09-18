import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, UserPlus, Loader2 } from 'lucide-react';
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

interface Props extends PageProps {
    unlinkedStudents: Student[];
}

export default function CreateParent({ unlinkedStudents = [] }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [studentSearch, setStudentSearch] = useState('');

    const [form, setForm] = useState({
        name: '',
        relation: 'mother',
        phone: '',
        alt_phone: '',
        email: '',
        occupation: '',
        address: '',
        create_account: false,
    });

    const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

    const toggleStudent = (id: number) => {
        setSelectedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
    };

    const filteredStudents = unlinkedStudents.filter((s) =>
        `${s.first_name} ${s.last_name} ${s.admission_no}`.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post('/school-admin/parents', {
            ...form,
            student_ids: selectedIds,
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Parents', href: '/school-admin/parents' },
            { label: 'Add Parent' },
        ]}>
            <Head title="Add Parent" />

            <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/school-admin/parents"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Add Parent</h1>
                        <p className="text-sm text-slate-500">Create a new parent or guardian record</p>
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

                            {form.email && (
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
                            {form.email && (
                                <p className="text-xs text-slate-400">
                                    If a user with this email already exists (e.g. a teacher), the parent role will be added to their existing account.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-base">Link Children</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {unlinkedStudents.length === 0 ? (
                                <p className="text-sm text-slate-400 py-4 text-center">No unlinked students available</p>
                            ) : (
                                <>
                                    <Input
                                        placeholder="Search students by name or admission no..."
                                        className="h-9"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                        {filteredStudents.map((s) => (
                                            <label
                                                key={s.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(s.id) ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                                            >
                                                <Checkbox
                                                    checked={selectedIds.includes(s.id)}
                                                    onCheckedChange={() => toggleStudent(s.id)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.first_name} {s.last_name}</p>
                                                    <p className="text-xs text-slate-400">{s.admission_no} · {s.school_class?.name ?? 'No class'}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedIds.length > 0 && (
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected</p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/school-admin/parents">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {submitting ? 'Saving...' : 'Create Parent'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
