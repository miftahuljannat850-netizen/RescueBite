<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseIntegrationCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_check_command_verifies_database_integration(): void
    {
        $donor = User::create([
            'name' => 'Test Donor',
            'email' => 'donor@test.local',
            'password' => bcrypt('password'),
            'role' => 'donor',
        ]);

        User::create([
            'name' => 'Test NGO',
            'email' => 'ngo@test.local',
            'password' => bcrypt('password'),
            'role' => 'ngo',
            'beneficiary_preference' => 'human',
        ]);

        Donation::create([
            'user_id' => $donor->id,
            'food' => 'Cooked meals',
            'quantity' => '10 servings',
            'beneficiary_type' => 'human',
            'pickup_deadline' => now()->addHours(4),
            'address' => 'Dhaka',
            'status' => 'available',
        ]);

        $exitCode = Artisan::call('rescuebite:db-check');
        $output = Artisan::output();

        $this->assertSame(0, $exitCode);
        $this->assertStringContainsString('Connection: OK', $output);
        $this->assertStringContainsString('Users: 2', $output);
        $this->assertStringContainsString('NGO users (raw SQL): 1', $output);
        $this->assertStringContainsString('Donations: 1', $output);
        $this->assertStringContainsString(
            'First donor: Test Donor | Donations: 1',
            $output
        );
    }
}