import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, School, ClipboardCheck, MapPin, Users,
    FileText, ShieldCheck, ClipboardList, Star, PieChart,
    TrendingUp, Megaphone, Mail, Bell, KeyRound, Settings,
    ChevronLeft, ChevronRight, GraduationCap, UserCog, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/Stores/useUIStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    roles?: string[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'National Dashboard',
        items: [
            { label: 'Overview', href: '/ministry/dashboard', icon: LayoutDashboard, exact: true },
        ],
    },
    {
        title: 'Schools',
        items: [
            { label: 'School Registry', href: '/ministry/schools', icon: School },
            { label: 'Pending Approvals', href: '/ministry/schools/approvals', icon: ClipboardCheck },
        ],
    },
    {
        title: 'Student Registry',
        items: [
            { label: 'National Students', href: '/ministry/students', icon: Users },
            { label: 'Enrollment Analytics', href: '/ministry/students/analytics', icon: TrendingUp },
        ],
    },
    {
        title: 'Teacher Registry',
        items: [
            { label: 'National Teachers', href: '/ministry/teachers', icon: UserCog },
            { label: 'Licensing', href: '/ministry/teachers/licensing', icon: GraduationCap },
        ],
    },
    {
        title: 'Districts',
        items: [
            { label: 'District Dashboard', href: '/ministry/districts', icon: MapPin },
            { label: 'District Officers', href: '/ministry/districts/officers', icon: Users },
        ],
    },
    {
        title: 'National Examinations',
        items: [
            { label: 'NPSE', href: '/ministry/exams/npse', icon: FileText },
            { label: 'BECE', href: '/ministry/exams/bece', icon: FileText },
            { label: 'WASSCE', href: '/ministry/exams/wasse', icon: FileText },
            { label: 'Exam Analytics', href: '/ministry/exams/analytics', icon: PieChart },
        ],
    },
    {
        title: 'Quality Assurance',
        items: [
            { label: 'School Inspections', href: '/ministry/inspections', icon: ShieldCheck },
            { label: 'Compliance', href: '/ministry/inspections/compliance', icon: ClipboardList },
            { label: 'School Ratings', href: '/ministry/inspections/ratings', icon: Star },
        ],
    },
    {
        title: 'Reports & Analytics',
        items: [
            { label: 'National Reports', href: '/ministry/reports', icon: PieChart },
            { label: 'District Reports', href: '/ministry/reports/districts', icon: MapPin },
            { label: 'Enrollment Analytics', href: '/ministry/reports/enrollment', icon: TrendingUp },
            { label: 'Gender Analytics', href: '/ministry/reports/gender', icon: Users },
        ],
    },
    {
        title: 'Communication',
        items: [
            { label: 'Announcements', href: '/ministry/communication/announcements', icon: Megaphone },
            { label: 'Circulars', href: '/ministry/communication/circulars', icon: Mail },
            { label: 'Emergency Alerts', href: '/ministry/communication/alerts', icon: Bell },
            { label: 'Documents', href: '/ministry/downloads', icon: Download },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Ministry Users', href: '/ministry/admin/users', icon: Users, roles: ['ministry-admin'] },
            { label: 'Roles & Permissions', href: '/ministry/admin/roles', icon: KeyRound, roles: ['ministry-admin'] },
            { label: 'Audit Log', href: '/ministry/admin/audit', icon: ShieldCheck, roles: ['ministry-admin'] },
            { label: 'Settings', href: '/ministry/admin/settings', icon: Settings, roles: ['ministry-admin'] },
        ],
    },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const { url } = usePage();
    const isActive = item.exact ? url === item.href : url.startsWith(item.href);

    const link = (
        <Link
            href={item.href}
            onClick={() => {
                if (window.innerWidth < 768) {
                    useUIStore.getState().setSidebarOpen(false);
                }
            }}
            className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground',
                collapsed && 'justify-center px-2',
            )}
        >
            <item.icon className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground', 'w-[18px] h-[18px]')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
    );

    if (collapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
        );
    }
    return link;
}

export default function MinistrySidebar() {
    const { sidebarCollapsed, toggleCollapsed } = useUIStore();
    const { auth } = usePage<any>().props;
    const activeRole: string | null = auth?.user?.activeRole ?? null;

    const visibleGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => !item.roles || (activeRole && item.roles.includes(activeRole))),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <TooltipProvider delay={0}>
            <aside
                className={cn(
                    'flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 h-full',
                    'fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0',
                    sidebarCollapsed ? 'md:w-[60px] w-60' : 'w-60',
                    'md:transform-none',
                )}
            >
                {/* Logo */}
                <div className={cn('flex items-center h-16 px-4 border-b border-border', sidebarCollapsed && 'justify-center px-2')}>
                    <div className="flex items-center justify-center w-9 h-9 overflow-hidden shrink-0 rounded-md bg-white p-0.5 ring-1 ring-black/10">
                        <img src="/images/logo.png" alt="Syscend Campus" className="size-full object-contain [filter:none]" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="ml-2.5 font-bold text-foreground text-base tracking-tight">Syscend Campus</span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                    {visibleGroups.map((group) => (
                        <div key={group.title}>
                            {!sidebarCollapsed && (
                                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavLink key={item.href} item={item} collapsed={sidebarCollapsed} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={toggleCollapsed}
                    className="absolute -right-3 top-[1.625rem] flex items-center justify-center w-6 h-6 rounded-full border border-border bg-card shadow-sm hover:bg-accent transition-colors z-10"
                    aria-label="Toggle sidebar"
                >
                    {sidebarCollapsed
                        ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                    }
                </button>
            </aside>
        </TooltipProvider>
    );
}
