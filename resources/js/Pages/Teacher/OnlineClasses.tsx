import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink, Calendar, Clock, BookOpen } from 'lucide-react';

interface OnlineClass {
    id: number; title: string; platform: string | null; meeting_url: string | null;
    scheduled_at: string | null; duration_minutes: number | null;
    status: string; class: string | null; subject: string | null;
}
interface Props { linked: boolean; teacher: { full_name: string }; classes: OnlineClass[]; }

const platformColors: Record<string, string> = {
    'Google Meet': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Zoom': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Microsoft Teams': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const statusColors: Record<string, string> = {
    scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function OnlineClasses({ linked, teacher, classes }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Online Classes">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Video className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Please contact the school administrator to link your teacher account.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Online Classes">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Online Classes</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Scheduled virtual classes</p>
                </div>

                {classes.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-slate-400">No online classes scheduled.</CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map(oc => (
                            <Card key={oc.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">{oc.title}</CardTitle>
                                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2', statusColors[oc.status] ?? 'bg-slate-100 text-slate-600')}>
                                            {oc.status.charAt(0).toUpperCase() + oc.status.slice(1)}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {oc.platform && (
                                            <Badge variant="secondary" className={cn('text-xs', platformColors[oc.platform])}>
                                                <Video className="w-3 h-3 mr-1" /> {oc.platform}
                                            </Badge>
                                        )}
                                        {oc.class && (
                                            <Badge variant="outline" className="text-xs">
                                                <BookOpen className="w-3 h-3 mr-1" /> {oc.class}
                                            </Badge>
                                        )}
                                        {oc.subject && (
                                            <Badge variant="outline" className="text-xs">{oc.subject}</Badge>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-500">
                                        {oc.scheduled_at && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(oc.scheduled_at).toLocaleString()}
                                            </div>
                                        )}
                                        {oc.duration_minutes && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {oc.duration_minutes} minutes
                                            </div>
                                        )}
                                    </div>

                                    {oc.meeting_url && (
                                        <Button size="sm" variant="outline" className="w-full gap-1.5" asChild>
                                            <a href={oc.meeting_url} target="_blank" rel="noreferrer">
                                                <ExternalLink className="w-3.5 h-3.5" /> Join Class
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
