import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';

export default function TwoFactorVerify() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/super-admin/2fa/verify');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Head title="Two-Factor Authentication" />
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <ShieldCheck className="h-12 w-12 mx-auto text-primary" />
                    <CardTitle className="mt-2">Two-Factor Authentication</CardTitle>
                    <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="code">Verification Code</Label>
                            <Input id="code" type="text" maxLength={6} placeholder="000000" value={data.code} onChange={e => setData('code', e.target.value)} className="text-center text-2xl tracking-[0.5em]" autoFocus />
                            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={processing}>Verify</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
