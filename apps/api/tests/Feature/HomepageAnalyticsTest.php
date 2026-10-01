<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\PickupTask;
use App\Models\RescueRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HomepageAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_homepage_analytics_returns_database_counts(): void
    {
        $donor = $this->createUser('donor', 'approved');
        $this->createUser('ngo', 'approved', 'animal');
        $this->createUser('ngo', 'approved', 'both');
        $this->createUser('ngo', 'pending', 'animal');
        $volunteer = $this->createUser('volunteer', 'approved');

        $availableDonation = $this->createDonation($donor, 'available', 'human', now()->addHours(3));
        $pendingDonation = $this->createDonation($donor, 'requested', 'animal', now()->addHours(36));
        $approvedDonation = $this->createDonation($donor, 'ready_for_pickup', 'human', now()->addHours(48));
        $completedDonation = $this->createDonation($donor, 'completed', 'human', now()->addHours(2));
        $this->createDonation($donor, 'expired', 'animal', now()->subHour());

        $this->createRequest($pendingDonation, $this->findNgo('animal'), 'pending');
        $this->createRequest($approvedDonation, $this->findNgo('both'), 'approved');
        $completedRequest = $this->createRequest($completedDonation, $this->findNgo('both'), 'completed');
        PickupTask::create([
            'rescue_request_id' => $completedRequest->id,
            'volunteer_id' => $volunteer->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->getJson('/api/homepage/analytics')
            ->assertOk()
            ->assertJsonPath('stats.active_rescues', 3)
            ->assertJsonPath('stats.human_food', 3)
            ->assertJsonPath('stats.expiring_soon', 1)
            ->assertJsonPath('stats.animal_shelters', 2)
            ->assertJsonPath('stats.approved_volunteers', 1)
            ->assertJsonPath('top_volunteers.0.name', 'Volunteer')
            ->assertJsonPath('top_volunteers.0.completed_deliveries', 1)
            ->assertJsonPath('chart.delivered', 1)
            ->assertJsonPath('chart.received_by_ngos', 1)
            ->assertJsonPath('chart.pending_available', 2)
            ->assertJsonPath('impact.completed_donations', 1)
            ->assertJsonPath('impact.meals', 5)
            ->assertJsonPath('impact.waste', 1)
            ->assertJsonPath('impact.co2', 3);
    }

    private function createUser(string $role, string $approvalStatus, ?string $preference = null): User
    {
        return User::create([
            'name' => ucfirst($role),
            'email' => uniqid($role.'-', true).'@analytics.test',
            'password' => Hash::make('password'),
            'role' => $role,
            'approval_status' => $approvalStatus,
            'beneficiary_preference' => $preference,
        ]);
    }

    private function findNgo(string $preference): User
    {
        return User::query()->where('role', 'ngo')->where('beneficiary_preference', $preference)->firstOrFail();
    }

    private function createDonation(User $donor, string $status, string $beneficiaryType, $pickupDeadline): Donation
    {
        return Donation::create([
            'user_id' => $donor->id,
            'food' => 'Analytics test food',
            'quantity' => '5 servings',
            'beneficiary_type' => $beneficiaryType,
            'pickup_deadline' => $pickupDeadline,
            'address' => 'Dhaka',
            'status' => $status,
        ]);
    }

    private function createRequest(Donation $donation, User $ngo, string $status): RescueRequest
    {
        return RescueRequest::create([
            'donation_id' => $donation->id,
            'ngo_id' => $ngo->id,
            'status' => $status,
            'requested_at' => now(),
        ]);
    }
}