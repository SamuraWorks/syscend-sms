import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Medal, User, Calendar, Filter, Award, Sparkles } from 'lucide-react';

interface Achievement {
    id: number;
    badge: string;
    title: string;
    description: string | null;
    category: string;
    awarded_at: string;
    student: { id: number; full_name: string };
}

interface Props {
    linked: boolean;
    achievements: {
        data: Achievement[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const categoryColors: Record<string, string> = {
    academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    attendance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    behaviour: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    sports: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    arts: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    leadership: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function getBadgeStyle(badge: string): { bg: string; icon: React.ElementType } {
    const lower = badge.toLowerCase();
    if (lower.includes('gold')) {
        return {
            bg: 'bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600',
            icon: Trophy,
        };
    }
    if (lower.includes('silver')) {
        return {
            bg: 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-400 dark:to-slate-500',
            icon: Medal,
        };
    }
    if (lower.includes('bronze')) {
        return {
            bg: 'bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700',
            icon: Award,
        };
    }
    return {
        bg: 'bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600',
        icon: Star,
    };
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Achievements({ linked, achievements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Achievements">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view achievements.</p>
                </div>
            </AppLayout>
        );
    }

    const goldCount = achievements.data.filter((a) => a.badge.toLowerCase().includes('gold')).length;
    const silverCount = achievements.data.filter((a) => a.badge.toLowerCase().includes('silver')).length;
    const bronzeCount = achievements.data.filter((a) => a.badge.toLowerCase().includes('bronze')).length;

    return (
        <AppLayout title="Achievements">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Student Achievements</h1>
                        <p className="text-white/80 text-sm mt-1">
                            {achievements.total} achievement{achievements.total !== 1 ? 's' : ''} awarded
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{achievements.total}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Awards</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{goldCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Gold</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700">
                                <Medal className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{silverCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Silver</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30">
                                <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{bronzeCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Bronze</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Achievement Grid */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Sparkles className="w-4 h-4 text-amber-500" /> All Achievements ({achievements.data.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.data.map((achievement) => {
                                const badgeStyle = getBadgeStyle(achievement.badge);
                                const BadgeIcon = badgeStyle.icon;
                                return (
                                    <div
                                        key={achievement.id}
                                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 text-white ${badgeStyle.bg}`}>
                                                <BadgeIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{achievement.badge}</p>
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{achievement.title}</p>
                                            </div>
                                        </div>
                                        {achievement.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                                                {achievement.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <Badge className={`text-[10px] ${categoryColors[achievement.category] || ''} capitalize`}>
                                                {achievement.category}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <User className="w-3 h-3" /> {achievement.student.full_name}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <Calendar className="w-3 h-3" /> {formatDate(achievement.awarded_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {achievements.data.length === 0 && (
                            <div className="text-center py-12">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3">
                                    <Trophy className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Achievements</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No achievements have been awarded yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {achievements.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: achievements.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    page === achievements.current_page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
