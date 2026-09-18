import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BedDouble, ChevronRight } from 'lucide-react';

interface Allocation {
    id: number; student_name: string; admission_no: string;
    room_no: string; bed_no: string;
    joining_date: string | null; leaving_date: string | null;
    status: string; notes: string | null;
}
interface Props {
    linked: boolean;
    allocations: Allocation[];
}

const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    occupied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    left: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function WardenAllocations({ linked, allocations }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Allocations">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BedDouble className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Allocations">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Allocations</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Room Allocations</h1>
                    <p className="text-sm text-slate-500">{allocations.length} allocation{allocations.length !== 1 ? 's' : ''}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Bed</TableHead>
                                    <TableHead>Joining</TableHead>
                                    <TableHead>Leaving</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-slate-400">No allocations found.</TableCell>
                                    </TableRow>
                                ) : (
                                    allocations.map(a => (
                                        <TableRow key={a.id}>
                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">{a.student_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{a.admission_no}</TableCell>
                                            <TableCell>{a.room_no}</TableCell>
                                            <TableCell>{a.bed_no}</TableCell>
                                            <TableCell className="text-xs">{a.joining_date ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{a.leaving_date ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-[10px]', statusBadge[a.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>{a.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{a.notes ?? '—'}</TableCell>
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
