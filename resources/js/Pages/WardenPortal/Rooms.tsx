import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DoorOpen, ChevronRight } from 'lucide-react';

interface Room {
    id: number; room_no: string; floor: string | null; type: string | null;
    capacity: number; occupied: number; available: number;
    ac: boolean; monthly_fee: number; status: string;
}
interface Props {
    linked: boolean;
    rooms: Room[];
    hostel: { name: string } | null;
}

export default function WardenRooms({ linked, rooms, hostel }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Rooms">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <DoorOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Rooms">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Rooms</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Rooms</h1>
                    <p className="text-sm text-slate-500">{hostel?.name ?? 'No hostel'} · {rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Room No</TableHead>
                                    <TableHead>Floor</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Capacity</TableHead>
                                    <TableHead className="text-center">Occupied</TableHead>
                                    <TableHead className="text-center">Available</TableHead>
                                    <TableHead>AC</TableHead>
                                    <TableHead>Monthly Fee</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-slate-400">No rooms found.</TableCell>
                                    </TableRow>
                                ) : (
                                    rooms.map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">{r.room_no}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{r.floor ?? '—'}</TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{r.type ?? '—'}</Badge></TableCell>
                                            <TableCell className="text-center">{r.capacity}</TableCell>
                                            <TableCell className="text-center">{r.occupied}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn('font-medium', r.available > 0 ? 'text-green-600' : 'text-red-600')}>{r.available}</span>
                                            </TableCell>
                                            <TableCell>
                                                {r.ac
                                                    ? <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Yes</Badge>
                                                    : <Badge variant="secondary" className="text-[10px]">No</Badge>}
                                            </TableCell>
                                            <TableCell className="text-xs">Le {r.monthly_fee.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-[10px]', r.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : r.status === 'occupied' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>{r.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
