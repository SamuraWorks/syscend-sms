import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Link } from '@inertiajs/react';
import {
    Shield, ArrowLeft, User, Calendar, Clock, CheckCircle, MessageSquare,
    Send, FileText, AlertTriangle, Target,
} from 'lucide-react';

interface Note {
    id: number;
    note: string;
    note_type: string;
    visibility: string;
    created_at: string;
    author: { id: number; full_name: string };
}

interface InterventionDetail {
    id: number;
    title: string;
    type: string;
    priority: string;
    status: string;
    description: string;
    recommended_action: string | null;
    start_date: string;
    target_date: string | null;
    completed_at: string | null;
    outcome: string | null;
    student: { id: number; full_name: string };
    assignee: { id: number; full_name: string } | null;
    counsellor: { id: number; full_name: string } | null;
    notes: Note[];
}

interface Props {
    linked: boolean;
    intervention: InterventionDetail;
}

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const noteTypeColors: Record<string, string> = {
    observation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    action: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    concern: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    update: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function InterventionDetail({ linked, intervention }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Intervention Detail">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view intervention details.</p>
                </div>
            </AppLayout>
        );
    }

    const { data, setData, post, processing, errors, reset } = useForm({
        note: '',
        note_type: 'observation',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/performance/interventions/${intervention.id}/notes`, {
            onSuccess: () => reset(),
        });
    };

    const timeline = [...intervention.notes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <AppLayout title={`Intervention: ${intervention.title}`}>
            <div className="space-y-6">
                {/* Back Link */}
                <Link
                    href="/performance/interventions"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Interventions
                </Link>

                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Shield className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold truncate">{intervention.title}</h1>
                        <p className="text-white/80 text-sm mt-1">
                            Student: {intervention.student.full_name} · Type: {intervention.type}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-[10px] ${priorityColors[intervention.priority] || ''} capitalize`}>
                                {intervention.priority} Priority
                            </Badge>
                            <Badge className={`text-[10px] ${statusColors[intervention.status] || ''} capitalize`}>
                                {intervention.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Details Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <FileText className="w-4 h-4 text-violet-500" /> Intervention Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {intervention.description}
                                    </p>
                                </div>
                                {intervention.recommended_action && (
                                    <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1">Recommended Action</p>
                                                <p className="text-sm text-violet-600 dark:text-violet-300">{intervention.recommended_action}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {intervention.outcome && (
                                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Outcome</p>
                                                <p className="text-sm text-green-600 dark:text-green-300">{intervention.outcome}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes Timeline */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <MessageSquare className="w-4 h-4 text-blue-500" /> Notes Timeline ({timeline.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {timeline.map((note) => (
                                        <div key={note.id} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {note.author.full_name}
                                                    </span>
                                                    <Badge className={`text-[10px] ${noteTypeColors[note.note_type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                        {note.note_type}
                                                    </Badge>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {formatDateTime(note.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{note.note}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {timeline.length === 0 && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No notes yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add Note Form */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Send className="w-4 h-4 text-green-500" /> Add Note
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <select
                                            value={data.note_type}
                                            onChange={(e) => setData('note_type', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400"
                                        >
                                            <option value="observation">Observation</option>
                                            <option value="action">Action</option>
                                            <option value="concern">Concern</option>
                                            <option value="update">Update</option>
                                        </select>
                                    </div>
                                    <div>
                                        <textarea
                                            value={data.note}
                                            onChange={(e) => setData('note', e.target.value)}
                                            rows={4}
                                            placeholder="Write a note..."
                                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 dark:focus:border-indigo-400"
                                        />
                                        {errors.note && <p className="text-xs text-red-500 mt-1">{errors.note}</p>}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={processing || !data.note.trim()}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            {processing ? 'Saving...' : 'Add Note'}
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Student</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{intervention.student.full_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Assignee</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{intervention.assignee?.full_name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Counsellor</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{intervention.counsellor?.full_name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Type</span>
                                    <Badge className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 capitalize">
                                        {intervention.type}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Priority</span>
                                    <Badge className={`text-[10px] ${priorityColors[intervention.priority] || ''} capitalize`}>
                                        {intervention.priority}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                                    <Badge className={`text-[10px] ${statusColors[intervention.status] || ''} capitalize`}>
                                        {intervention.status}
                                    </Badge>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" /> Start: {formatDate(intervention.start_date)}
                                    </div>
                                    {intervention.target_date && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <Target className="w-3.5 h-3.5" /> Target: {formatDate(intervention.target_date)}
                                        </div>
                                    )}
                                    {intervention.completed_at && (
                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                            <CheckCircle className="w-3.5 h-3.5" /> Completed: {formatDate(intervention.completed_at)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
