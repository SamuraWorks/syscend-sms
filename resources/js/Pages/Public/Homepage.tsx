import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import OfflineSection from '@/components/landing/OfflineSection';
import Modules from '@/components/landing/Modules';
import Comparison from '@/components/landing/Comparison';
import AcademicStructure from '@/components/landing/AcademicStructure';
import Exams from '@/components/landing/Exams';
import MultiSchool from '@/components/landing/MultiSchool';
import Roles from '@/components/landing/Roles';
import VisionMission from '@/components/landing/VisionMission';
import MinistryPortal from '@/components/landing/MinistryPortal';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import Steps from '@/components/landing/Steps';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Reveal from '@/components/ui/reveal';

export default function Homepage() {
    return (
        <div className="landing">
            <Head title="Syscend Campus — School Management Platform for Sierra Leone" />
            <SiteHeader />
            <main>
                <Hero />
                <Reveal><Stats /></Reveal>
                <Reveal><OfflineSection /></Reveal>
                <Reveal><Modules /></Reveal>
                <Reveal><Comparison /></Reveal>
                <Reveal><AcademicStructure /></Reveal>
                <Reveal><Exams /></Reveal>
                <Reveal><MultiSchool /></Reveal>
                <Reveal><Roles /></Reveal>
                <Reveal><VisionMission /></Reveal>
                <Reveal><MinistryPortal /></Reveal>
                <Reveal><Testimonials /></Reveal>
                <Reveal><Pricing /></Reveal>
                <Reveal><Steps /></Reveal>
                <Reveal><FAQ /></Reveal>
                <Reveal><CTA /></Reveal>
            </main>
            <SiteFooter />
        </div>
    );
}