import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';

interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    event: string;
    causer_id: number | null;
    properties: Record<string, unknown>;
    created_at: string;
}

interface Props {
    activityLog: Activity[];
}

const EVENT_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: typeof Plus }> = {
    created: {
        variant: 'default',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Plus,
    },
    updated: {
        variant: 'secondary',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Pencil,
    },
    deleted: {
        variant: 'destructive',
        className: '',
        icon: Trash2,
    },
};

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-SL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatSubject(subjectType: string | null, subjectId: number | null): string {
    if (!subjectType) return '—';
    const model = subjectType.split('\\').pop() ?? subjectType;
    return subjectId ? `${model} #${subjectId}` : model;
}

export default function MinistryAdminAudit({ activityLog }: Props) {
    return (
        <MinistryLayout title="Audit Log">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Audit Log
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track all system activity and changes
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Events', value: activityLog.length, color: 'text-foreground' },
                        { label: 'Created', value: activityLog.filter((a) => a.event === 'created').length, color: 'text-emerald-600' },
                        { label: 'Updated', value: activityLog.filter((a) => a.event === 'updated').length, color: 'text-blue-600' },
                        { label: 'Deleted', value: activityLog.filter((a) => a.event === 'deleted').length, color: 'text-red-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Activity Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date/Time</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Event</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Causer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLog.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No activity recorded yet</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        activityLog.map((activity) => {
                                            const config = EVENT_CONFIG[activity.event] ?? {
                                                variant: 'outline' as const,
                                                className: '',
                                                icon: ShieldCheck,
                                            };
                                            const Icon = config.icon;
                                            return (
                                                <tr key={activity.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                                        {formatDateTime(activity.created_at)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={config.variant} className={`text-xs capitalize ${config.className}`}>
                                                            <Icon className="w-3 h-3 mr-1" />
                                                            {activity.event}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-foreground max-w-xs truncate">
                                                        {activity.description}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {formatSubject(activity.subject_type, activity.subject_id)}
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground">
                                                        {activity.causer_id ? `User #${activity.causer_id}` : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
