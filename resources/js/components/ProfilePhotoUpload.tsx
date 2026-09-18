import { useCallback, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Camera, Trash2, Upload, Loader2, X } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfilePhotoUploadProps {
    currentAvatarUrl: string | null;
    userName: string;
    onPhotoUpdated?: (url: string | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePhotoUpload({
    currentAvatarUrl,
    userName,
    onPhotoUpdated,
}: ProfilePhotoUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = useCallback((file: File): boolean => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Please upload a JPG, PNG, or WebP image.');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image must be smaller than 5MB.');
            return false;
        }
        return true;
    }, []);

    const handleFile = useCallback((file: File) => {
        if (!validateFile(file)) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, [validateFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('photo', selectedFile);
            const res = await axios.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setPreview(null);
                setSelectedFile(null);
                onPhotoUpdated?.(res.data.avatar_url);
                router.reload();
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Upload failed. Please try again.';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    }, [selectedFile, onPhotoUpdated]);

    const handleDelete = useCallback(async () => {
        setUploading(true);
        try {
            const res = await axios.delete('/profile/photo');
            if (res.data.success) {
                toast.success(res.data.message);
                setPreview(null);
                setSelectedFile(null);
                onPhotoUpdated?.(null);
                router.reload();
            }
        } catch (err: any) {
            toast.error('Failed to remove photo.');
        } finally {
            setUploading(false);
        }
    }, [onPhotoUpdated]);

    const handleCancel = useCallback(() => {
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const displayUrl = preview ?? currentAvatarUrl;

    return (
        <div className="space-y-4">
            {/* Current avatar + overlay */}
            <div className="relative inline-block">
                <ProfileAvatar
                    src={displayUrl}
                    name={userName}
                    size="2xl"
                    showRing
                />
                {!selectedFile && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                )}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleInputChange}
                className="hidden"
            />

            {/* Drop zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                    isDragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600',
                    selectedFile && 'pointer-events-none opacity-50',
                )}
            >
                <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Drag and drop a photo, or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    JPG, PNG or WebP. Max 5MB.
                </p>
            </div>

            {/* Action buttons */}
            {selectedFile && (
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="gap-2"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? 'Uploading…' : 'Upload Photo'}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploading}
                        className="gap-2"
                    >
                        <X className="w-4 h-4" /> Cancel
                    </Button>
                </div>
            )}

            {/* Delete existing photo */}
            {currentAvatarUrl && !selectedFile && (
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={uploading}
                    className="gap-2"
                >
                    <Trash2 className="w-4 h-4" /> Remove Photo
                </Button>
            )}
        </div>
    );
}
