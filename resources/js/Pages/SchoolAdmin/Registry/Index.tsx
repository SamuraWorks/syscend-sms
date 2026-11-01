import { Head, Link, usePage } from '@inertiajs/react';
import { Users, GraduationCap, UserCog, FileSpreadsheet, BadgeCheck, ArrowRight, Upload } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps } from '@/Types';

interface RegistryStats {
    total_students: number;
    registered_students: number;
    pending_students: number;
    total_parents: number;
    registered_parents: number;
    pending_parents: number;
    total_staff: number;
    registered_staff: number;
    pending_staff: number;
}

interface RecentClaim {
    id: number;
    name: string;
    claimed_at: string;
    registration_status: string;
}

interface RecentImport {
    id: number;
    import_type: string;
    file_name: string;
    status: string;
    total_rows: number;
    imported_rows: number;
    created_at: string;
}

interface Props extends PageProps {
    stats: RegistryStats;
    recent_claims: RecentClaim[];
    recent_imports: RecentImport[];
}

const importStatusBadge = (status: string) => {
    const map: Record<string, string> = {
        completed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        validating:  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        failed:      'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
        processing:  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
        pending:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const claimStatusBadge = (status: string) => {
    const map: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
        pending:  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? map.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default function RegistryIndex() {
    const { stats = { total_students: 0, registered_students: 0, pending_students: 0, total_parents: 0, registered_parents: 0, pending_parents: 0, total_staff: 0, registered_staff: 0, pending_staff: 0 }, recent_claims = [], recent_imports = [] } = usePage<Props>().props;

    const statCards = [
        {
            label: 'Total Students',
            icon: GraduationCap,
            value: stats.total_students,
            registered: stats.registered_students,
            pending: stats.pending_students,
            href: '/school-admin/registry/students',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            iconBg: 'bg-indigo-100 dark:bg-indigo-950/50',
        },
        {
            label: 'Total Parents',
            icon: Users,
            value: stats.total_parents,
            registered: stats.registered_parents,
            pending: stats.pending_parents,
            href: '/school-admin/registry/parents',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
        },
        {
            label: 'Total Staff',
            icon: UserCog,
            value: stats.total_staff,
            registered: stats.registered_staff,
            pending: stats.pending_staff,
            href: '/school-admin/registry/staff',
            iconColor: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-100 dark:bg-amber-950/50',
        },
        {
            label: 'Total Imports',
            icon: FileSpreadsheet,
            value: recent_imports.length,
            href: '/school-admin/imports',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
            iconBg: 'bg-cyan-100 dark:bg-cyan-950/50',
            isImports: true,
        },
    ];

    const quickActions = [
        { label: 'Import Students', href: '/school-admin/imports/create/students', icon: GraduationCap },
        { label: 'Import Parents', href: '/school-admin/imports/create/parents', icon: Users },
        { label: 'Import Staff', href: '/school-admin/imports/create/staff', icon: UserCog },
        { label: 'Import Curriculum', href: '/school-admin/imports/create/curriculum', icon: FileSpreadsheet },
    ];

    return (
        <AppLayout breadcrumbs={[{ label: 'Registry' }]}>
            <Head title="School Registry" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">School Registry</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Overview of registered users and import history</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-6">
                {quickActions.map((action) => (
                    <Button key={action.label} variant="outline" size="sm" asChild className="inline-flex items-center gap-2">
                        <Link href={action.href}>
                            <Upload className="w-4 h-4" />
                            {action.label}
                        </Link>
                    </Button>
                ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.label} href={card.href} className="block group">
                            <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {card.label}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                                        <Icon className={`w-4 h-4 ${card.iconColor}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                            {!card.isImports && (
                                                <p className="text-xs mt-1">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{card.registered} registered</span>
                                                    <span className="text-slate-400 mx-1">/</span>
                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">{card.pending} pending</span>
                                                </p>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Registration Claims */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Recent Registration Claims
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/school-admin/registry/students" className="inline-flex items-center gap-1 text-xs">
                                View All <ArrowRight className="w-3 h-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recent_claims.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No recent claims</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Claimed Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_claims.slice(0, 10).map((claim) => (
                                            <TableRow key={claim.id}>
                                                <TableCell className="font-medium text-slate-900 dark:text-white">
                                                    {claim.name}
                                                </TableCell>
                                                <TableCell>{claimStatusBadge(claim.registration_status)}</TableCell>
                                                <TableCell className="text-right text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(claim.claimed_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Imports */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            Recent Imports
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/school-admin/imports" className="inline-flex items-center gap-1 text-xs">
                                View All <ArrowRight className="w-3 h-3" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recent_imports.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No recent imports</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>File</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Rows</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_imports.slice(0, 10).map((imp) => (
                                            <TableRow key={imp.id}>
                                                <TableCell>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                        {imp.import_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900 dark:text-white text-sm">
                                                    {imp.file_name}
                                                </TableCell>
                                                <TableCell>{importStatusBadge(imp.status)}</TableCell>
                                                <TableCell className="text-right text-sm text-slate-500 dark:text-slate-400">
                                                    {imp.imported_rows}/{imp.total_rows}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
