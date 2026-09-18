import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface Log {
    id: number; action: string; description: string;
    user: string; created_at: string;
}
interface Props {
    linked: boolean;
    logs: Log[];
}

export default function AuditLog({ linked, logs }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Audit Log">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Contact the school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Audit Log">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Audit Log</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Audit Log</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Track all system activity across your school.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Activity Log ({logs.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">No audit logs found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-2 font-medium text-slate-500">Date</th>
                                            <th className="text-left py-2 font-medium text-slate-500">Action</th>
                                            <th className="text-left py-2 font-medium text-slate-500">Description</th>
                                            <th className="text-left py-2 font-medium text-slate-500">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {logs.map(log => (
                                            <tr key={log.id}>
                                                <td className="py-2.5 text-slate-400 text-xs whitespace-nowrap">{log.created_at}</td>
                                                <td className="py-2.5">
                                                    <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                                </td>
                                                <td className="py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">{log.description}</td>
                                                <td className="py-2.5 text-slate-500 text-sm">{log.user}</td>
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
