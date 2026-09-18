import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bus, MapPin, Users, Clock, Navigation, Route,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Staff {
    id: number; full_name: string; emp_id: string; photo_url: string | null;
}
interface Vehicle {
    plate_no: string | null; name: string | null; capacity: number | null;
}
interface RouteInfo {
    id: number; name: string; start_point: string; end_point: string; vehicle: Vehicle;
}
interface PickupStop {
    stop: string; time: string | null; status: string; order: number;
}
interface Props {
    linked: boolean; staff: Staff | null;
    route: RouteInfo | null; studentCount: number; todayPickups: PickupStop[];
}

const QUICK_ACTIONS = [
    { label: 'My Route', href: '/school/driver/route', icon: MapPin, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Students', href: '/school/driver/students', icon: Users, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Schedule', href: '/school/driver/schedule', icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Announcements', href: '/school/driver/announcements', icon: Bus, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
];

export default function DriverDashboard({
    linked, staff, route, studentCount, todayPickups,
}: Props) {
    if (!linked || !staff) {
        return (
            <AppLayout title="Driver Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Bus className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked to a staff record yet. Please contact your school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Driver Dashboard">
            <div className="space-y-6">

                <div className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar
                        src={staff.photo_url}
                        name={staff.full_name}
                        size="xl"
                        showRing
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">{staff.emp_id}</p>
                        <Badge className="mt-1 text-[10px] border-0 bg-white/20 text-white">Driver</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{route ? route.name : '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Assigned Route</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentCount}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Students on Route</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Navigation className="w-4 h-4 text-amber-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{route?.vehicle?.plate_no ?? '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Vehicle</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-violet-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayPickups.length}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Today&apos;s Stops</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map(a => (
                        <Link key={a.label} href={a.href} className="block">
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow text-center">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', a.color)}>
                                    <a.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-amber-500" /> Today&apos;s Stops
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayPickups.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No stops scheduled.</p>
                        ) : (
                            <div className="space-y-2">
                                {todayPickups.map((stop, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{stop.order}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{stop.stop}</p>
                                            {stop.time && <p className="text-xs text-slate-400">{stop.time}</p>}
                                        </div>
                                        <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{stop.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
