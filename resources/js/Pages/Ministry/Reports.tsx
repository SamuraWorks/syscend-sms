import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, School, Users, GraduationCap, MapPin, ClipboardList, FileText, ArrowUpRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Stats {
    total_schools: number;
    total_students: number;
    total_teachers: number;
    total_districts: number;
    total_exams: number;
    completed_inspections: number;
}

interface Props {
    stats: Stats;
}

const NAV_ITEMS = [
    {
        title: 'District Reports',
        description: 'School, student, and teacher counts by district',
        href: '/ministry/reports/districts',
        icon: MapPin,
    },
    {
        title: 'Enrollment Analytics',
        description: 'Student enrollment breakdown by level and district',
        href: '/ministry/reports/enrollment',
        icon: GraduationCap,
    },
    {
        title: 'Gender Analytics',
        description: 'Student and teacher gender distribution',
        href: '/ministry/reports/gender',
        icon: Users,
    },
];

export default function Reports({ stats }: Props) {
    const statCards = [
        { label: 'Total Schools', value: stats.total_schools, icon: School, color: 'text-indigo-600' },
        { label: 'Total Students', value: stats.total_students, icon: GraduationCap, color: 'text-emerald-600' },
        { label: 'Total Teachers', value: stats.total_teachers, icon: Users, color: 'text-violet-600' },
        { label: 'Total Districts', value: stats.total_districts, icon: MapPin, color: 'text-sky-600' },
        { label: 'Total Exams', value: stats.total_exams, icon: ClipboardList, color: 'text-amber-600' },
        { label: 'Completed Inspections', value: stats.completed_inspections, icon: FileText, color: 'text-teal-600' },
    ];

    return (
        <MinistryLayout title="National Reports">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-primary" />
                        National Reports
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Overview of national education statistics and analytics
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statCards.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                                        <stat.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Report Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className="group block rounded-lg border border-border p-5 transition-colors hover:bg-accent/50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 rounded-lg bg-muted text-primary">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                    </div>
                                    <h3 className="mt-3 font-serif text-base font-semibold text-foreground">{item.title}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MinistryLayout>
    );
}
