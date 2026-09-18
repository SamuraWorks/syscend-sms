import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface DistrictRow {
    id: number;
    name: string;
    schools_count: number;
    national_students_count: number;
    national_teachers_count: number;
    inspections_count: number;
}

interface Props {
    districts: DistrictRow[];
}

type SortKey = 'name' | 'schools_count' | 'national_students_count' | 'national_teachers_count' | 'inspections_count';

export default function ReportDistricts({ districts }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortAsc, setSortAsc] = useState(true);

    const sorted = useMemo(() => {
        return [...districts].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [districts, sortKey, sortAsc]);

    const totals = useMemo(() => ({
        schools: districts.reduce((s, d) => s + d.schools_count, 0),
        students: districts.reduce((s, d) => s + d.national_students_count, 0),
        teachers: districts.reduce((s, d) => s + d.national_teachers_count, 0),
        inspections: districts.reduce((s, d) => s + d.inspections_count, 0),
    }), [districts]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(key === 'name'); }
    }

    const headers: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
        { key: 'name', label: 'District', align: 'left' },
        { key: 'schools_count', label: 'Schools', align: 'right' },
        { key: 'national_students_count', label: 'Students', align: 'right' },
        { key: 'national_teachers_count', label: 'Teachers', align: 'right' },
        { key: 'inspections_count', label: 'Inspections', align: 'right' },
    ];

    return (
        <MinistryLayout title="Reports — District Reports">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary" />
                        District Reports
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Education statistics breakdown by district
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">District Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        {headers.map((h) => (
                                            <th
                                                key={h.key}
                                                className={`py-3 px-4 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${h.align === 'right' ? 'text-right' : 'text-left'}`}
                                                onClick={() => toggleSort(h.key)}
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    {h.label}
                                                    <ArrowUpDown className="w-3 h-3" />
                                                    {sortKey === h.key && (
                                                        <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                                    )}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                <p>No district data available</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sorted.map((d) => (
                                            <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-foreground">{d.name}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.schools_count}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.national_students_count.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.national_teachers_count.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-foreground">{d.inspections_count}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-accent/50">
                                        <td className="py-3 px-4 font-sans text-sm font-semibold text-foreground">National Total</td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">{totals.schools}</td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">{totals.students.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">{totals.teachers.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-sans text-sm font-semibold text-foreground">{totals.inspections}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
