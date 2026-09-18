import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowUp, ArrowDown } from 'lucide-react';

interface ScheduleStop {
    stop: string; time: string | null; order: number;
}
interface Schedule {
    route_name: string;
    morning: ScheduleStop[];
    afternoon: ScheduleStop[];
}
interface Props {
    linked: boolean;
    schedule: Schedule | null;
}

export default function DriverSchedule({ linked, schedule }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Schedule">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Clock className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Schedule">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daily Schedule</h1>
                    <p className="text-sm text-slate-500">{schedule?.route_name ?? 'No route assigned'}</p>
                </div>

                {!schedule ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No schedule available.</CardContent></Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <ArrowUp className="w-4 h-4 text-emerald-500" /> Morning Pickup
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {schedule.morning.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No morning stops.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {schedule.morning.map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stop.order}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{stop.stop}</p>
                                                </div>
                                                {stop.time && <span className="text-xs text-slate-400">{stop.time}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <ArrowDown className="w-4 h-4 text-blue-500" /> Afternoon Drop-off
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {schedule.afternoon.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No afternoon stops.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {schedule.afternoon.map((stop, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{stop.order}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{stop.stop}</p>
                                                </div>
                                                {stop.time && <span className="text-xs text-slate-400">{stop.time}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
