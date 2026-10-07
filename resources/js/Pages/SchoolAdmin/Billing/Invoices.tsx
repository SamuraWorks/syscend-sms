import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ChevronLeft, ChevronRight, Receipt, CircleCheckBig, TrendingUp, Coins } from 'lucide-react';

interface Pkg { name: string; }
interface Sub { package: Pkg | null; }
interface InvoiceItem {
    id: number; invoice_no: string; status: string;
    issue_date: string; due_date: string | null;
    subtotal: string; discount: string; total: string; currency: string;
    subscription: Sub | null;
}
interface Meta { total: number; per_page: number; current_page: number; last_page: number; }
interface Props {
    invoices: { data: InvoiceItem[]; meta: Meta };
    kpi: { total_issued: number; total_paid: number; outstanding: number; collected: number };
    filters: { status?: string };
}

const STATUS_COLORS: Record<string, string> = {
    paid:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    issued:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    overdue:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function BillingInvoices({ invoices, kpi, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');

    function applyFilters(overrides: Record<string, string | number | undefined> = {}) {
        router.get('/school/billing/invoices', { status: statusFilter, ...overrides }, { preserveState: true, replace: true });
    }

    const meta = invoices.meta;

    return (
        <AppLayout title="Invoices">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Your school's subscription invoices</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-5 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"><Receipt className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-slate-500">Outstanding</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{kpi.total_issued}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><CircleCheckBig className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-slate-500">Paid</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{kpi.total_paid}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"><TrendingUp className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-slate-500">Due (Le)</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{Number(kpi.outstanding).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"><Coins className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs text-slate-500">Settled (Le)</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{Number(kpi.collected).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); applyFilters({ status: v, page: 1 }); }}>
                                <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all">All statuses</SelectItem>
                                    <SelectItem value="issued">Issued</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Issued</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">PDF</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.data.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No invoices found.</TableCell></TableRow>
                                )}
                                {invoices.data.map(i => (
                                    <TableRow key={i.id}>
                                        <TableCell className="font-mono text-sm font-medium">{i.invoice_no}</TableCell>
                                        <TableCell>{i.subscription?.package?.name ?? '—'}</TableCell>
                                        <TableCell><Badge className={STATUS_COLORS[i.status] ?? ''}>{i.status}</Badge></TableCell>
                                        <TableCell className="text-sm">{String(i.issue_date).slice(0, 10)}</TableCell>
                                        <TableCell className="text-sm">{i.due_date ? String(i.due_date).slice(0, 10) : '—'}</TableCell>
                                        <TableCell className="text-right text-sm font-semibold">Le {Number(i.total).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="outline" className="gap-1.5" asChild>
                                                <a href={`/school/billing/invoices/${i.id}/pdf`}><Download className="w-3.5 h-3.5" /> PDF</a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {meta.last_page > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-slate-500">
                                    <FileText className="w-4 h-4 inline mr-1 mb-0.5" />
                                    {meta.total} invoices · Page {meta.current_page} of {meta.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1}
                                        onClick={() => applyFilters({ page: meta.current_page - 1 })}>
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </Button>
                                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page}
                                        onClick={() => applyFilters({ page: meta.current_page + 1 })}>
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}