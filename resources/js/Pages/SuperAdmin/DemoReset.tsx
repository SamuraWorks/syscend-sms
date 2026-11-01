import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function DemoReset() {
    const { post, processing, data, setData } = useForm({ confirm: false });
    const [confirmed, setConfirmed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmed) return;
        setData('confirm', true);
        setTimeout(() => post('/super-admin/demo-reset'), 0);
    };

    return (
        <AppLayout title="Demo Environment Reset">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Demo Environment Reset
                        </CardTitle>
                        <CardDescription>
                            This will wipe all operational data and re-seed the platform with the official
                            Freetown International Academy demo environment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">What this does:</h4>
                            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                                <li>• Removes ALL schools, users, students, staff, and operational data</li>
                                <li>• Re-creates Freetown International Academy with full demo data</li>
                                <li>• Preserves the Super Admin account (syscend@gmail.com)</li>
                                <li>• Cannot be undone</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Preserved Credentials
                            </h4>
                            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1 font-mono">
                                <p>Super Admin: syscend@gmail.com / Demo@123</p>
                                <p>School Admin: mohamed.sesay@freetownacademy.edu / Demo@123</p>
                                <p>Principal: fatima.bangura@freetownacademy.edu / Demo@123</p>
                                <p>Teacher: amara.kamara@freetownacademy.edu / Demo@123</p>
                                <p>Student: Ibrahim Bangura (Primary 4A)</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) => setConfirmed(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium">
                                    I understand this will destroy all existing data
                                </span>
                            </label>

                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={!confirmed || processing}
                                className="w-full"
                            >
                                {processing ? (
                                    <>
                                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                                        Resetting... This may take up to 30 seconds
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Reset Demo Environment
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
