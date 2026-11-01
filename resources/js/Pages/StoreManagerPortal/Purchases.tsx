import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Purchase {
    id: number; item_name: string; vendor: string; quantity: number;
    unit_price: number; total_price: number; invoice_no: string | null;
    purchase_date: string | null; notes: string | null;
}
interface PaginatedData {
    data: Purchase[];
    current_page: number; last_page: number; per_page: number; total: number;
}
interface Props {
    linked: boolean;
    purchases: PaginatedData;
    totalSpent: number;
}

export default function StoreManagerPurchases({ linked, purchases, totalSpent }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Purchases">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingCart className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Purchase History">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Purchase History</h1>
                    <p className="text-sm text-slate-500">{purchases.total} purchase{purchases.total !== 1 ? 's' : ''} · Total spent: Le {totalSpent.toLocaleString()}</p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-400">No purchases found.</TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.data.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">{p.item_name}</TableCell>
                                            <TableCell className="text-xs">{p.vendor}</TableCell>
                                            <TableCell className="text-right text-xs">{p.quantity}</TableCell>
                                            <TableCell className="text-right text-xs">Le {p.unit_price.toLocaleString()}</TableCell>
                                            <TableCell className="text-right text-sm font-semibold">Le {p.total_price.toLocaleString()}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{p.invoice_no ?? '—'}</TableCell>
                                            <TableCell className="text-xs">{p.purchase_date ?? '—'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {purchases.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Page {purchases.current_page} of {purchases.last_page}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={purchases.current_page <= 1} onClick={() => router.get(`/school/store-manager/purchases?page=${purchases.current_page - 1}`, {}, { preserveState: true })}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={purchases.current_page >= purchases.last_page} onClick={() => router.get(`/school/store-manager/purchases?page=${purchases.current_page + 1}`, {}, { preserveState: true })}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
