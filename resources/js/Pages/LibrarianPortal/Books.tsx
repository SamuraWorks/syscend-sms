import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Search } from 'lucide-react';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface BookItem {
    id: number; title: string; author: string; isbn: string | null;
    category: string | null; total_copies: number; available_copies: number; is_active: boolean;
}
interface PaginatedData {
    data: BookItem[];
    current_page: number; last_page: number; per_page: number; total: number;
}
interface Props {
    linked: boolean;
    books: PaginatedData;
    filters: { search: string };
}

export default function LibrarianBooks({ linked, books, filters }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Books">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [search, setSearch] = useState(filters.search);

    const handleSearch = () => {
        router.get('/school/librarian/books', { search }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout title="Books">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Books</h1>
                    <p className="text-sm text-slate-500">{books.total} book{books.total !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by title, author, ISBN..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch} size="sm">Search</Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>ISBN</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-center">Total</TableHead>
                                    <TableHead className="text-center">Available</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {books.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-400">No books found.</TableCell>
                                    </TableRow>
                                ) : (
                                    books.data.map(b => (
                                        <TableRow key={b.id}>
                                            <TableCell className="font-medium">{b.title}</TableCell>
                                            <TableCell>{b.author}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{b.isbn ?? '—'}</TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px]">{b.category ?? '—'}</Badge></TableCell>
                                            <TableCell className="text-center">{b.total_copies}</TableCell>
                                            <TableCell className="text-center">{b.available_copies}</TableCell>
                                            <TableCell>
                                                <Badge className={cn('text-[10px]', b.available_copies > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                                                    {b.available_copies > 0 ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {books.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Page {books.current_page} of {books.last_page}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={books.current_page <= 1} onClick={() => router.get(`/school/librarian/books?page=${books.current_page - 1}&search=${search}`, {}, { preserveState: true })}>Previous</Button>
                            <Button variant="outline" size="sm" disabled={books.current_page >= books.last_page} onClick={() => router.get(`/school/librarian/books?page=${books.current_page + 1}&search=${search}`, {}, { preserveState: true })}>Next</Button>
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
