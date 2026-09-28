<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\PickupTask;
use App\Models\RescueRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class VolunteerDeliveryCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_delivering_a_pickup_completes_the_rescue_workflow(): void
    {
        $volunteer = User::create([
            'name' => 'Volunteer',
            'email' => 'volunteer@test.local',
            'password' => Hash::make('password'),
            'role' => 'volunteer',
            'api_token_hash' => hash('sha256', 'volunteer-token'),
            'approval_status' => 'approved',
        ]);
        $donor = User::create([
            'name' => 'Donor',
            'email' => 'donor@test.local',
            'password' => Hash::make('password'),
            'role' => 'donor',
        ]);
        $ngo = User::create([
            'name' => 'NGO',
            'email' => 'ngo@test.local',
            'password' => Hash::make('password'),
            'role' => 'ngo',
        ]);

        $donation = Donation::create([
            'user_id' => $donor->id,
            'food' => 'Biryani',
            'quantity' => '10 servings',
            'beneficiary_type' => 'human',
            'pickup_deadline' => now()->addDay(),
            'address' => 'Dhaka',
            'status' => 'ready_for_pickup',
        ]);
        $rescueRequest = RescueRequest::create([
            'donation_id' => $donation->id,
            'ngo_id' => $ngo->id,
            'status' => 'approved',
            'requested_at' => now()->subHour(),
        ]);
        $task = PickupTask::create([
            'rescue_request_id' => $rescueRequest->id,
            'volunteer_id' => $volunteer->id,
            'status' => 'picked_up',
            'assigned_at' => now()->subHour(),
            'picked_up_at' => now()->subMinutes(30),
        ]);

        $response = $this->withToken('volunteer-token')->patchJson(
            "/api/volunteer/tasks/{$task->id}",
            ['status' => 'delivered']
        );

        $response
            ->assertOk()
            ->assertJsonPath('task.status', 'completed')
            ->assertJsonPath('task.delivered_at', fn ($value) => $value !== null)
            ->assertJsonPath('task.completed_at', fn ($value) => $value !== null);

        $this->assertDatabaseHas('pickup_tasks', [
            'id' => $task->id,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('rescue_requests', [
            'id' => $rescueRequest->id,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('donations', [
            'id' => $donation->id,
            'status' => 'completed',
        ]);

        $completedTask = $task->fresh();
        $this->assertNotNull($completedTask->delivered_at);
        $this->assertNotNull($completedTask->completed_at);
        $this->assertTrue($completedTask->delivered_at->equalTo($completedTask->completed_at));
    }
}