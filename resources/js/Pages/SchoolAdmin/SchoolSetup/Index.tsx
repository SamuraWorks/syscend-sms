import { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Fingerprint, CalendarDays, GraduationCap, Layers, BookOpen,
    Building2, BadgeCheck, Settings, BarChart3, Landmark, Plug,
    CalendarClock, Users, SlidersHorizontal, CheckCircle2, Lock,
    ArrowRight, Rocket, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/Types';

interface SchoolSetupPageProps extends PageProps {
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        temp_password?: string;
        show_credentials?: boolean;
        parent_name?: string;
    };
}

const ICON_MAP: Record<string, React.ElementType> = {
    Fingerprint, CalendarDays, GraduationCap, Layers, BookOpen,
    Building2, BadgeCheck, Settings, BarChart3, Landmark, Plug,
    CalendarClock, Users, SlidersHorizontal,
};

interface SetupStep {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: string;
    color: string;
    required: boolean;
    completed: boolean;
}

interface ProgressData {
    steps: SetupStep[];
    required_total: number;
    required_done: number;
    optional_total: number;
    optional_done: number;
    all_required: boolean;
    is_configured: boolean;
}

export default function SchoolSetupIndex() {
    const { flash } = usePage<SchoolSetupPageProps>().props;
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        fetch('/school/setup/progress')
            .then(r => r.json())
            .then(setProgress)
            .catch(() => {});
    }, []);

    if (!progress) {
        return (
            <AppLayout title="School Setup">
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
            </AppLayout>
        );
    }

    const requiredSteps = progress.steps.filter(s => s.required);
    const optionalSteps = progress.steps.filter(s => !s.required);
    const percent = progress.required_total > 0
        ? Math.round((progress.required_done / progress.required_total) * 100)
        : 0;

    // Find the first incomplete required step
    const currentStepIndex = requiredSteps.findIndex(s => !s.completed);

    function handleCompleteSetup() {
        setCompleting(true);
        router.post('/school/setup/complete', {}, {
            onFinish: () => setCompleting(false),
        });
    }

    function renderStep(step: SetupStep, index: number, isRequired: boolean) {
        const Icon = ICON_MAP[step.icon] || Settings;
        const isCompleted = step.completed;
        // For required steps: locked if any earlier required step is incomplete
        const stepPosition = requiredSteps.findIndex(s => s.id === step.id);
        const isLocked = isRequired && !isCompleted && currentStepIndex !== -1 && stepPosition > currentStepIndex;

        return (
            <div key={step.id} className="relative">
                {/* Connector line */}
                {index > 0 && isRequired && (
                    <div className={cn(
                        'absolute left-6 -top-3 w-0.5 h-3',
                        isCompleted ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700',
                    )} />
                )}

                <button
                    onClick={() => !isLocked && router.get(step.href)}
                    disabled={isLocked}
                    className={cn(
                        'w-full text-left rounded-xl border p-4 transition-all duration-150 group',
                        isCompleted
                            ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800/50 hover:shadow-md'
                            : isLocked
                                ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer',
                    )}
                >
                    <div className="flex items-start gap-4">
                        {/* Step number or check */}
                        <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm',
                            isCompleted
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                                : isLocked
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    : step.color,
                        )}>
                            {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6" />
                            ) : isLocked ? (
                                <Lock className="w-5 h-5" />
                            ) : (
                                <Icon className="w-5 h-5" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {isRequired && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Step {stepPosition + 1}
                                    </span>
                                )}
                                {!isRequired && (
                                    <Badge variant="outline" className="text-[10px] border-slate-300 dark:border-slate-600">
                                        Optional
                                    </Badge>
                                )}
                            </div>
                            <h3 className={cn(
                                'font-semibold mt-0.5',
                                isCompleted
                                    ? 'text-green-700 dark:text-green-400'
                                    : isLocked
                                        ? 'text-slate-400 dark:text-slate-500'
                                        : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                            )}>
                                {step.label}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {step.description}
                            </p>
                        </div>

                        <div className="shrink-0 self-center">
                            {isCompleted ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0 text-xs">
                                    Done
                                </Badge>
                            ) : isLocked ? (
                                <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-400">
                                    Locked
                                </Badge>
                            ) : (
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            )}
                        </div>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <AppLayout title="School Setup">
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">School Setup</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Complete each step in order. Your settings automatically flow to every module.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.warning && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                        {flash.warning}
                    </div>
                )}

                {/* Progress bar */}
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">Setup Progress</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {progress.required_done} of {progress.required_total} required steps completed
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    'text-3xl font-bold',
                                    percent === 100 ? 'text-green-600' : 'text-indigo-600',
                                )}>
                                    {percent}%
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    percent === 100 ? 'bg-green-500' : 'bg-indigo-500',
                                )}
                                style={{ width: `${percent}%` }}
                            />
                        </div>

                        {progress.optional_done > 0 && (
                            <p className="text-xs text-slate-400 mt-2">
                                {progress.optional_done} of {progress.optional_total} optional steps completed
                            </p>
                        )}
                    </CardContent>
                </Card>

                {progress.is_configured ? (
                    /* Already configured — show success */
                    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                        <CardContent className="p-6 text-center">
                            <Rocket className="w-12 h-12 mx-auto text-green-500 mb-3" />
                            <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Setup Complete</h3>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Your school is fully configured. All modules are ready to use.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Required steps */}
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Required Steps
                            </h2>
                            <div className="space-y-2">
                                {requiredSteps.map((step, idx) => renderStep(step, idx, true))}
                            </div>
                        </div>

                        {/* Complete setup button */}
                        {progress.all_required && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleCompleteSetup}
                                    disabled={completing}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 inline-flex items-center gap-2"
                                >
                                    <Rocket className="w-4 h-4" />
                                    {completing ? 'Completing...' : 'Complete Setup & Start Using'}
                                </Button>
                            </div>
                        )}

                        {/* Optional steps */}
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Optional Steps
                            </h2>
                            <div className="space-y-2">
                                {optionalSteps.map((step, idx) => renderStep(step, idx, false))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
