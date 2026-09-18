import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Layers, Search } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PageProps } from '@/Types';

interface Offering {
    id: number;
    class_id?: number;
    section_id?: number | null;
    subject_id?: number;
    subject_name: string;
    subject_code?: string;
    subject_type: string;
    selection_group?: string | null;
    is_required?: boolean;
    sort_order?: number;
}

interface Props extends PageProps {
    offerings: Record<string, Record<string, Offering[]>>;
    classes: { id: number; name: string; sections?: { id: number; name: string }[] }[];
    filters: { search?: string; section_id?: string; subject_type?: string };
    summary: { total: number; compulsory: number; elective: number; selective: number };
}

const typeBadge = (type: string) => {
    const map: Record<string, string> = {
        compulsory: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        elective:   'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        selective:  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            {type}
        </span>
    );
};

export default function RegistryCurriculum() {
    const { offerings, classes, filters, summary } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const entries = Object.entries(offerings);
    const sectionId = filters.section_id ? Number(filters.section_id) : null;
    const currentSection = classes.flatMap((c) => c.sections ?? []).find((s) => s.id === sectionId)?.name ?? (sectionId ? 'N/A' : 'All sections');

    const stat = (label: string, value: number) => (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 capitalize">{label}</p>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[{ label: 'Registry' }, { label: 'Curriculum' }]}>
            <Head title="Registry — Curriculum" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Curriculum Registry</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Subject offerings per class and section</p>
                </div>
                <Button variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                    <Link href="/school-admin/registry"><Layers className="w-4 h-4" /> Registry Overview</Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {stat('Total offerings', summary.total)}
                {stat('Compulsory', summary.compulsory)}
                {stat('Elective', summary.elective)}
                {stat('Selective', summary.selective)}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
                <form
                    className="flex flex-wrap items-center gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/school-admin/registry/curriculum', { ...filters, search });
                    }}
                >
                    <div className="relative flex-1 min-w-52 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search subjects…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select
                        value={filters.section_id ?? 'all'}
                        onValueChange={(v) => router.get('/school-admin/registry/curriculum', { ...filters, section_id: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Section" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All sections</SelectItem>
                            {classes.map((c) => (
                                (c.sections ?? []).map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{c.name} — {s.name}</SelectItem>
                                ))
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.subject_type ?? 'all'}
                        onValueChange={(v) => router.get('/school-admin/registry/curriculum', { ...filters, subject_type: v === 'all' ? '' : v })}
                    >
                        <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="compulsory">Compulsory</SelectItem>
                            <SelectItem value="elective">Elective</SelectItem>
                            <SelectItem value="selective">Selective</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button type="submit" size="sm" variant="secondary">Filter</Button>
                </form>
            </div>

            {(filters.section_id || filters.subject_type || filters.search) && (
                <p className="text-xs text-slate-500 mb-4">
                    Filtered by {[currentSection, ...(filters.subject_type ? [`type: ${filters.subject_type}`] : []), ...(filters.search ? [`“${filters.search}”`] : [])].filter(Boolean).join(' · ')}
                </p>
            )}

            {entries.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center py-16 text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No offerings found</p>
                </div>
            ) : entries.map(([className, sections]) => (
                <div key={className} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{className}</h2>
                    </div>
                    {Object.entries(sections).map(([sectionName, offerings]) => (
                        <div key={sectionName} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-3">
                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{sectionName}</h3>
                            </div>
                            {offerings.length === 0 ? (
                                <p className="px-4 py-8 text-center text-xs text-slate-400">No subjects assigned</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                                                <th className="px-4 py-2 font-medium">Subject</th>
                                                <th className="px-4 py-2 font-medium hidden sm:table-cell">Code</th>
                                                <th className="px-4 py-2 font-medium hidden md:table-cell">Group</th>
                                                <th className="px-4 py-2 font-medium">Type</th>
                                                <th className="px-4 py-2 font-medium text-right">Required</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offerings.map((o) => (
                                                <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{o.subject_name}</td>
                                                    <td className="px-4 py-2.5 hidden sm:table-cell font-mono text-xs text-slate-500">{o.subject_code ?? '—'}</td>
                                                    <td className="px-4 py-2.5 hidden md:table-cell text-slate-600 dark:text-slate-400">{o.selection_group ?? '—'}</td>
                                                    <td className="px-4 py-2.5">{typeBadge(o.subject_type)}</td>
                                                    <td className="px-4 py-2.5 text-right">
                                                        {o.is_required ? (
                                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Yes</span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">No</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </AppLayout>
    );
}