import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, AlertTriangle } from 'lucide-react';

interface Publisher {
    name: string;
}

interface CircularData {
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
    circulars: CircularData[];
}

const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-muted-foreground bg-muted',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-amber-600 bg-amber-50',
    urgent: 'text-red-600 bg-red-50',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    published: 'default',
    draft: 'secondary',
    archived: 'outline',
};

export default function MinistryCirculars({ circulars }: Props) {
    return (
        <MinistryLayout title="Circulars">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Mail className="w-6 h-6 text-primary" />
                        Circulars
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Official circulars and directives from the Ministry
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Circulars', value: circulars.length, color: 'text-primary' },
                        { label: 'Published', value: circulars.filter((c) => c.status === 'published').length, color: 'text-emerald-600' },
                        { label: 'High / Urgent', value: circulars.filter((c) => c.priority === 'high' || c.priority === 'urgent').length, color: 'text-red-600' },
                    ].map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {circulars.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Mail className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground">No circulars have been published yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {circulars.map((circular) => (
                            <Card key={circular.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-lg shrink-0 ${circular.priority === 'urgent' || circular.priority === 'high' ? 'text-red-600 bg-red-50' : 'text-primary bg-primary/10'}`}>
                                            {circular.priority === 'urgent' || circular.priority === 'high' ? (
                                                <AlertTriangle className="w-5 h-5" />
                                            ) : (
                                                <Mail className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-serif font-semibold text-foreground">{circular.title}</h3>
                                                <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[circular.priority] ?? ''}`}>
                                                    {circular.priority}
                                                </Badge>
                                                <Badge variant={STATUS_VARIANT[circular.status] ?? 'outline'} className="text-[10px] capitalize">
                                                    {circular.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{circular.content}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {circular.published_at
                                                        ? new Date(circular.published_at).toLocaleDateString('en-SL', {
                                                              year: 'numeric', month: 'long', day: 'numeric',
                                                          })
                                                        : 'Not published'}
                                                </span>
                                                {circular.publisher && (
                                                    <span>Published by {circular.publisher.name}</span>
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
