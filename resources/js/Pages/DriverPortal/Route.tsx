import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface Vehicle {
    plate_no: string | null; name: string | null; capacity: number | null;
}
interface RouteStop {
    name: string; time: string | null; order: number;
}
interface RouteInfo {
    id: number; name: string; start_point: string; end_point: string;
    monthly_fee: number; vehicle: Vehicle; stops: RouteStop[];
}
interface Props {
    linked: boolean;
    route: RouteInfo | null;
}

export default function DriverRoute({ linked, route }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Route">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <MapPin className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    if (!route) {
        return (
            <AppLayout title="My Route">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <MapPin className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No route assigned</h2>
                    <p className="text-sm text-slate-400 mt-1">Contact your administrator to assign a route.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Route">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{route.name}</h1>
                    <p className="text-sm text-slate-500">{route.start_point} → {route.end_point}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-slate-500">Start Point</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{route.start_point}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-slate-500">End Point</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{route.end_point}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-slate-500">Monthly Fee</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{route.monthly_fee}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-slate-500">Vehicle</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {route.vehicle.name ?? '—'} ({route.vehicle.plate_no ?? '—'})
                            </p>
                            <p className="text-xs text-slate-400">Capacity: {route.vehicle.capacity ?? '—'}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <MapPin className="w-4 h-4 text-blue-500" /> Route Stops
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {route.stops.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No stops configured.</p>
                        ) : (
                            <div className="space-y-2">
                                {route.stops.map((stop, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{stop.order}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{stop.name}</p>
                                        </div>
                                        {stop.time && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" /> {stop.time}
                                            </div>
                                        )}
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
