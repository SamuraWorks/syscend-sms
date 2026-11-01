import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Medal, Star, Sparkles } from 'lucide-react';

interface Props {
    linked: boolean;
    achievements: {
        data: {
            id: number;
            badge: string;
            title: string;
            description: string | null;
            category: string;
            awarded_at: string;
        }[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const categoryGradients: Record<string, string> = {
    gold: 'from-yellow-300 via-yellow-400 to-yellow-500 dark:from-yellow-500 dark:via-yellow-600 dark:to-yellow-700',
    silver: 'from-slate-300 via-slate-400 to-slate-500 dark:from-slate-400 dark:via-slate-500 dark:to-slate-600',
    bronze: 'from-orange-300 via-orange-400 to-orange-500 dark:from-orange-500 dark:via-orange-600 dark:to-orange-700',
    academic: 'from-blue-300 via-blue-400 to-blue-500 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700',
    attendance: 'from-green-300 via-green-400 to-green-500 dark:from-green-500 dark:via-green-600 dark:to-green-700',
    behavior: 'from-purple-300 via-purple-400 to-purple-500 dark:from-purple-500 dark:via-purple-600 dark:to-purple-700',
};

const categoryIcons: Record<string, React.ElementType> = {
    gold: Trophy, silver: Medal, bronze: Medal,
    academic: Award, attendance: Award, behavior: Award,
};

const categoryLabels: Record<string, string> = {
    gold: 'Gold', silver: 'Silver', bronze: 'Bronze',
    academic: 'Academic', attendance: 'Attendance', behavior: 'Behavior',
};

function AchievementCard({ achievement }: { achievement: Props['achievements']['data'][0] }) {
    const gradient = categoryGradients[achievement.category] || 'from-indigo-300 via-indigo-400 to-indigo-500 dark:from-indigo-500 dark:via-indigo-600 dark:to-indigo-700';
    const Icon = categoryIcons[achievement.category] || Award;

    return (
        <Card className="overflow-hidden border-0">
            <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mx-auto mb-3">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-center text-white">{achievement.title}</h3>
                {achievement.description && (
                    <p className="text-xs text-white/80 text-center mt-1 line-clamp-2">{achievement.description}</p>
                )}
            </div>
            <CardContent className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                <Badge className="text-[10px] capitalize bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {categoryLabels[achievement.category] || achievement.category}
                </Badge>
                <span className="text-[10px] text-slate-400">{achievement.awarded_at}</span>
            </CardContent>
        </Card>
    );
}

export default function Achievements({ linked, achievements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Achievements">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Award className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const { data: achievementList, total } = achievements;
    const goldCount = achievementList.filter(a => a.category === 'gold').length;
    const silverCount = achievementList.filter(a => a.category === 'silver').length;
    const bronzeCount = achievementList.filter(a => a.category === 'bronze').length;

    return (
        <AppLayout title="My Achievements">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 p-6 text-white flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Your Achievements</h1>
                        <p className="text-white/80 text-sm mt-1">All your earned badges and recognitions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-500">{goldCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Gold</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-slate-400">{silverCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Silver</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-orange-500">{bronzeCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Bronze</p>
                        </CardContent>
                    </Card>
                </div>

                {total === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No achievements yet</p>
                            <p className="text-xs text-slate-400 mt-1">Keep working hard and you'll earn your first badge soon!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {achievementList.map((achievement) => (
                            <AchievementCard key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
