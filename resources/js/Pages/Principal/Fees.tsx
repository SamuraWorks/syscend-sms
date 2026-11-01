import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ChevronRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface Overview { collected: number; outstanding: number; collection_rate: number; }
interface Category { category: string; total: number; collected: number; outstanding: number; }
interface ByClass { class_name: string; total: number; collected: number; outstanding: number; }
interface Props { linked: boolean; feeOverview: Overview; byCategory: Category[]; byClass: ByClass[]; }

export default function Fees({ linked, feeOverview, byCategory, byClass }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Fees">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <DollarSign className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalDue = (feeOverview?.collected ?? 0) + (feeOverview?.outstanding ?? 0);

    return (
        <AppLayout title="Fees">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Fees</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" /> Fees Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Fee collection and payment tracking</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-emerald-100 dark:bg-emerald-900/30"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">Le {totalDue.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Expected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                            <p className="text-2xl font-bold text-green-600">Le {(feeOverview?.collected ?? 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Collected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-red-100 dark:bg-red-900/30"><AlertCircle className="w-4 h-4 text-red-600" /></div>
                            <p className="text-2xl font-bold text-red-600">Le {(feeOverview?.outstanding ?? 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Outstanding</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-indigo-100 dark:bg-indigo-900/30"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{feeOverview?.collection_rate ?? 0}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Collection Rate</p>
                        </CardContent>
                    </Card>
                </div>

                {byCategory.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Collection by Fee Category</h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Category</th>
                                        <th className="text-right py-3 px-4 font-medium">Expected</th>
                                        <th className="text-right py-3 px-4 font-medium">Collected</th>
                                        <th className="text-right py-3 px-4 font-medium">Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {byCategory.map(c => (
                                        <tr key={c.category} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{c.category}</td>
                                            <td className="py-3 px-4 text-right text-slate-500">Le {c.total.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-green-600 font-medium">Le {c.collected.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-red-500 font-medium">Le {c.outstanding.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {byClass.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Collection by Class</h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Class</th>
                                        <th className="text-right py-3 px-4 font-medium">Expected</th>
                                        <th className="text-right py-3 px-4 font-medium">Collected</th>
                                        <th className="text-right py-3 px-4 font-medium">Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {byClass.map(c => (
                                        <tr key={c.class_name} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{c.class_name}</td>
                                            <td className="py-3 px-4 text-right text-slate-500">Le {c.total.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-green-600 font-medium">Le {c.collected.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-red-500 font-medium">Le {c.outstanding.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
