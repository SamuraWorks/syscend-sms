import AppLayout from '@/Layouts/AppLayout';
import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
    Clock, Calendar, Settings, Plus, Trash2, Pencil, Copy, CheckCircle, Save,
} from 'lucide-react';

interface Props {
    settings: {
        id: number;
        opening_time: string;
        closing_time: string;
        working_days: string;
        timezone: string | null;
        clock_format: '12h' | '24h';
        day_start: string;
        day_end: string;
    } | null;
    eventTypes: Array<{
        id: number;
        name: string;
        slug: string;
        color: string | null;
        icon: string | null;
        is_instructional: boolean;
        attendance_required: boolean;
        is_active: boolean;
        sort_order: number;
    }>;
    periods: Array<{
        id: number;
        name: string;
        event_type_id: number | null;
        period_number: number | null;
        start_time: string;
        end_time: string;
        duration_minutes: number | null;
        is_break: boolean;
        is_active: boolean;
        sort_order: number;
        event_type?: { name: string; color: string | null } | null;
    }>;
    academicYear: { id: number; name: string } | null;
    allYears: Array<{ id: number; name: string; is_current: boolean }>;
}

const WORKING_DAYS = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
];

const TIMEZONES = [
    'UTC', 'Africa/Freetown', 'Africa/Accra', 'Africa/Lagos',
    'Europe/London', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Africa/Nairobi', 'Africa/Cairo', 'Australia/Sydney',
];

const EVENT_COLORS = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Lime' },
    { value: '#f97316', label: 'Orange' },
];

function SuccessBanner({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {message}
        </div>
    );
}

function parseWorkingDays(workingDays: string): string[] {
    if (!workingDays) return ['mon', 'tue', 'wed', 'thu', 'fri'];
    return workingDays.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
}

function formatDuration(minutes: number | null): string {
    if (minutes == null) return '—';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/* ── School Hours Tab ── */
function SchoolHoursTab({ settings, academicYear, allYears }: Pick<Props, 'settings' | 'academicYear' | 'allYears'>) {
    const days = parseWorkingDays(settings?.working_days ?? '');
    const form = useForm({
        opening_time: settings?.opening_time ?? '08:00',
        closing_time: settings?.closing_time ?? '16:00',
        working_days: days,
        timezone: settings?.timezone ?? 'UTC',
        clock_format: (settings?.clock_format ?? '12h') as '12h' | '24h',
        day_start: settings?.day_start ?? '08:00',
        day_end: settings?.day_end ?? '16:00',
        academic_year_id: academicYear?.id?.toString() ?? '',
    });
    const { flash } = usePage<any>().props;

    function toggleDay(day: string) {
        const current = form.data.working_days;
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day];
        form.setData('working_days', updated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        // Backend expects a comma-separated string, the UI works with an array.
        form.transform((data) => ({
            ...data,
            working_days: data.working_days.join(','),
        }));
        form.post('/school/settings/school-time');
    }

    return (
        <form onSubmit={submit}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="w-4 h-4" /> School Operating Hours
                    </CardTitle>
                    <CardDescription>Configure daily school hours, working days, and display preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {flash?.success && <SuccessBanner message={flash.success} />}

                    <div>
                        <Label>Academic Year</Label>
                        <Select
                            value={form.data.academic_year_id}
                            onValueChange={v => form.setData('academic_year_id', v)}
                        >
                            <SelectTrigger className="w-full sm:w-72">
                                <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                            <SelectContent>
                                {allYears.map(y => (
                                    <SelectItem key={y.id} value={y.id.toString()}>
                                        {y.name} {y.is_current ? '(Current)' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Opening Time</Label>
                            <Input
                                type="time"
                                value={form.data.opening_time}
                                onChange={e => form.setData('opening_time', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Closing Time</Label>
                            <Input
                                type="time"
                                value={form.data.closing_time}
                                onChange={e => form.setData('closing_time', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="block mb-2">Working Days</Label>
                        <div className="flex flex-wrap gap-3">
                            {WORKING_DAYS.map(day => (
                                <label
                                    key={day.value}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors',
                                        form.data.working_days.includes(day.value)
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                                    )}
                                >
                                    <Checkbox
                                        checked={form.data.working_days.includes(day.value)}
                                        onCheckedChange={() => toggleDay(day.value)}
                                    />
                                    {day.label}
                                </label>
                            ))}
                        </div>
                        {form.errors.working_days && (
                            <p className="text-xs text-red-500 mt-1">{form.errors.working_days}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Timezone</Label>
                            <Select
                                value={form.data.timezone}
                                onValueChange={v => form.setData('timezone', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIMEZONES.map(tz => (
                                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Clock Format</Label>
                            <div className="flex items-center gap-4 mt-1.5">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="clock_format"
                                        value="12h"
                                        checked={form.data.clock_format === '12h'}
                                        onChange={() => form.setData('clock_format', '12h')}
                                        className="accent-indigo-600"
                                    />
                                    12-hour
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name="clock_format"
                                        value="24h"
                                        checked={form.data.clock_format === '24h'}
                                        onChange={() => form.setData('clock_format', '24h')}
                                        className="accent-indigo-600"
                                    />
                                    24-hour
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Day Period Boundaries</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Day Start</Label>
                                <Input
                                    type="time"
                                    value={form.data.day_start}
                                    onChange={e => form.setData('day_start', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Day End</Label>
                                <Input
                                    type="time"
                                    value={form.data.day_end}
                                    onChange={e => form.setData('day_end', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing} className="gap-2">
                            <Save className="w-4 h-4" /> Save School Hours
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/* ── Event Types Tab ── */
function EventTypesTab({ eventTypes }: Pick<Props, 'eventTypes'>) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const { flash } = usePage<any>().props;

    const form = useForm({
        name: '',
        color: '#6366f1',
        is_instructional: true,
        attendance_required: false,
    });

    function resetForm() {
        form.reset();
        setShowForm(false);
        setEditingId(null);
    }

    function openEdit(et: typeof eventTypes[number]) {
        form.setData({
            name: et.name,
            color: et.color ?? '#6366f1',
            is_instructional: et.is_instructional,
            attendance_required: et.attendance_required,
        });
        setEditingId(et.id);
        setShowForm(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editingId) {
            form.put(`/school/settings/school-time/event-types/${editingId}`, {
                onSuccess: () => resetForm(),
            });
        } else {
            form.post('/school/settings/school-time/event-types', {
                onSuccess: () => resetForm(),
            });
        }
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this event type?')) return;
        router.delete(`/school/settings/school-time/event-types/${id}`);
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Schedule Event Types
                        </CardTitle>
                        <CardDescription>Define types of events that can appear on the daily schedule.</CardDescription>
                    </div>
                    {!showForm && (
                        <Button size="sm" className="gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
                            <Plus className="w-3.5 h-3.5" /> Add Event Type
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {flash?.success && <SuccessBanner message={flash.success} />}

                    {showForm && (
                        <form onSubmit={submit} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {editingId ? 'Edit Event Type' : 'New Event Type'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={e => form.setData('name', e.target.value)}
                                        placeholder="e.g. Class Period, Assembly, Lunch"
                                    />
                                    {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                                </div>
                                <div>
                                    <Label>Color</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={form.data.color}
                                            onChange={e => form.setData('color', e.target.value)}
                                            className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5"
                                        />
                                        <Select value={form.data.color} onValueChange={v => form.setData('color', v)}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EVENT_COLORS.map(c => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                                                            {c.label}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex items-end gap-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={form.data.is_instructional}
                                            onCheckedChange={v => form.setData('is_instructional', !!v)}
                                        />
                                        Instructional
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={form.data.attendance_required}
                                            onCheckedChange={v => form.setData('attendance_required', !!v)}
                                        />
                                        Attendance Required
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={form.processing} className="gap-2">
                                    <Save className="w-3.5 h-3.5" /> {editingId ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {eventTypes.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No event types configured yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">Name</th>
                                        <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">Color</th>
                                        <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">Instructional</th>
                                        <th className="text-left font-medium text-slate-500 dark:text-slate-400 pb-2 pr-4">Attendance</th>
                                        <th className="text-right font-medium text-slate-500 dark:text-slate-400 pb-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventTypes.map(et => (
                                        <tr key={et.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-300">{et.name}</td>
                                            <td className="py-2.5 pr-4">
                                                <span className="inline-block w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700"
                                                    style={{ backgroundColor: et.color ?? '#6b7280' }} />
                                            </td>
                                            <td className="py-2.5 pr-4">
                                                <Badge variant={et.is_instructional ? 'default' : 'secondary'}>
                                                    {et.is_instructional ? 'Yes' : 'No'}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 pr-4">
                                                <Badge variant={et.attendance_required ? 'default' : 'secondary'}>
                                                    {et.attendance_required ? 'Required' : 'Optional'}
                                                </Badge>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(et)}>
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(et.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ── Periods Tab ── */
function PeriodsTab({ periods, eventTypes, allYears, academicYear }: Pick<Props, 'periods' | 'eventTypes' | 'allYears' | 'academicYear'>) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [copyYearId, setCopyYearId] = useState<string>('');
    const { flash } = usePage<any>().props;

    const form = useForm({
        name: '',
        event_type_id: '',
        start_time: '08:00',
        end_time: '08:45',
        is_break: false,
    });

    function resetForm() {
        form.reset();
        setShowForm(false);
        setEditingId(null);
    }

    function openEdit(p: typeof periods[number]) {
        form.setData({
            name: p.name,
            event_type_id: p.event_type_id != null ? p.event_type_id.toString() : '__none__',
            start_time: p.start_time,
            end_time: p.end_time,
            is_break: p.is_break,
        });
        setEditingId(p.id);
        setShowForm(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...form.data,
            event_type_id: form.data.event_type_id === '__none__' || form.data.event_type_id === '' ? null : Number(form.data.event_type_id),
        };
        if (editingId) {
            router.put(`/school/settings/school-time/periods/${editingId}`, payload, {
                onSuccess: () => resetForm(),
            });
        } else {
            router.post('/school/settings/school-time/periods', payload, {
                onSuccess: () => resetForm(),
            });
        }
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this period?')) return;
        router.delete(`/school/settings/school-time/periods/${id}`);
    }

    function handleCopySchedule() {
        if (!copyYearId || !confirm('Copy current schedule to the selected year?')) return;
        router.post('/school/settings/school-time/copy', {
            target_academic_year_id: Number(copyYearId),
        });
    }

    const sorted = [...periods].sort((a, b) => {
        if (a.period_number != null && b.period_number != null) return a.period_number - b.period_number;
        return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Daily Schedule Periods
                        </CardTitle>
                        <CardDescription>Define the periods within each school day.</CardDescription>
                    </div>
                    {!showForm && (
                        <Button size="sm" className="gap-2" onClick={() => { resetForm(); setShowForm(true); }}>
                            <Plus className="w-3.5 h-3.5" /> Add Period
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {flash?.success && <SuccessBanner message={flash.success} />}
                    {flash?.error && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                            {flash.error}
                        </div>
                    )}

                    {showForm && (
                        <form onSubmit={submit} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {editingId ? 'Edit Period' : 'New Period'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Period Name</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={e => form.setData('name', e.target.value)}
                                        placeholder="e.g. Period 1, Morning Assembly"
                                    />
                                    {form.errors.name && <p className="text-xs text-red-500 mt-1">{form.errors.name}</p>}
                                </div>
                                <div>
                                    <Label>Event Type</Label>
                                    <Select value={form.data.event_type_id} onValueChange={v => form.setData('event_type_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">None</SelectItem>
                                            {eventTypes.map(et => (
                                                <SelectItem key={et.id} value={et.id.toString()}>
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: et.color ?? '#6b7280' }} />
                                                        {et.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={form.data.start_time}
                                        onChange={e => form.setData('start_time', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={form.data.end_time}
                                        onChange={e => form.setData('end_time', e.target.value)}
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                    checked={form.data.is_break}
                                    onCheckedChange={v => form.setData('is_break', !!v)}
                                />
                                This is a break period
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={form.processing} className="gap-2">
                                    <Save className="w-3.5 h-3.5" /> {editingId ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {sorted.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No periods configured yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {sorted.map((p, idx) => {
                                const evColor = p.event_type?.color ?? '#6b7280';
                                const duration = p.duration_minutes
                                    ?? (timeToMinutes(p.end_time) - timeToMinutes(p.start_time));
                                return (
                                    <div
                                        key={p.id}
                                        className={cn(
                                            'flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors',
                                            p.is_break
                                                ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                                                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                        )}
                                    >
                                        <div
                                            className="w-1.5 self-stretch rounded-full shrink-0"
                                            style={{ backgroundColor: p.is_break ? '#f59e0b' : evColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                                    {idx + 1}. {p.name}
                                                </span>
                                                {p.event_type && (
                                                    <Badge variant="outline" className="gap-1" style={{ borderColor: evColor + '60', color: evColor }}>
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: evColor }} />
                                                        {p.event_type.name}
                                                    </Badge>
                                                )}
                                                {p.is_break && (
                                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                        Break
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {p.start_time} → {p.end_time} &middot; {formatDuration(duration)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(p)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(p.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {sorted.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> Copy Schedule to Another Year
                            </h3>
                            <div className="flex items-end gap-3">
                                <div className="flex-1 max-w-xs">
                                    <Label>Target Academic Year</Label>
                                    <Select value={copyYearId} onValueChange={setCopyYearId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allYears
                                                .filter(y => y.id !== academicYear?.id)
                                                .map(y => (
                                                    <SelectItem key={y.id} value={y.id.toString()}>
                                                        {y.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    disabled={!copyYearId}
                                    onClick={handleCopySchedule}
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy Schedule
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ── Main Page ── */
export default function SchoolTimeSettings({ settings, eventTypes, periods, academicYear, allYears }: Props) {
    return (
        <AppLayout title="School Time Settings">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Time Settings</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Configure school hours, event types, and daily schedule periods</p>
                </div>

                <Tabs defaultValue="hours">
                    <TabsList variant="line" className="w-full justify-start border-b border-slate-200 dark:border-slate-700 rounded-none px-1">
                        <TabsTrigger value="hours" className="gap-2 data-active:border-b-2 data-active:border-indigo-600 data-active:text-indigo-600 dark:data-active:border-indigo-400 dark:data-active:text-indigo-400 rounded-none">
                            <Clock className="w-4 h-4" /> School Hours
                        </TabsTrigger>
                        <TabsTrigger value="event-types" className="gap-2 data-active:border-b-2 data-active:border-indigo-600 data-active:text-indigo-600 dark:data-active:border-indigo-400 dark:data-active:text-indigo-400 rounded-none">
                            <Calendar className="w-4 h-4" /> Event Types
                        </TabsTrigger>
                        <TabsTrigger value="periods" className="gap-2 data-active:border-b-2 data-active:border-indigo-600 data-active:text-indigo-600 dark:data-active:border-indigo-400 dark:data-active:text-indigo-400 rounded-none">
                            <Settings className="w-4 h-4" /> Periods
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="hours">
                        <SchoolHoursTab settings={settings} academicYear={academicYear} allYears={allYears} />
                    </TabsContent>
                    <TabsContent value="event-types">
                        <EventTypesTab eventTypes={eventTypes} />
                    </TabsContent>
                    <TabsContent value="periods">
                        <PeriodsTab periods={periods} eventTypes={eventTypes} allYears={allYears} academicYear={academicYear} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
