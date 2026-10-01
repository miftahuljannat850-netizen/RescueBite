<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RescueWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_roles_can_login_and_complete_the_rescue_workflow(): void
    {
        $users = collect(['donor', 'ngo', 'admin', 'volunteer'])
            ->mapWithKeys(fn (string $role) => [$role => $this->createUser($role)]);
        $tokens = $users->mapWithKeys(fn (User $user, string $role) => [$role => $this->login($user)]);

        foreach ($users as $role => $user) {
            $this->withToken($tokens[$role])
                ->getJson('/api/profile')
                ->assertOk()
                ->assertJsonPath('user.role', $role);
        }

        $donation = $this->withToken($tokens['donor'])
            ->postJson('/api/donations', [
                'food' => 'Demo meal trays',
                'quantity' => '12 servings',
                'beneficiary_type' => 'human',
                'pickup_deadline' => now()->addHours(5)->toIso8601String(),
                'address' => 'Dhanmondi, Dhaka',
            ])
            ->assertCreated()
            ->json('donation');

        $this->withToken($tokens['ngo'])
            ->postJson("/api/ngo/donations/{$donation['id']}/request")
            ->assertCreated()
            ->assertJsonPath('request.status', 'pending');

        $requestId = $this->withToken($tokens['admin'])
            ->getJson('/api/admin/requests')
            ->assertOk()
            ->json('requests.0.id');

        $this->withToken($tokens['admin'])
            ->patchJson("/api/admin/requests/{$requestId}/approve")
            ->assertOk()
            ->assertJsonPath('request.status', 'approved');

        $task = $this->withToken($tokens['volunteer'])
            ->getJson('/api/volunteer/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'available')
            ->json('data.0');

        $this->withToken($tokens['volunteer'])
            ->patchJson("/api/volunteer/tasks/{$task['id']}/accept")
            ->assertOk()
            ->assertJsonPath('task.status', 'accepted');

        foreach (['en_route', 'picked_up', 'delivered'] as $status) {
            $this->withToken($tokens['volunteer'])
                ->patchJson("/api/volunteer/tasks/{$task['id']}", ['status' => $status])
                ->assertOk();
        }

        $this->withToken($tokens['donor'])
            ->getJson('/api/my-donations')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'completed');

        $this->withToken($tokens['ngo'])
            ->getJson('/api/ngo/requests')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'completed')
            ->assertJsonPath('data.0.donation.status', 'completed');

        $this->withToken($tokens['admin'])
            ->getJson('/api/admin/donations')
            ->assertOk()
            ->assertJsonPath('donations.0.status', 'completed');

        foreach ($tokens as $token) {
            $this->withToken($token)->postJson('/api/logout')->assertOk();
            $this->withToken($token)->getJson('/api/profile')->assertUnauthorized();
        }
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role),
            'email' => $role.'@workflow.test',
            'password' => Hash::make('password'),
            'role' => $role,
            'approval_status' => 'approved',
            'beneficiary_preference' => $role === 'ngo' ? 'human' : null,
        ]);
    }

    private function login(User $user): string
    {
        return $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('user.role', $user->role)
            ->json('token');
    }
}
