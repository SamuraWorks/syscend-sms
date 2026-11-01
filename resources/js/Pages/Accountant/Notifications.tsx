import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Bell, Mail, Megaphone } from 'lucide-react';

interface Announcement { id: number; title: string; date: string | null; }
interface Props {
    linked: boolean;
    unreadMessages: number;
    recentAnnouncements: Announcement[];
}

export default function AccountantNotifications({ linked, unreadMessages, recentAnnouncements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Notifications">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Bell className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Notifications">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Stay updated with financial activities</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/school/accountant/messages">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                        <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Unread Messages</h3>
                                            {unreadMessages > 0 && (
                                                <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">{unreadMessages}</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">Messages waiting for your attention</p>
                                        {unreadMessages > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">View details →</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/school/accountant/announcements">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                        <Megaphone className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Recent Announcements</h3>
                                            {recentAnnouncements.length > 0 && (
                                                <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shrink-0">{recentAnnouncements.length}</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">Latest school and department announcements</p>
                                        {recentAnnouncements.length > 0 && <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-2">View details →</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {recentAnnouncements.length > 0 && (
                    <Card>
                        <CardContent className="p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recent Announcements</h3>
                            <div className="space-y-2">
                                {recentAnnouncements.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <Megaphone className="w-4 h-4 text-violet-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                                        </div>
                                        {a.date && <span className="text-xs text-slate-400 shrink-0">{a.date}</span>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {unreadMessages === 0 && recentAnnouncements.length === 0 && (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">All caught up! No pending notifications.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
