import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Building, DoorOpen, Users, TrendingUp, BedDouble, ChevronRight } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Staff { id: number; full_name: string; emp_id: string; photo_url: string | null; }
interface Hostel { id: number; name: string; type: string; status: string; }
interface Stats { total_rooms: number; total_capacity: number; occupied: number; occupancy_rate: number; }
interface Allocation { id: number; student_name: string; room_no: string; bed_no: string; joining_date: string | null; status: string; }
interface Props {
    linked: boolean;
    staff: Staff;
    hostel: Hostel | null;
    stats: Stats;
    recentAllocations: Allocation[];
}

const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    occupied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    left: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function WardenDashboard({ linked, staff, hostel, stats, recentAllocations }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Warden Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const statCards = [
        { label: 'Total Rooms', value: stats.total_rooms, icon: DoorOpen, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Total Capacity', value: stats.total_capacity, icon: BedDouble, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Occupied', value: stats.occupied, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Occupancy Rate', value: `${stats.occupancy_rate}%`, icon: TrendingUp, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
    ];

    return (
        <AppLayout title="Warden Dashboard">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar src={staff.photo_url} name={staff.full_name} size="xl" showRing />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">Emp# {staff.emp_id} · Warden</p>
                        {hostel && (
                            <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5" /> {hostel.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.color)}>
                                        <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {hostel && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Building className="w-4 h-4 text-violet-500" /> My Hostel
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">{hostel.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{hostel.type ?? '—'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn('text-[10px]', hostel.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{hostel.status}</Badge>
                                    <Link href="/school/warden/hostel" className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">View details</Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <span className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500" /> Recent Allocations</span>
                            <Link href="/school/warden/allocations" className="text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">View all</Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentAllocations.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No recent allocations.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs text-slate-500 uppercase tracking-wide">
                                            <th className="px-4 py-2.5 font-medium">Student</th>
                                            <th className="px-4 py-2.5 font-medium">Room</th>
                                            <th className="px-4 py-2.5 font-medium">Bed</th>
                                            <th className="px-4 py-2.5 font-medium">Joining Date</th>
                                            <th className="px-4 py-2.5 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentAllocations.map(a => (
                                            <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{a.student_name}</td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{a.room_no}</td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{a.bed_no}</td>
                                                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{a.joining_date ?? '—'}</td>
                                                <td className="px-4 py-2.5">
                                                    <Badge className={cn('text-[10px]', statusBadge[a.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{a.status}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
