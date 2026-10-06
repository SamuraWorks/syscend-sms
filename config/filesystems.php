<?php

/*
|--------------------------------------------------------------------------
| Storage driver selection
|--------------------------------------------------------------------------
|
| STORAGE_DRIVER=local writes to the (read only friendly) local filesystem
| and is what development uses. STORAGE_DRIVER=s3 flips the "local",
| "private" and "public" disks onto the S3 compatible object store, which
| is required wherever the filesystem is ephemeral or read only - the
| individual disk drivers can still be overridden with
| LOCAL_DISK_DRIVER / PRIVATE_DISK_DRIVER / PUBLIC_DISK_DRIVER.
|
| The extra S3 keys are always present on every disk; they are simply
| ignored while a disk runs on the local driver, and keeping them flat
| avoids conditionals that could not survive config:cache.
|
*/

$storageDriver = env('STORAGE_DRIVER', 'local');

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => env('LOCAL_DISK_DRIVER', $storageDriver),
            'root' => env('LOCAL_DISK_DRIVER', $storageDriver) === 's3' ? '' : storage_path('app/private'),
            'serve' => env('LOCAL_DISK_DRIVER', $storageDriver) !== 's3',
            'throw' => false,
            'report' => false,
        ],

        'private' => [
            'driver' => env('PRIVATE_DISK_DRIVER', $storageDriver),
            'root' => env('PRIVATE_DISK_DRIVER', $storageDriver) === 's3' ? '' : storage_path('app/private'),
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'eu-west-1'),
            'bucket' => env('AWS_BUCKET'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => env('PUBLIC_DISK_DRIVER', $storageDriver),
            'root' => env('PUBLIC_DISK_DRIVER', $storageDriver) === 's3'
                ? env('AWS_PUBLIC_PREFIX', '')
                : storage_path('app/public'),
            'url' => env('PUBLIC_DISK_DRIVER', $storageDriver) === 's3'
                ? env('AWS_PUBLIC_URL')
                : rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'eu-west-1'),
            'bucket' => env('AWS_BUCKET'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | The symbolic links that will be created when the `storage:link`
    | Artisan command is executed. On object storage the public disk
    | already exposes its own URL, so the link is not used there.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
