import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface Item {
    id: number; name: string; category: string; unit: string;
    current_stock: number; minimum_stock: number;
    is_low_stock: boolean; is_active: boolean;
}
interface PaginatedData {
    data: Item[];
    current_page: number; last_page: number; per_page: number; total: number;
}
interface Props {
    linked: boolean;
    items: PaginatedData;
    filters: { search: string; low_stock: string };
}

export default function StoreManagerItems({ linked, items, filters }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Inventory Items">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Package className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [search, setSearch] = useState(filters.search);

    const handleSearch = () => {
        router.get('/school/store-manager/items', { search, low_stock: filters.low_stock }, { preserveState: true, replace: true });
    };

    const toggleLowStock = () => {
        const newLowStock = filters.low_stock ? '' : '1';
        router.get('/school/store-manager/items', { search, low_stock: newLowStock }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Inventory Items">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Items</h1>
                    <p className="text-sm text-slate-500">{items.total} item{items.total !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search items..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch} size="sm">Search</Button>
                    <Button onClick={toggleLowStock} size="sm" variant={filters.low_stock ? 'default' : 'outline'}>
                        <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-center">Current Stock</TableHead>
                                    <TableHead className="text-center">Min Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">No items found.</TableCell>
                                    </TableRow>
                                ) : (
                                    items.data.map(i => (
                                        <TableRow key={i.id}>
                                            <TableCell className="font-medium">{i.name}</TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px]">{i.category}</Badge></TableCell>
                                            <TableCell className="text-xs">{i.unit}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn('font-medium', i.is_low_stock ? 'text-red-600' : 'text-slate-800 dark:text-slate-200')}>{i.current_stock}</span>
                                            </TableCell>
                                            <TableCell className="text-center text-xs">{i.minimum_stock}</TableCell>
                                            <TableCell>
                                                {i.is_low_stock ? (
                                                    <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Low Stock</Badge>
                                                ) : (
                                                    <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">In Stock</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {items.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Page {items.current_page} of {items.last_page}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={items.current_page <= 1} onClick={() => router.get(`/school/store-manager/items?page=${items.current_page - 1}&search=${search}&low_stock=${filters.low_stock}`, {}, { preserveState: true })}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={items.current_page >= items.last_page} onClick={() => router.get(`/school/store-manager/items?page=${items.current_page + 1}&search=${search}&low_stock=${filters.low_stock}`, {}, { preserveState: true })}>Next</Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}
