import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp, Calendar, BookOpen } from 'lucide-react';

interface Plan {
    id: number; title: string; objectives: string | null; content: string | null;
    class: string | null; subject: string | null; week_start: string | null;
    status: string;
}
interface ClassRow { id: number; name: string; }
interface Subject { id: number; name: string; class_id: number; }
interface Props {
    linked: boolean; teacher: { full_name: string };
    plans: Plan[]; classes: ClassRow[]; subjects: Subject[];
}

export default function LessonPlans({ linked, teacher, plans, classes, subjects }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '', class_id: '', subject_id: '', objectives: '', content: '', week_start: '',
    });

    if (!linked) {
        return (
            <AppLayout title="Lesson Plans">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Please contact the school administrator to link your teacher account.</p>
                </div>
            </AppLayout>
        );
    }

    const filteredSubjects = selectedClassId
        ? subjects.filter(s => s.class_id === selectedClassId)
        : [];

    function handleClassChange(value: string) {
        setData('class_id', value);
        setData('subject_id', '');
        setSelectedClassId(value ? Number(value) : null);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/school/teacher/lesson-plans/store', {
            onSuccess: () => { reset(); setFormOpen(false); setSelectedClassId(null); },
        });
    }

    function statusVariant(status: string): 'default' | 'secondary' | 'destructive' {
        if (status === 'completed') return 'default';
        if (status === 'rejected') return 'destructive';
        return 'secondary';
    }

    function statusColor(status: string) {
        if (status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (status === 'pending' || status === 'draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }

    return (
        <AppLayout title="Lesson Plans">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lesson Plans</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage weekly lesson plans</p>
                    </div>
                    <Button onClick={() => { setFormOpen(!formOpen); }} className="gap-2">
                        {formOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {formOpen ? 'Close' : 'New Plan'}
                    </Button>
                </div>

                {formOpen && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Lesson Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Title *</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={e => setData('title', e.target.value)}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                            placeholder="e.g. Introduction to Algebra"
                                        />
                                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Class *</label>
                                        <select
                                            value={data.class_id}
                                            onChange={e => handleClassChange(e.target.value)}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="">Select class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Subject *</label>
                                        <select
                                            value={data.subject_id}
                                            onChange={e => setData('subject_id', e.target.value)}
                                            disabled={!selectedClassId}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="">{selectedClassId ? 'Select subject' : 'Select class first'}</option>
                                            {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Week Start *</label>
                                        <input
                                            type="date"
                                            value={data.week_start}
                                            onChange={e => setData('week_start', e.target.value)}
                                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        />
                                        {errors.week_start && <p className="text-xs text-red-500 mt-1">{errors.week_start}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Objectives</label>
                                    <textarea
                                        value={data.objectives}
                                        onChange={e => setData('objectives', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        placeholder="Learning objectives..."
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Content</label>
                                    <textarea
                                        value={data.content}
                                        onChange={e => setData('content', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                        placeholder="Lesson content..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => { reset(); setFormOpen(false); setSelectedClassId(null); }}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>Create Plan</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {plans.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-slate-400">No lesson plans yet.</CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map(plan => (
                            <Card key={plan.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">{plan.title}</CardTitle>
                                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2', statusColor(plan.status))}>
                                            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {plan.class && (
                                            <Badge variant="secondary" className="text-xs">
                                                <BookOpen className="w-3 h-3 mr-1" /> {plan.class}
                                            </Badge>
                                        )}
                                        {plan.subject && (
                                            <Badge variant="outline" className="text-xs">{plan.subject}</Badge>
                                        )}
                                    </div>
                                    {plan.objectives && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{plan.objectives}</p>
                                    )}
                                    {plan.content && (
                                        <p className="text-xs text-slate-500 line-clamp-2">{plan.content}</p>
                                    )}
                                    <div className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                                        <Calendar className="w-3 h-3" />
                                        {plan.week_start ? `Week of ${new Date(plan.week_start).toLocaleDateString()}` : 'No date set'}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
