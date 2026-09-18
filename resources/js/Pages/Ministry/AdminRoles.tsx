import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Shield } from 'lucide-react';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

interface Props {
    roles: Role[];
}

export default function MinistryAdminRoles({ roles }: Props) {
    return (
        <MinistryLayout title="Roles & Permissions">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-primary" />
                        Roles & Permissions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        System roles and access control configuration
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Total Roles</p>
                            <p className="text-2xl font-bold text-foreground">{roles.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Guard</p>
                            <p className="text-2xl font-bold text-foreground">
                                {roles.length > 0 ? roles[0].guard_name : '—'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {roles.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <KeyRound className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground">No roles configured yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map((role) => (
                            <Card key={role.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-lg shrink-0 text-primary bg-primary/10">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-serif font-semibold text-foreground mb-1">{role.name}</h3>
                                            <Badge variant="outline" className="text-[10px] mb-2">
                                                {role.guard_name}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                Created {new Date(role.created_at).toLocaleDateString('en-SL', {
                                                    year: 'numeric', month: 'long', day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MinistryLayout>
    );
}
