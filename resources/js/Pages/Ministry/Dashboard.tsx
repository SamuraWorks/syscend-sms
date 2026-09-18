import MinistryLayout from '@/Layouts/MinistryLayout';
import { useRealtime } from '@/lib/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    School,
    Users,
    GraduationCap,
    UserCog,
    MapPin,
    ShieldCheck,
    ClipboardList,
    TrendingUp,
    AlertCircle,
    Landmark,
    CheckCircle,
    Clock,
    FileText,
    ArrowUpRight,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import LiveBadge from '@/components/LiveBadge';

interface Props {
    user: { id: number; name: string; email: string };
    stats: {
        total_schools: number;
        active_schools: number;
        total_students: number;
        total_teachers: number;
        total_districts: number;
        pending_inspections: number;
        compliant_schools: number;
        accredited_schools: number;
    };
    recentAnnouncements: Array<{
        id: number;
        title: string;
        type: string;
        priority: string;
        published_at: string;
    }>;
    districtStats: Array<{
        id: number;
        name: string;
        code: string;
        province: string;
        schools_count: number;
        students_count: number;
    national_students_count: number;
        teachers_count: number;
    national_teachers_count: number;
    }>;
    recentInspections: Array<{
        id: number;
        status: string;
        inspection_type: string;
        scheduled_date: string;
        school?: { name: string };
    }>;
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

const priorityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    urgent: 'destructive',
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
};

const inspectionStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    in_progress: 'secondary',
    scheduled: 'outline',
    cancelled: 'destructive',
};

const announcementTypeIcon: Record<string, typeof FileText> = {
    policy: FileText,
    event: Clock,
    alert: AlertCircle,
    update: TrendingUp,
};

export default function Dashboard({
    user,
    stats,
    recentAnnouncements,
    districtStats,
    recentInspections,
}: Props) {
    const { secondsAgo } = useRealtime();

    return (
        <MinistryLayout title="National Dashboard">
            <div className="space-y-6">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <LiveBadge secondsAgo={secondsAgo} />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Landmark className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                    National Dashboard
                                </h1>
                                <p className="font-sans text-sm text-muted-foreground">
                                    Ministry of Education — Republic of Sierra Leone
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-sans text-sm font-medium text-foreground">{user.name}</p>
                        <p className="font-sans text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                {/* KPI Row 1 — Primary Metrics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Total Schools
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.total_schools)}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Nationwide
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                                    <School className="h-5 w-5 text-indigo-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Total Students
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.total_students)}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Enrolled nationwide
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Total Teachers
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.total_teachers)}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Across all schools
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                    <UserCog className="h-5 w-5 text-violet-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 to-violet-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Total Districts
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {stats.total_districts}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Administrative regions
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                                    <MapPin className="h-5 w-5 text-sky-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-500 to-sky-600" />
                        </CardContent>
                    </Card>
                </div>

                {/* KPI Row 2 — Compliance & Operations */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Active Schools
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.active_schools)}
                                    </p>
                                    <p className="font-sans text-xs text-emerald-600">
                                        {stats.total_schools > 0
                                            ? `${Math.round((stats.active_schools / stats.total_schools) * 100)}% of total`
                                            : 'No data'}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                                    <CheckCircle className="h-5 w-5 text-teal-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Accredited Schools
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.accredited_schools)}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Ministry accredited
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Pending Inspections
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {stats.pending_inspections}
                                    </p>
                                    <p className="font-sans text-xs text-orange-600">
                                        Awaiting review
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                                    <ClipboardList className="h-5 w-5 text-orange-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-sans text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Compliant Schools
                                    </p>
                                    <p className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                                        {formatNumber(stats.compliant_schools)}
                                    </p>
                                    <p className="font-sans text-xs text-muted-foreground">
                                        Meeting standards
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* District Overview — 2/3 width */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="border-b border-border">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-sans text-sm font-semibold text-foreground">
                                    District Overview
                                </CardTitle>
                                <Link
                                    href="/ministry/districts"
                                    className="font-sans text-xs font-medium text-primary hover:underline"
                                >
                                    View all districts
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {districtStats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <MapPin className="mb-3 h-8 w-8 text-muted-foreground/40" />
                                    <p className="font-sans text-sm text-muted-foreground">No district data available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border bg-accent/50">
                                                <th className="px-4 py-3 text-left font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    District
                                                </th>
                                                <th className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Province
                                                </th>
                                                <th className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Schools
                                                </th>
                                                <th className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Students
                                                </th>
                                                <th className="px-4 py-3 text-right font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Teachers
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {districtStats.map((district) => (
                                                <tr
                                                    key={district.id}
                                                    className="transition-colors hover:bg-accent/30"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                                                <MapPin className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-sans text-sm font-medium text-foreground truncate">
                                                                    {district.name}
                                                                </p>
                                                                <p className="font-sans text-xs text-muted-foreground">
                                                                    {district.code}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-sans text-sm text-muted-foreground">
                                                            {district.province}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-sans text-sm font-medium text-foreground">
                                                            {district.schools_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-sans text-sm font-medium text-foreground">
                                                            {district.national_students_count.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-sans text-sm font-medium text-foreground">
                                                            {district.national_teachers_count.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-border bg-accent/50">
                                                <td className="px-4 py-3 font-sans text-sm font-semibold text-foreground" colSpan={2}>
                                                    National Total
                                                </td>
                                                <td className="px-4 py-3 text-right font-sans text-sm font-semibold text-foreground">
                                                    {districtStats.reduce((sum, d) => sum + d.schools_count, 0)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-sans text-sm font-semibold text-foreground">
                                                    {districtStats.reduce((sum, d) => sum + d.national_students_count, 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-sans text-sm font-semibold text-foreground">
                                                    {districtStats.reduce((sum, d) => sum + d.national_teachers_count, 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Column — 1/3 width */}
                    <div className="space-y-6">

                        {/* Recent Announcements */}
                        <Card>
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-sans text-sm font-semibold text-foreground">
                                        Recent Announcements
                                    </CardTitle>
                                    <Link
                                        href="/ministry/communication/announcements"
                                        className="font-sans text-xs font-medium text-primary hover:underline"
                                    >
                                        View all
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentAnnouncements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <FileText className="mb-3 h-7 w-7 text-muted-foreground/40" />
                                        <p className="font-sans text-sm text-muted-foreground">
                                            No announcements yet
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {recentAnnouncements.map((announcement) => {
                                            const Icon = announcementTypeIcon[announcement.type] ?? FileText;
                                            return (
                                                <li
                                                    key={announcement.id}
                                                    className="px-4 py-3 transition-colors hover:bg-accent/30"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                                                            <Icon className="h-3.5 w-3.5 text-accent-foreground" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-sans text-sm font-medium text-foreground line-clamp-2">
                                                                {announcement.title}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                <Badge
                                                                    variant={priorityVariant[announcement.priority] ?? 'outline'}
                                                                    className="text-[10px]"
                                                                >
                                                                    {announcement.priority}
                                                                </Badge>
                                                                <span className="font-sans text-[11px] text-muted-foreground">
                                                                    {announcement.published_at}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Inspections */}
                        <Card>
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="font-sans text-sm font-semibold text-foreground">
                                        Recent Inspections
                                    </CardTitle>
                                    <Link
                                        href="/ministry/inspections"
                                        className="font-sans text-xs font-medium text-primary hover:underline"
                                    >
                                        View all
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentInspections.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <ClipboardList className="mb-3 h-7 w-7 text-muted-foreground/40" />
                                        <p className="font-sans text-sm text-muted-foreground">
                                            No inspections recorded
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-border">
                                        {recentInspections.map((inspection) => (
                                            <li
                                                key={inspection.id}
                                                className="px-4 py-3 transition-colors hover:bg-accent/30"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                                                        <ClipboardList className="h-3.5 w-3.5 text-accent-foreground" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-sans text-sm font-medium text-foreground truncate">
                                                            {inspection.school?.name ?? 'Unknown School'}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <Badge
                                                                variant={inspectionStatusVariant[inspection.status] ?? 'outline'}
                                                                className="text-[10px] capitalize"
                                                            >
                                                                {inspection.status.replace('_', ' ')}
                                                            </Badge>
                                                            <span className="font-sans text-[11px] text-muted-foreground">
                                                                {inspection.inspection_type}
                                                            </span>
                                                            <span className="font-sans text-[11px] text-muted-foreground">
                                                                ·
                                                            </span>
                                                            <span className="font-sans text-[11px] text-muted-foreground">
                                                                {inspection.scheduled_date}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MinistryLayout>
    );
}
