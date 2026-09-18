import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Pin } from 'lucide-react';

interface Ann { id: number; title: string; body: string; pinned: boolean; date: string | null; }
interface Props { linked: boolean; guardian: { name: string } | null; announcements: Ann[]; }

export default function ParentAnnouncements({ linked, announcements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Announcements">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Megaphone className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Link your account to a school to view announcements.</p>
                </div>
            </AppLayout>
        );
    }

    const pinned = announcements.filter(a => a.pinned);
    const rest = announcements.filter(a => !a.pinned);

    return (
        <AppLayout title="Announcements">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">School Announcements</h1>
                        <p className="text-sm text-slate-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No announcements yet.</p>
                            <p className="text-slate-400 text-xs mt-1">School announcements will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {pinned.map(a => (
                            <Card key={a.id} className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded">Pinned</span>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{a.title}</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a.body}</p>
                                            {a.date && <p className="text-xs text-slate-400 mt-2">{a.date}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {rest.map(a => (
                            <Card key={a.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Megaphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{a.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{a.body}</p>
                                            {a.date && <p className="text-xs text-slate-400 mt-2">{a.date}</p>}
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
