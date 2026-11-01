import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/Types';

const WARNING_DAYS = 7;

function daysUntil(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    return Number.isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function LicenseBanner() {
    const { subscription } = usePage<PageProps>().props;

    if (!subscription) return null;

    const { status, is_trial, is_fully_paid, balance, trial_ends_at, currency_symbol } = subscription;
    const symbol = currency_symbol ?? 'Le';

    let tone: 'danger' | 'warning' | 'notice' | null = null;
    let message = '';

    if (status === 'expired' || status === 'suspended') {
        tone = 'danger';
        message = `Your school subscription is ${status}. Please contact the platform administrator to renew it.`;
    } else if (status === 'trial') {
        const daysLeft = daysUntil(trial_ends_at);
        if (daysLeft !== null && daysLeft <= WARNING_DAYS) {
            tone = 'warning';
            message = daysLeft <= 0
                ? 'Your trial period has ended. Please contact the platform administrator to set up your subscription.'
                : `Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${formatDate(trial_ends_at)}).`;
        }
    } else if (status === 'active' && !is_fully_paid && balance > 0) {
        tone = 'notice';
        message = `Outstanding balance of ${symbol}${balance.toLocaleString()} on your subscription. Please settle to keep it active.`;
    }

    if (!tone) return null;

    const tones = {
        danger:  'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
        warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
        notice:  'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
    };

    return (
        <div className={cn('border-b px-4 py-2 text-center text-xs font-medium shrink-0', tones[tone])}>
            {message}
        </div>
    );
}