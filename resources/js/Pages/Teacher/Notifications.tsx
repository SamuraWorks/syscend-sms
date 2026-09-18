import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Bell, BookOpen, FileText, Mail, Megaphone } from 'lucide-react';

interface Props {
    linked: boolean; teacher: { full_name: string };
    upcomingHomework: number; upcomingExams: number;
    unreadMessages: number; recentAnnouncements: number;
}

interface NotificationCardProps {
    icon: React.ReactNode;
    title: string;
    count: number;
    description: string;
    href: string;
    color: string;
}

function NotificationCard({ icon, title, count, description, href, color }: NotificationCardProps) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</h3>
                                {count > 0 && (
                                    <Badge className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">{count}</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">{description}</p>
                            {count > 0 && <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-2">View details →</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function TeacherNotifications({ linked, upcomingHomework, upcomingExams, unreadMessages, recentAnnouncements }: Props) {
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
                    <p className="text-sm text-slate-500 mt-0.5">Stay updated with your teaching activities</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NotificationCard
                        icon={<BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                        title="Upcoming Homework"
                        count={upcomingHomework}
                        description="Homework assignments with approaching deadlines"
                        href="/school/teacher/homework"
                        color="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <NotificationCard
                        icon={<FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                        title="Upcoming Exams"
                        count={upcomingExams}
                        description="Examination schedules coming up soon"
                        href="/school/teacher/exams"
                        color="bg-amber-100 dark:bg-amber-900/30"
                    />
                    <NotificationCard
                        icon={<Mail className="w-6 h-6 text-green-600 dark:text-green-400" />}
                        title="Unread Messages"
                        count={unreadMessages}
                        description="Messages waiting for your attention"
                        href="/school/teacher/messages"
                        color="bg-green-100 dark:bg-green-900/30"
                    />
                    <NotificationCard
                        icon={<Megaphone className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
                        title="Recent Announcements"
                        count={recentAnnouncements}
                        description="Latest school and department announcements"
                        href="/school/teacher/announcements"
                        color="bg-violet-100 dark:bg-violet-900/30"
                    />
                </div>

                {upcomingHomework === 0 && upcomingExams === 0 && unreadMessages === 0 && recentAnnouncements === 0 && (
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
