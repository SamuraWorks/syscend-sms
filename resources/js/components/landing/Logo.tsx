import { cn } from '@/lib/utils';

export default function Logo({
    className,
    showWordmark = true,
    tone = 'dark',
}: {
    className?: string;
    showWordmark?: boolean;
    tone?: 'dark' | 'light';
}) {
    const light = tone === 'light';

    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center">
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-white drop-shadow-md [mask-image:url('/images/logo.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                />
                <img
                    src="/images/logo.png"
                    alt="Syscend Campus"
                    className="relative h-full w-full object-contain [filter:none]"
                    draggable={false}
                />
            </span>
            {showWordmark && (
                <span
                    className={cn(
                        'text-xl font-bold tracking-tight',
                        light ? 'text-white' : 'text-foreground',
                    )}
                >
                    Syscend Campus
                </span>
            )}
        </span>
    );
}
