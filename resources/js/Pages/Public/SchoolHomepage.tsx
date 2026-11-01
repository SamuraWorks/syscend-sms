import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { GraduationCap, MapPin, Phone, Mail, LogIn, UserPlus, ArrowRight, School as SchoolIcon } from 'lucide-react';

interface SchoolPublicProfile {
    id: number;
    name: string;
    short_name: string | null;
    slug: string;
    motto: string | null;
    tagline: string | null;
    footer_text: string | null;
    logo_url: string | null;
    badge_url: string | null;
    banner_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    about_school: string | null;
    school_mission: string | null;
    school_vision: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
}

interface Props {
    school: SchoolPublicProfile;
}

function hexToRgb(hex: string, alpha: number): string {
    const m = hex.replace('#', '');
    if (m.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export default function SchoolHomepage({ school }: Props) {
    const primary = school.primary_color ?? '#1e40af';
    const secondary = school.secondary_color ?? '#f59e0b';
    const name = school.short_name || school.name;

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--school-primary', primary);
        root.style.setProperty('--school-primary-strong', hexToRgb(primary, 0.1));
        root.style.setProperty('--school-secondary', secondary);
    }, [primary, secondary]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title={school.name} />

            {/* Top accent */}
            <div className="h-1.5" style={{ backgroundColor: primary }} />

            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        {school.logo_url ? (
                            <img src={school.logo_url} alt={name} className="h-10 w-10 object-contain" />
                        ) : (
                            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary }}>
                                <SchoolIcon className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div>
                            <div className="font-bold text-lg leading-tight">{school.name}</div>
                            {school.tagline && <div className="text-xs text-slate-500">{school.tagline}</div>}
                        </div>
                    </Link>
                    <nav className="hidden sm:flex items-center gap-2">
                        <Link href={`/${school.slug}/login`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
                            style={{ backgroundColor: primary }}>
                            <LogIn className="h-4 w-4" /> Login
                        </Link>
                        <Link href={`/${school.slug}/register`} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50">
                            <UserPlus className="h-4 w-4" /> Register
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="relative">
                {school.banner_url ? (
                    <img src={school.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="relative" style={{ backgroundColor: school.banner_url ? 'rgba(2,6,23,0.72)' : primary }}>
                    <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center text-white">
                        <div className="flex items-center justify-center mb-6">
                            {school.badge_url ? (
                                <img src={school.badge_url} alt="Badge" className="h-24 w-24 object-contain" />
                            ) : (
                                <div className="h-24 w-24 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur">
                                    <GraduationCap className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{school.name}</h1>
                        <p className="mt-4 text-lg sm:text-xl text-blue-50/90">{school.motto || school.tagline || 'Welcome to our school'}</p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            {school.about_school ? (
                                <Link href="#about" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold"
                                    style={{ backgroundColor: secondary, color: '#1e293b' }}>
                                    Learn More <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : null}
                            <Link href={`/${school.slug}/register`} className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100">
                                <UserPlus className="h-4 w-4" /> Register / Verify
                            </Link>
                            <Link href={`/apply/${school.id}`} className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold ring-1 ring-white/50 hover:bg-white/10">
                                Admission Inquiry <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* About / Mission / Vision */}
            <main className="max-w-6xl mx-auto px-4 py-16">
                {school.about_school ? (
                    <section id="about" className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: primary }}>About {name}</h2>
                        <p className="mt-4 text-slate-600 leading-relaxed">{school.about_school}</p>
                    </section>
                ) : null}

                {(school.school_mission || school.school_vision) ? (
                    <section className="mt-14 grid sm:grid-cols-2 gap-6">
                        {school.school_mission ? (
                            <div className="rounded-2xl bg-white border border-slate-200 p-8">
                                <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: hexToRgb(primary, 0.1) }}>
                                    <GraduationCap className="h-6 w-6" style={{ color: primary }} />
                                </div>
                                <h3 className="text-lg font-bold">Our Mission</h3>
                                <p className="mt-2 text-slate-600 leading-relaxed">{school.school_mission}</p>
                            </div>
                        ) : null}
                        {school.school_vision ? (
                            <div className="rounded-2xl bg-white border border-slate-200 p-8">
                                <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: hexToRgb(primary, 0.1) }}>
                                    <GraduationCap className="h-6 w-6" style={{ color: primary }} />
                                </div>
                                <h3 className="text-lg font-bold">Our Vision</h3>
                                <p className="mt-2 text-slate-600 leading-relaxed">{school.school_vision}</p>
                            </div>
                        ) : null}
                    </section>
                ) : null}

                {/* Contact */}
                {(school.address || school.phone || school.email) ? (
                    <section className="mt-14 rounded-2xl p-8" style={{ backgroundColor: hexToRgb(primary, 0.08) }}>
                        <h2 className="text-xl font-bold mb-6" style={{ color: primary }}>Contact Us</h2>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm">
                            {school.address ? (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: primary }} />
                                    <span>{[school.address, [school.city, school.state].filter(Boolean).join(', ')].filter(Boolean).join(', ')}</span>
                                </div>
                            ) : null}
                            {school.phone ? (
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 mt-0.5 shrink-0" style={{ color: primary }} />
                                    <a href={`tel:${school.phone}`} className="hover:underline">{school.phone}</a>
                                </div>
                            ) : null}
                            {school.email ? (
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 mt-0.5 shrink-0" style={{ color: primary }} />
                                    <a href={`mailto:${school.email}`} className="hover:underline">{school.email}</a>
                                </div>
                            ) : null}
                        </div>
                    </section>
                ) : null}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                        {school.logo_url ? (
                            <img src={school.logo_url} alt="" className="h-5 w-5 object-contain" />
                        ) : (
                            <SchoolIcon className="h-5 w-5" style={{ color: primary }} />
                        )}
                        {name}
                    </div>
                    <div>{school.footer_text}</div>
                </div>
            </footer>
        </div>
    );
}