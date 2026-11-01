import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    Shield, Plus, User, Calendar, Filter, ExternalLink,
} from 'lucide-react';

interface Intervention {
    id: number;
    title: string;
    type: string;
    priority: string;
    status: string;
    student: { id: number; full_name: string };
    assignee: { id: number; full_name: string } | null;
    start_date: string;
    target_date: string | null;
    created_at: string;
}

interface Props {
    linked: boolean;
    interventions: {
        data: Intervention[];
        current_page: number;
        last_page: number;
        total: number;
    };
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

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Interventions({ linked, interventions }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Interventions">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view interventions.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Interventions">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                            <Shield className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Student Interventions</h1>
                            <p className="text-white/80 text-sm mt-1">
                                {interventions.total} intervention{interventions.total !== 1 ? 's' : ''} tracked
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/performance/interventions/create"
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Intervention
                    </Link>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-3">
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-sm px-3 py-1">
                        <Shield className="w-3.5 h-3.5 mr-1" /> {interventions.total} Total
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm px-3 py-1">
                        <Filter className="w-3.5 h-3.5 mr-1" /> Active: {interventions.data.filter((i) => i.status === 'active').length}
                    </Badge>
                </div>

                {/* Interventions Table - Desktop */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Shield className="w-4 h-4 text-violet-500" /> All Interventions ({interventions.data.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-2 font-medium">Title</th>
                                        <th className="text-left py-2 font-medium">Student</th>
                                        <th className="text-center py-2 font-medium">Type</th>
                                        <th className="text-center py-2 font-medium">Priority</th>
                                        <th className="text-center py-2 font-medium">Status</th>
                                        <th className="text-left py-2 font-medium">Assignee</th>
                                        <th className="text-center py-2 font-medium">Start</th>
                                        <th className="text-center py-2 font-medium">Target</th>
                                        <th className="text-center py-2 font-medium w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interventions.data.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="py-3">
                                                <Link href={`/performance/interventions/${item.id}`} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    {item.title}
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    {item.student.full_name}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 capitalize">
                                                    {item.type}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge className={`text-[10px] ${priorityColors[item.priority] || ''} capitalize`}>
                                                    {item.priority}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-center">
                                                <Badge className={`text-[10px] ${statusColors[item.status] || ''} capitalize`}>
                                                    {item.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {item.assignee?.full_name || <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                                                {formatDate(item.start_date)}
                                            </td>
                                            <td className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                                                {item.target_date ? formatDate(item.target_date) : '—'}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Link href={`/performance/interventions/${item.id}`}>
                                                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-indigo-500 transition-colors" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {interventions.data.map((item) => (
                                <Link key={item.id} href={`/performance/interventions/${item.id}`} className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                                        <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        <User className="w-3 h-3" /> {item.student.full_name}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={`text-[10px] ${priorityColors[item.priority] || ''} capitalize`}>{item.priority}</Badge>
                                        <Badge className={`text-[10px] ${statusColors[item.status] || ''} capitalize`}>{item.status}</Badge>
                                        <Badge className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 capitalize">{item.type}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {interventions.data.length === 0 && (
                            <div className="text-center py-8">
                                <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">No interventions recorded yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {interventions.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: interventions.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    page === interventions.current_page
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
