import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { Baby, CalendarCheck, MessageCircleHeart, Palette, HeartPulse, Image } from 'lucide-react';

const features = [
    {
        icon: Baby,
        title: 'Developmental Tracking',
        desc: 'Monitor motor, cognitive, and social milestones for every child. Keep parents informed with regular progress updates.',
    },
    {
        icon: CalendarCheck,
        title: 'Attendance',
        desc: 'Quick daily check-in and check-out with instant parent notifications so families always know their child is safe.',
    },
    {
        icon: MessageCircleHeart,
        title: 'Parent Communication',
        desc: 'Share announcements, messages, and updates directly with parents through the platform. No more lost notes.',
    },
    {
        icon: Palette,
        title: 'Activity Planning',
        desc: 'Plan, schedule, and record daily activities and themes, matched to what the nursery class is working on.',
    },
    {
        icon: HeartPulse,
        title: 'Health Records',
        desc: 'Track immunisations, allergies, medications, and health screenings in a secure, accessible record for each child.',
    },
    {
        icon: Image,
        title: 'Photo & Media Sharing',
        desc: 'Share photos and videos of classroom moments with parents securely, keeping memories and milestones alive.',
    },
];

export default function SolutionsNursery() {
    return (
        <div className="landing">
            <Head title="Nursery School Management — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Solutions</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Nursery School Management
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Designed for early childhood education centres. Track developmental milestones,
                            attendance, and parent communication for children ages 3&ndash;5.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="rounded-md border border-border bg-card p-6 transition-colors hover:border-primary/20"
                            >
                                <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                    <f.icon className="size-5" />
                                </span>
                                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                    <ContactCTA />
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
