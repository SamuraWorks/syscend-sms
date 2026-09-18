import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function ContactCTA({
    heading = 'See it with your own records',
    text = 'Book a short demo and we\'ll set everything up before you look — around your class groups, your fees, your exams.',
}: {
    heading?: string;
    text?: string;
}) {
    return (
        <section className="mt-16 rounded-2xl border border-slate-200 bg-[#f4f7fb] p-8 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{heading}</h2>
            <p className="mt-3 text-muted-foreground">{text}</p>
            <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-[8px] bg-[#1f66f5] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#174ed7]"
            >
                Talk to us
                <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
        </section>
    );
}