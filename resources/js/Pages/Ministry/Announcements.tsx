import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Bell, AlertTriangle, Clock } from 'lucide-react';

interface AnnouncementData {
    id: number;
    title: string;
    content: string;
    type: string;
    priority: string;
    published_at: string;
    status: string;
}

interface Props {
    announcements: AnnouncementData[];
}

const TYPE_ICONS: Record<string, typeof Megaphone> = {
    announcement: Megaphone,
    circular: Bell,
    policy_update: Bell,
    emergency: AlertTriangle,
    alert: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
    announcement: 'text-blue-600 bg-blue-50',
    circular: 'text-primary bg-primary/10',
    policy_update: 'text-violet-600 bg-violet-50',
    emergency: 'text-red-600 bg-red-50',
    alert: 'text-amber-600 bg-amber-50',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-muted-foreground bg-muted',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-amber-600 bg-amber-50',
    urgent: 'text-red-600 bg-red-50',
};

export default function MinistryAnnouncements({ announcements }: Props) {
    return (
        <MinistryLayout title="Ministry Announcements">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-primary" />
                        Announcements & Circulars
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ministry of Education communications and policy updates
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Published', value: announcements.filter((a) => a.status === 'published').length, color: 'text-primary' },
                        { label: 'Urgent / High Priority', value: announcements.filter((a) => a.priority === 'urgent' || a.priority === 'high').length, color: 'text-red-600' },
                        { label: 'Emergency Alerts', value: announcements.filter((a) => a.type === 'emergency' || a.type === 'alert').length, color: 'text-amber-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Megaphone className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground">No announcements published yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((ann) => {
                            const Icon = TYPE_ICONS[ann.type] ?? Megaphone;
                            return (
                                <Card key={ann.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2.5 rounded-lg shrink-0 ${TYPE_COLORS[ann.type] ?? 'text-muted-foreground bg-muted'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="font-serif font-semibold text-foreground">{ann.title}</h3>
                                                    <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[ann.priority] ?? ''}`}>
                                                        {ann.priority}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] capitalize">
                                                        {ann.type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ann.content}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {ann.published_at
                                                            ? new Date(ann.published_at).toLocaleDateString('en-SL', {
                                                                  year: 'numeric', month: 'long', day: 'numeric',
                                                              })
                                                            : 'Not published'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </MinistryLayout>
    );
}
