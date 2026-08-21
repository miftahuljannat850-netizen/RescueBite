<?php

use App\Models\Donation;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('rescuebite:about', function (): void {
    $this->info('RescueBite Checkpoint 2 API');
})->purpose('Display RescueBite API information');

Artisan::command('rescuebite:db-check', function (): void {
    // Raw SQL through Laravel DB Facade
    $databaseName = DB::connection()->getDatabaseName();

    $ngoUsers = DB::select(
        'SELECT id, name, email FROM users WHERE role = ?',
        ['ngo']
    );

    // Eloquent ORM
    $userCount = User::count();
    $donationCount = Donation::count();

    $donor = User::where('role', 'donor')
        ->withCount('donations')
        ->first();

    $this->info('RescueBite Database Check');
    $this->line('-------------------------');
    $this->line('Connection: OK');
    $this->line('Driver: ' . DB::connection()->getDriverName());
    $this->line('Database: ' . $databaseName);
    $this->line('Users: ' . $userCount);
    $this->line('NGO users (raw SQL): ' . count($ngoUsers));
    $this->line('Donations: ' . $donationCount);

    if ($donor) {
        $this->line(
            'First donor: ' .
            $donor->name .
            ' | Donations: ' .
            $donor->donations_count
        );
    }

    $this->newLine();
    $this->info('Database integration is working successfully.');
})->purpose('Verify RescueBite MySQL, raw SQL, and Eloquent integration');