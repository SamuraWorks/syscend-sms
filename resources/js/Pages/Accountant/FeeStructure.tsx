import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layers, DollarSign, BookOpen } from 'lucide-react';

interface FeeCategory {
    id: number; name: string; amount: number;
}
interface ClassStructure {
    class_id: number; class_name: string; categories: FeeCategory[];
}
interface ClassOption { id: number; name: string; }
interface CategoryOption { id: number; name: string; }
interface Props {
    linked: boolean; structures: ClassStructure[];
    classes: ClassOption[]; categories: CategoryOption[];
}

export default function AccountantFeeStructure({ linked, structures, classes, categories }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Fee Structure">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Layers className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalPerClass = (cats: FeeCategory[]) => cats.reduce((sum, c) => sum + c.amount, 0);

    return (
        <AppLayout title="Fee Structure">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fee Structure</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Fee amounts organized by class and category</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{classes.length}</p>
                                    <p className="text-xs text-slate-500">Classes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                    <Layers className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{categories.length}</p>
                                    <p className="text-xs text-slate-500">Fee Categories</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                                        Le {structures.reduce((sum, s) => sum + totalPerClass(s.categories), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">Total Across All Classes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {structures.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No fee structures configured.</CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {structures.map(s => (
                            <Card key={s.class_id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-indigo-500" /> {s.class_name}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            Total: Le {totalPerClass(s.categories).toLocaleString()}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fee Category</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {s.categories.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-4 text-slate-400">No categories set.</TableCell>
                                                </TableRow>
                                            ) : (
                                                s.categories.map(c => (
                                                    <TableRow key={c.id}>
                                                        <TableCell className="font-medium">
                                                            <Badge variant="secondary" className="text-[10px]">{c.name}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-slate-800 dark:text-slate-200">
                                                            Le {c.amount.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
