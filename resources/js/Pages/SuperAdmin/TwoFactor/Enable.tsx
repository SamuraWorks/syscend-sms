import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

export default function TwoFactorEnable({ qrCodeUrl, secret }: { qrCodeUrl: string; secret: string }) {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/super-admin/2fa/enable');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Head title="Enable Two-Factor Authentication" />
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
                    <CardTitle className="mt-2">Enable Two-Factor Authentication</CardTitle>
                    <CardDescription>Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center gap-3 mb-5">
                        <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-white" />
                        <div className="text-center">
                            <p className="text-xs text-slate-500 mb-1">Can't scan? Enter this manual key:</p>
                            <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded break-all">{secret}</code>
                        </div>
                        <Button type="button" variant="link" size="sm" className="text-xs" onClick={() => navigator.clipboard?.writeText(secret).catch(() => undefined)}>
                            Copy secret
                        </Button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="code">Verification Code</Label>
                            <Input id="code" type="text" maxLength={6} placeholder="000000" value={data.code} onChange={e => setData('code', e.target.value)} className="text-center text-2xl tracking-[0.5em]" autoFocus />
                            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={processing}>Confirm &amp; Enable</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}