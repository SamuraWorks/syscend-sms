import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, AlertTriangle } from 'lucide-react';

interface Publisher {
    name: string;
}

interface AlertData {
    id: number;
    title: string;
    content: string;
    type: string;
    priority: string;
    published_at: string;
    status: string;
    publisher: Publisher | null;
}

interface Props {
    alerts: AlertData[];
}

export default function MinistryAlerts({ alerts }: Props) {
    return (
        <MinistryLayout title="Emergency Alerts">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Bell className="w-6 h-6 text-red-600" />
                        Emergency Alerts
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        High-priority alerts requiring immediate attention
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Alerts', value: alerts.length, color: 'text-red-600' },
                        { label: 'Published', value: alerts.filter((a) => a.status === 'published').length, color: 'text-emerald-600' },
                        { label: 'Urgent', value: alerts.filter((a) => a.priority === 'urgent').length, color: 'text-red-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {alerts.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground">No emergency alerts at this time</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <Card key={alert.id} className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 rounded-lg shrink-0 text-red-600 bg-red-50">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-serif font-semibold text-foreground">{alert.title}</h3>
                                                <Badge variant="destructive" className="text-[10px]">
                                                    {alert.priority}
                                                </Badge>
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {alert.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{alert.content}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {alert.published_at
                                                        ? new Date(alert.published_at).toLocaleDateString('en-SL', {
                                                              year: 'numeric', month: 'long', day: 'numeric',
                                                          })
                                                        : 'Not published'}
                                                </span>
                                                {alert.publisher && (
                                                    <span>By {alert.publisher.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MinistryLayout>
    );
}
