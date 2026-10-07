<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Bridges stored files to code that needs a real local path (PhpSpreadsheet,
 * dompdf, etc.). On the local driver we return the on-disk path directly; on
 * remote drivers (S3/FTP/SFTP) the file is streamed to a temporary file that
 * callers are expected to read and may leave to the OS cleanup.
 */
class StoredFile
{
    public static function localPath(string $path, string $disk = 'private'): string
    {
        $driver = config("filesystems.disks.{$disk}.driver", 'local');
        $storage = Storage::disk($disk);

        if ($driver === 'local') {
            return $storage->path($path);
        }

        if (! $storage->exists($path)) {
            throw new RuntimeException("File not found on {$disk} disk: {$path}");
        }

        $extension = pathinfo($path, PATHINFO_EXTENSION) ?: 'bin';
        $tmp = tempnam(sys_get_temp_dir(), 'syc_');

        if ($tmp === false) {
            throw new RuntimeException('Unable to create a temporary file for the import.');
        }

        $tmp .= '.' . $extension;

        $contents = $storage->get($path);

        if ($contents === null) {
            throw new RuntimeException("Unable to read file from {$disk} disk: {$path}");
        }

        if (file_put_contents($tmp, $contents) === false) {
            throw new RuntimeException("Unable to write temporary file for import: {$tmp}");
        }

        return $tmp;
    }
}