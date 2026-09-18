const STATS = [
    { value: '20+', label: 'Modules in one platform' },
    { value: '1', label: 'Shared database per school' },
    { value: '3', label: 'National exams: NPSE, BECE, WASSCE' },
    { value: '13', label: 'Roles, from teacher to Ministry' },
];

export default function Stats() {
    return (
        <section className="border-y border-slate-200 bg-white">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-6 lg:grid-cols-4 lg:px-10">
                {STATS.map((stat) => (
                    <div key={stat.label} className="px-6 py-10 text-center sm:py-12">
                        <div className="text-3xl font-extrabold tracking-tight text-[#1f66f5] sm:text-4xl">
                            {stat.value}
                        </div>
                        <p className="mx-auto mt-2 max-w-[18ch] text-balance text-sm leading-snug text-slate-500">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}