import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

interface Student {
    id: number; full_name: string; admission_no: string;
    class: string; phone: string | null; stop: string;
}
interface Props {
    linked: boolean;
    students: Student[];
    route: { name: string } | null;
}

export default function DriverStudents({ linked, students, route }: Props) {
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
        <AppLayout title="Assigned Students">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Assigned Students</h1>
                    <p className="text-sm text-slate-500">{route?.name ?? 'No route'} · {students.length} student{students.length !== 1 ? 's' : ''}</p>
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
                                    <TableHead>Stop</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">No students assigned.</TableCell>
                                    </TableRow>
                                ) : (
                                    students.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.full_name}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{s.admission_no}</TableCell>
                                            <TableCell>{s.class}</TableCell>
                                            <TableCell className="text-xs">{s.phone ?? '—'}</TableCell>
                                            <TableCell>{s.stop}</TableCell>
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
