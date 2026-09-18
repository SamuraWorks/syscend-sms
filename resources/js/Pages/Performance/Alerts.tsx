import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { router } from '@inertiajs/react';
import {
    Bell, AlertTriangle, AlertCircle, Info, CheckCircle, User, Clock, Filter,
} from 'lucide-react';

interface AlertItem {
    id: number;
    type: string;
    severity: string;
    title: string;
    message: string;
    is_read: boolean;
    student: { id: number; full_name: string };
    created_at: string;
}

interface Props {
    linked: boolean;
    alerts: {
        data: AlertItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const severityIcons: Record<string, React.ElementType> = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info,
};

const typeColors: Record<string, string> = {
    academic: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    attendance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    behaviour: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    health: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    financial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Alerts({ linked, alerts }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Alerts">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view alerts.</p>
                </div>
            </AppLayout>
        );
    }

    const markAsRead = (id: number) => {
        router.post(`/performance/alerts/${id}/read`);
    };

    const unreadCount = alerts.data.filter((a) => !a.is_read).length;

    return (
        <AppLayout title="Performance Alerts">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Bell className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Performance Alerts</h1>
                        <p className="text-white/80 text-sm mt-1">
                            {alerts.total} total alert{alerts.total !== 1 ? 's' : ''} · {unreadCount} unread
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm px-3 py-1">
                        <Bell className="w-3.5 h-3.5 mr-1" /> {alerts.total} Alert{alerts.total !== 1 ? 's' : ''}
                    </Badge>
                    {unreadCount > 0 && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-sm px-3 py-1">
                            {unreadCount} Unread
                        </Badge>
                    )}
                </div>

                {/* Alert List */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Filter className="w-4 h-4 text-red-500" /> Alert Feed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.data.map((alert) => {
                                const SevIcon = severityIcons[alert.severity] || AlertCircle;
                                return (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-lg border transition-colors ${
                                            alert.is_read
                                                ? 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'
                                                : 'border-orange-200 dark:border-orange-800/40 bg-orange-50/30 dark:bg-orange-900/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                                                    alert.severity === 'critical'
                                                        ? 'bg-red-100 dark:bg-red-900/30'
                                                        : alert.severity === 'warning'
                                                            ? 'bg-orange-100 dark:bg-orange-900/30'
                                                            : 'bg-blue-100 dark:bg-blue-900/30'
                                                }`}>
                                                    <SevIcon className={`w-4 h-4 ${
                                                        alert.severity === 'critical'
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : alert.severity === 'warning'
                                                                ? 'text-orange-600 dark:text-orange-400'
                                                                : 'text-blue-600 dark:text-blue-400'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`text-sm font-semibold ${alert.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                            {alert.title}
                                                        </p>
                                                        <Badge className={`text-[10px] ${severityColors[alert.severity] || ''}`}>
                                                            {alert.severity}
                                                        </Badge>
                                                        {alert.type && (
                                                            <Badge className={`text-[10px] ${typeColors[alert.type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                {alert.type}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                            <User className="w-3 h-3" /> {alert.student.full_name}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                            <Clock className="w-3 h-3" /> {formatDate(alert.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                {!alert.is_read ? (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" title="Unread" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" aria-label="Read" />
                                                )}
                                                {!alert.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(alert.id)}
                                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium whitespace-nowrap"
                                                    >
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {alerts.data.length === 0 && (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No alerts to display.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {alerts.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: alerts.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    page === alerts.current_page
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
