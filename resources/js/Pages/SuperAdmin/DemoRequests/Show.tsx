import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Save, Phone, Mail, MessageSquare, Calendar,
    Building2, Users, Globe, FileText, Clock,
} from 'lucide-react';

interface Note {
    id: number; note: string; type: string;
    created_at: string; user: { name: string };
}
interface History {
    id: number; old_status: string | null; new_status: string;
    notes: string | null; created_at: string; user: { name: string } | null;
}
interface DemoReq {
    id: number; request_id: string; status: string;
    school_name: string; school_type: string; school_level: string;
    district: string; number_of_students: number | null; number_of_teachers: number | null;
    contact_name: string; contact_position: string; contact_email: string;
    contact_phone: string; contact_whatsapp: string | null;
    modules_of_interest: string[]; current_management: string;
    biggest_challenge: string | null; preferred_contact_method: string;
    preferred_day: string | null; preferred_time: string | null;
    created_at: string; assignee: { id: number; name: string } | null;
    notes: Note[]; status_history: History[];
}

interface Props { request: DemoReq; staff: { id: number; name: string }[]; }

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
    demo_scheduled: 'bg-purple-100 text-purple-700', demo_completed: 'bg-indigo-100 text-indigo-700',
    follow_up_required: 'bg-orange-100 text-orange-700', converted: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-700',
};
const STATUSES = [
    { value: 'new', label: 'New' }, { value: 'contacted', label: 'Contacted' },
    { value: 'demo_scheduled', label: 'Demo Scheduled' }, { value: 'demo_completed', label: 'Demo Completed' },
    { value: 'follow_up_required', label: 'Follow-up Required' }, { value: 'converted', label: 'Converted to Customer' },
    { value: 'closed', label: 'Closed' },
];
const NOTE_TYPES = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'internal', label: 'Internal Note', icon: FileText },
    { value: 'follow_up', label: 'Follow-up', icon: Clock },
];

export default function DemoRequestShow({ request: r, staff }: Props) {
    const statusForm = useForm({ status: r.status, notes: '' });
    const assignForm = useForm({ assigned_to: r.assignee?.id ? String(r.assignee.id) : '' });
    const noteForm = useForm({ note: '', type: 'internal' });

    function updateStatus(e: React.FormEvent) {
        e.preventDefault();
        statusForm.put(`/super-admin/demo-requests/${r.id}/status`, { preserveScroll: true });
    }
    function assign(e: React.FormEvent) {
        e.preventDefault();
        assignForm.post(`/super-admin/demo-requests/${r.id}/assign`, { preserveScroll: true });
    }
    function addNote(e: React.FormEvent) {
        e.preventDefault();
        noteForm.post(`/super-admin/demo-requests/${r.id}/notes`, { preserveScroll: true, onSuccess: () => noteForm.reset('note') });
    }

    return (
        <AppLayout title={`Demo Request — ${r.request_id}`}>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/super-admin/demo-requests" className="p-2 hover:bg-accent rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold">{r.school_name}</h1>
                            <Badge className={STATUS_COLORS[r.status]}>{r.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{r.request_id} · Created {new Date(r.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 order-2 lg:col-span-2">
                        {/* School Info */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">School Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{r.school_type}</span></div>
                                <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{r.school_level}</span></div>
                                <div><span className="text-muted-foreground">District:</span> <span className="font-medium">{r.district}</span></div>
                                <div><span className="text-muted-foreground">Students:</span> <span className="font-medium">{r.number_of_students ?? 'N/A'}</span></div>
                                <div><span className="text-muted-foreground">Teachers:</span> <span className="font-medium">{r.number_of_teachers ?? 'N/A'}</span></div>
                                <div><span className="text-muted-foreground">Current System:</span> <span className="font-medium">{r.current_management}</span></div>
                            </CardContent>
                        </Card>

                        {/* Contact */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{r.contact_name}</span></p>
                                <p><span className="text-muted-foreground">Position:</span> <span className="font-medium">{r.contact_position}</span></p>
                                <div className="flex gap-4">
                                    <a href={`mailto:${r.contact_email}`} className="text-primary hover:underline">{r.contact_email}</a>
                                    <a href={`tel:${r.contact_phone}`} className="text-primary hover:underline">{r.contact_phone}</a>
                                    {r.contact_whatsapp && <span className="text-muted-foreground">WhatsApp: {r.contact_whatsapp}</span>}
                                </div>
                                <p><span className="text-muted-foreground">Preferred contact:</span> <span className="font-medium">{r.preferred_contact_method}</span></p>
                                {r.preferred_day && <p><span className="text-muted-foreground">Preferred time:</span> <span className="font-medium">{r.preferred_day} {r.preferred_time ?? ''}</span></p>}
                            </CardContent>
                        </Card>

                        {/* Modules */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Modules of Interest</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {r.modules_of_interest.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                                </div>
                                {r.biggest_challenge && (
                                    <div className="mt-4 p-3 rounded-lg bg-accent text-sm">
                                        <p className="font-medium mb-1">Biggest Challenge:</p>
                                        <p className="text-muted-foreground">{r.biggest_challenge}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Notes & Activity</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={addNote} className="space-y-3">
                                    <div className="flex gap-2">
                                        <Select value={noteForm.data.type} onValueChange={v => noteForm.setData('type', v)}>
                                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                            <SelectContent>{NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Input className="flex-1" placeholder="Add a note..." value={noteForm.data.note} onChange={e => noteForm.setData('note', e.target.value)} />
                                        <Button type="submit" size="sm" disabled={!noteForm.data.note}>Add</Button>
                                    </div>
                                </form>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {[...r.notes].reverse().map(n => (
                                        <div key={n.id} className="flex gap-3 text-sm">
                                            <Badge variant="outline" className="shrink-0 mt-0.5">{n.type}</Badge>
                                            <div>
                                                <p>{n.note}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{n.user.name} · {new Date(n.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {r.notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6 order-1 lg:order-3">
                        {/* Status */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Update Status</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={updateStatus} className="space-y-3">
                                    <Select value={statusForm.data.status} onValueChange={v => statusForm.setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Textarea rows={2} placeholder="Optional note..." value={statusForm.data.notes} onChange={e => statusForm.setData('notes', e.target.value)} />
                                    <Button type="submit" disabled={statusForm.processing} className="w-full gap-2"><Save className="w-4 h-4" /> Update</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Assign */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Assign To</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={assign} className="space-y-3">
                                    <Select value={assignForm.data.assigned_to} onValueChange={v => assignForm.setData('assigned_to', v)}>
                                        <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                                        <SelectContent>
                                            {staff.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit" variant="outline" className="w-full" disabled={assignForm.processing}>Assign</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* History */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[...r.status_history].reverse().map(h => (
                                        <div key={h.id} className="text-sm border-l-2 border-primary/30 pl-3">
                                            <p className="font-medium">{h.new_status.replace(/_/g, ' ')}</p>
                                            {h.old_status && <p className="text-xs text-muted-foreground">from: {h.old_status}</p>}
                                            {h.notes && <p className="text-xs text-muted-foreground mt-0.5">{h.notes}</p>}
                                            <p className="text-xs text-muted-foreground mt-0.5">{h.user?.name ?? 'System'} · {new Date(h.created_at).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
