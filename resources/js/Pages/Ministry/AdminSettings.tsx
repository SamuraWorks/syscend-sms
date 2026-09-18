import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Globe, Clock, DollarSign, Server } from 'lucide-react';

interface SettingsData {
    app_name: string;
    app_env: string;
    timezone: string;
    currency: string;
}

interface Props {
    settings: SettingsData;
}

const ENV_BADGE: Record<string, string> = {
    production: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    local: 'bg-amber-50 text-amber-700 border-amber-200',
    staging: 'bg-blue-50 text-blue-700 border-blue-200',
    testing: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function MinistryAdminSettings({ settings }: Props) {
    return (
        <MinistryLayout title="Settings">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Settings className="w-6 h-6 text-primary" />
                        Settings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        System configuration and application settings
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-sans font-semibold text-muted-foreground flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Application
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm font-sans text-muted-foreground">App Name</span>
                                <span className="text-sm font-sans font-medium text-foreground">{settings.app_name}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm font-sans text-muted-foreground">Environment</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ENV_BADGE[settings.app_env] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                    {settings.app_env}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-sans font-semibold text-muted-foreground flex items-center gap-2">
                                <Server className="w-4 h-4" />
                                System
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm font-sans text-muted-foreground">Timezone</span>
                                <span className="text-sm font-sans font-medium text-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                    {settings.timezone}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-sm font-sans text-muted-foreground">Currency</span>
                                <span className="text-sm font-sans font-medium text-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                                    {settings.currency}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MinistryLayout>
    );
}
