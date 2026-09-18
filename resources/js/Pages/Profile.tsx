import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CheckCircle, Shield, Mail, Phone } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import { useState } from 'react';

interface AuthUser {
    id: number; name: string; email: string; phone: string | null;
    role: string; avatar: string | null; avatar_url: string | null; created_at: string;
}
interface Props { user: AuthUser; }

export default function Profile({ user }: Props) {
    const profileForm = useForm({
        name:  user.name,
        email: user.email,
        phone: user.phone ?? '',
    });

    const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.put('/profile');
    }

    const roleLabel = (user.role ?? '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <AppLayout title="Profile">
            <div className="max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your account information and photo</p>
                </div>

                {/* Photo upload + role banner */}
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <ProfilePhotoUpload
                                currentAvatarUrl={avatarUrl}
                                userName={user.name}
                                onPhotoUpdated={setAvatarUrl}
                            />
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
                                    <Mail className="w-3.5 h-3.5" /> {user.email}
                                </p>
                                {user.phone && (
                                    <p className="text-sm text-slate-500 flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
                                        <Phone className="w-3.5 h-3.5" /> {user.phone}
                                    </p>
                                )}
                                <span className="inline-flex items-center gap-1 mt-2 text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
                                    <Shield className="w-3 h-3" /> {roleLabel}
                                </span>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                    Member since {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="w-4 h-4 text-indigo-500" /> Personal Information
                        </CardTitle>
                        <CardDescription>Update your name, email, and phone number.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitProfile} className="space-y-4">
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    value={profileForm.data.name}
                                    onChange={e => profileForm.setData('name', e.target.value)}
                                    placeholder="Your full name"
                                />
                                {profileForm.errors.name && (
                                    <p className="text-xs text-red-500 mt-1">{profileForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <Label>Email Address *</Label>
                                <Input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={e => profileForm.setData('email', e.target.value)}
                                    placeholder="your@email.com"
                                />
                                {profileForm.errors.email && (
                                    <p className="text-xs text-red-500 mt-1">{profileForm.errors.email}</p>
                                )}
                            </div>
                            <div>
                                <Label>Phone Number</Label>
                                <Input
                                    value={profileForm.data.phone}
                                    onChange={e => profileForm.setData('phone', e.target.value)}
                                    placeholder="+232 XX XXX XXXX"
                                />
                                {profileForm.errors.phone && (
                                    <p className="text-xs text-red-500 mt-1">{profileForm.errors.phone}</p>
                                )}
                            </div>
                            <Button type="submit" disabled={profileForm.processing} className="gap-2">
                                <CheckCircle className="w-4 h-4" /> Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
