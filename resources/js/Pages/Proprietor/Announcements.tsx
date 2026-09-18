import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin, Calendar, User, ChevronRight } from 'lucide-react';

interface Announcement { id: number; title: string; body: string; pinned: boolean; date: string | null; author: string | null; }
interface Props { linked: boolean; announcements: Announcement[]; }

export default function ProprietorAnnouncements({ linked, announcements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Announcements">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Megaphone className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
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
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Announcements</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-500" /> Announcements
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
                </div>

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-slate-400">
                            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>No announcements yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {pinned.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <Pin className="w-3 h-3" /> Pinned
                                </h2>
                                {pinned.map(a => (
                                    <Card key={a.id} className="border-l-4 border-l-amber-400">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                                                <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">Pinned</Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{a.body}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                {a.author && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.author}</span>}
                                                {a.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date}</span>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {others.length > 0 && (
                            <div className="space-y-3">
                                {pinned.length > 0 && <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">All Announcements</h2>}
                                {others.map(a => (
                                    <Card key={a.id}>
                                        <CardContent className="p-5">
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{a.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{a.body}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400">
                                                {a.author && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.author}</span>}
                                                {a.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date}</span>}
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
