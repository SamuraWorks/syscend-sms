import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

interface Announcement {
    id: number; title: string; body: string;
    pinned: boolean; date: string | null; author: string | null;
}
interface Props {
    linked: boolean; announcements: Announcement[];
}

export default function LibrarianAnnouncements({ linked, announcements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Announcements">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Megaphone className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Announcements">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Announcements</h1>
                    <p className="text-sm text-slate-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
                </div>

                {announcements.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No announcements.</CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {announcements.map(a => (
                            <Card key={a.id} className={cn(a.pinned && 'border-amber-300 dark:border-amber-700')}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                            <Megaphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {a.pinned && <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pinned</Badge>}
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.title}</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{a.body}</p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {a.author && <span className="text-xs text-slate-500">{a.author}</span>}
                                                {a.date && <span className="text-xs text-slate-400">{a.date}</span>}
                                            </div>
                                        </div>
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
