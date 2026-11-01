import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    BookCheck, Plus, User, Clock, Filter, Shield, AlertTriangle, CheckCircle,
} from 'lucide-react';

interface Behaviour {
    id: number;
    category: string;
    type: string;
    description: string;
    severity: string;
    action_taken: string | null;
    occurred_at: string;
    parent_notified: boolean;
    student: { id: number; full_name: string };
}

interface Props {
    linked: boolean;
    behaviours: {
        data: Behaviour[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const categoryColors: Record<string, string> = {
    positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    social: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    disciplinary: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const severityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function getCategoryCardStyle(category: string): string {
    if (category === 'positive') return 'border-green-200 dark:border-green-800/40 bg-green-50/30 dark:bg-green-900/5';
    if (category === 'negative') return 'border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5';
    return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50';
}

function getCategoryIcon(category: string): React.ElementType {
    if (category === 'positive') return CheckCircle;
    if (category === 'negative') return AlertTriangle;
    return Shield;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Behaviours({ linked, behaviours }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Behaviour Records">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view behaviour records.</p>
                </div>
            </AppLayout>
        );
    }

    const positiveCount = behaviours.data.filter((b) => b.category === 'positive').length;
    const negativeCount = behaviours.data.filter((b) => b.category === 'negative').length;

    return (
        <AppLayout title="Behaviour Records">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                            <BookCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Behaviour Records</h1>
                            <p className="text-white/80 text-sm mt-1">
                                {behaviours.total} record{behaviours.total !== 1 ? 's' : ''} · {positiveCount} positive · {negativeCount} negative
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/performance/behaviours/create"
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Record
                    </Link>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <BookCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{behaviours.total}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Records</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{positiveCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Positive</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">{negativeCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Negative</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800">
                                <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{behaviours.data.filter((b) => b.parent_notified).length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Parents Notified</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Behaviour Cards */}
                <div className="space-y-3">
                    {behaviours.data.map((record) => {
                        const CatIcon = getCategoryIcon(record.category);
                        return (
                            <Card key={record.id} className={getCategoryCardStyle(record.category)}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${
                                                record.category === 'positive'
                                                    ? 'bg-green-100 dark:bg-green-900/30'
                                                    : record.category === 'negative'
                                                        ? 'bg-red-100 dark:bg-red-900/30'
                                                        : 'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                                <CatIcon className={`w-4.5 h-4.5 ${
                                                    record.category === 'positive'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : record.category === 'negative'
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-slate-600 dark:text-slate-400'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {record.type}
                                                    </p>
                                                    <Badge className={`text-[10px] ${categoryColors[record.category] || ''} capitalize`}>
                                                        {record.category}
                                                    </Badge>
                                                    <Badge className={`text-[10px] ${severityColors[record.severity] || ''} capitalize`}>
                                                        {record.severity}
                                                    </Badge>
                                                    {record.parent_notified && (
                                                        <Badge className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                            Parent Notified
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                                    {record.description}
                                                </p>
                                                {record.action_taken && (
                                                    <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Action Taken</p>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300">{record.action_taken}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <User className="w-3 h-3" /> {record.student.full_name}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <Clock className="w-3 h-3" /> {formatDate(record.occurred_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {behaviours.data.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3">
                                    <BookCheck className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Records</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No behaviour records have been added yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination */}
                {behaviours.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: behaviours.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    page === behaviours.current_page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
