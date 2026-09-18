import { Quote, Star } from 'lucide-react';

const TESTIMONIALS = [
    {
        quote:
            'Before, three teachers held the registers and nobody knew where anything was. Now the marks, fees and report cards come from the same system. It is the first real change we have made.',
        name: 'Mariama K.',
        role: 'Principal, Primary School, Freetown',
    },
    {
        quote:
            'We run an entire school group — four campuses, six hundred pupils. The Ministry figures we used to struggle with for weeks now come out of a report.',
        name: 'David A.',
        role: 'Director, Combined School Group, Bo',
    },
    {
        quote:
            'I can see my daughter\'s attendance and results from my phone. No more waiting for term-end or wondering whether the fee I paid was recorded.',
        name: 'Esther T.',
        role: 'Parent, Secondary School, Kenema',
    },
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        Testimonials
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Trusted by schools serious about their records.
                    </h2>
                </div>

                <div className="reveal-grid mt-14 grid gap-6 lg:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <figure
                            key={t.name}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-[#f4f7fb] p-7"
                        >
                            <div className="flex items-center justify-between">
                                <Quote className="size-6 text-[#1f66f5]" aria-hidden="true" />
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                                    ))}
                                </div>
                            </div>
                            <blockquote className="mt-5 flex-1 text-pretty text-sm leading-relaxed text-slate-700">
                                &ldquo;{t.quote}&rdquo;
                            </blockquote>
                            <figcaption className="mt-6 border-t border-slate-200 pt-4">
                                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{t.role}</p>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}