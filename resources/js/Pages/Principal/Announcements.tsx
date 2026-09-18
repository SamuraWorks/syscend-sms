import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, ChevronRight, Pin } from 'lucide-react';

interface Announcement {
    id: number;
    title: string;
    body: string;
    pinned: boolean;
    audience: string;
    author: string;
    date: string;
    class_id?: number | null;
}
interface Props {
    linked: boolean;
    principal: { full_name: string };
    announcements: Announcement[];
}

export default function Announcements({ linked, announcements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Announcements">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Bell className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const pinned = announcements.filter(a => a.pinned);
    const others = announcements.filter(a => !a.pinned);

    return (
        <AppLayout title="Announcements">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Announcements</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" /> Announcements
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">School announcements and notices</p>
                </div>

                {announcements.length === 0 ? (
                    <Card><CardContent className="py-16 text-center"><Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No announcements yet.</p></CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {pinned.length > 0 && (
                            <div className="space-y-3">
                                {pinned.map(a => (
                                    <Card key={a.id} className="border-amber-200 dark:border-amber-800">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
                                                    <Pin className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</h3>
                                                        <Badge variant="outline" className="text-[10px]">Pinned</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{a.body}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                                                        <span>{a.author}</span>
                                                        <span>·</span>
                                                        <span>{a.audience}</span>
                                                        <span>·</span>
                                                        <span>{a.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {others.length > 0 && (
                            <div className="space-y-3">
                                {others.map(a => (
                                    <Card key={a.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                                                    <Bell className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-1">{a.body}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                                                        <span>{a.author}</span>
                                                        <span>·</span>
                                                        <span>{a.audience}</span>
                                                        <span>·</span>
                                                        <span>{a.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
