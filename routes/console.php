<?php

use App\Console\Commands\CheckEscalations;
use App\Console\Commands\ArchiveOldRecords;
use App\Console\Commands\ExpireSubscriptions;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(CheckEscalations::class)->everyFourHours();
Schedule::command(ArchiveOldRecords::class)->monthly();
Schedule::command(ExpireSubscriptions::class)->daily();
