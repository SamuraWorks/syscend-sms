import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ChevronRight } from 'lucide-react';

interface Student {
    id: number; full_name: string; admission_no: string;
    class: string | null; phone: string | null;
    room_no: string | null; bed_no: string | null;
}
interface Props {
    linked: boolean;
    students: Student[];
    hostel: { name: string } | null;
}

export default function WardenStudents({ linked, students, hostel }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Students">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Users className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Hostel Students">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/warden/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Warden</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Students</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hostel Students</h1>
                    <p className="text-sm text-slate-500">{hostel?.name ?? 'No hostel'} · {students.length} student{students.length !== 1 ? 's' : ''}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Admission No</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Bed</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">No students found.</TableCell>
                                    </TableRow>
                                ) : (
                                    students.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium text-slate-800 dark:text-slate-200">{s.full_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{s.admission_no}</TableCell>
                                            <TableCell>
                                                {s.class
                                                    ? <Badge variant="secondary" className="text-[10px]">{s.class}</Badge>
                                                    : <span className="text-xs text-slate-400">—</span>}
                                            </TableCell>
                                            <TableCell className="text-xs">{s.phone ?? '—'}</TableCell>
                                            <TableCell>{s.room_no ?? '—'}</TableCell>
                                            <TableCell className={cn('text-xs', !s.bed_no && 'text-slate-400')}>{s.bed_no ?? '—'}</TableCell>
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
