import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Building, MapPin, BedDouble, Users, DoorOpen, TrendingUp, ChevronRight } from 'lucide-react';

interface HostelInfo {
    id: number; name: string; type: string; address: string | null;
    total_rooms: number; total_capacity: number; occupied: number; status: string;
}
interface Props {
    linked: boolean;
    hostel: HostelInfo | null;
}

export default function WardenHostel({ linked, hostel }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Hostel">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    if (!hostel) {
        return (
            <AppLayout title="Hostel">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Building className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No hostel assigned</h2>
                </div>
            </AppLayout>
        );
    }

    const occupancyRate = hostel.total_capacity > 0 ? Math.round((hostel.occupied / hostel.total_capacity) * 100) : 0;

    const statCards = [
        { label: 'Total Rooms', value: hostel.total_rooms, icon: DoorOpen, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Total Capacity', value: hostel.total_capacity, icon: BedDouble, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Occupied', value: hostel.occupied, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: TrendingUp, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
    ];

    return (
        <AppLayout title="Hostel Details">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Hostel</span>
                </div>

                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{hostel.name}</h1>
                        <Badge className={cn('text-[10px]', hostel.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{hostel.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 capitalize">{hostel.type ?? 'Hostel'}</p>
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <MapPin className="w-4 h-4 text-blue-500" /> Hostel Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Name</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{hostel.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Type</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{hostel.type ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Address</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{hostel.address ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <Badge className={cn('text-[10px]', hostel.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{hostel.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
