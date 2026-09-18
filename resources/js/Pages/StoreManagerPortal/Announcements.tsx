import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Megaphone } from 'lucide-react';

interface Announcement {
    id: number; title: string; message: string;
    priority: string; created_at: string;
}
interface Props {
    linked: boolean; announcements: Announcement[];
}

export default function Announcements({ linked, announcements }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Announcements">
                <div className="text-center py-12 text-muted-foreground">Access denied.</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Announcements">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <Megaphone className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Announcements</h2>
                        <p className="text-muted-foreground text-sm">School-wide announcements</p>
                    </div>
                </div>

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No announcements at this time.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((a) => (
                            <Card key={a.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{a.title}</CardTitle>
                                        <Badge variant={a.priority === 'high' ? 'destructive' : a.priority === 'medium' ? 'default' : 'secondary'}>
                                            {a.priority}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{a.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {new Date(a.created_at).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
