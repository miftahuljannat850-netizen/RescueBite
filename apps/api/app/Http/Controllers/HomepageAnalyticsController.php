<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\PickupTask;
use App\Models\RescueRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class HomepageAnalyticsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $now = now();
        $completedDonations = Donation::query()
            ->where('status', 'completed')
            ->get(['quantity']);
        $meals = $completedDonations->sum(function (Donation $donation): int {
            return (int) preg_replace('/[^0-9]/', '', $donation->quantity);
        });

        return response()->json([
            'stats' => [
                'active_rescues' => Donation::query()
                    ->whereNotIn('status', ['completed', 'expired'])
                    ->count(),
                'human_food' => Donation::query()
                    ->where('beneficiary_type', 'human')
                    ->count(),
                'expiring_soon' => Donation::query()
                    ->whereNotIn('status', ['completed', 'expired'])
                    ->where('pickup_deadline', '>', $now)
                    ->where('pickup_deadline', '<=', $now->copy()->addHours(24))
                    ->count(),
                'animal_shelters' => User::query()
                    ->where('role', 'ngo')
                    ->where('approval_status', 'approved')
                    ->whereIn('beneficiary_preference', ['animal', 'both'])
                    ->count(),
                'approved_volunteers' => User::query()
                    ->where('role', 'volunteer')
                    ->where('approval_status', 'approved')
                    ->count(),
            ],
            'top_volunteers' => User::query()
                ->where('role', 'volunteer')
                ->where('approval_status', 'approved')
                ->whereHas('pickupTasks', fn ($query) => $query->where('status', 'completed'))
                ->withCount(['pickupTasks as completed_deliveries' => fn ($query) => $query->where('status', 'completed')])
                ->orderByDesc('completed_deliveries')
                ->limit(4)
                ->get(['id', 'name', 'service_area']),
            'chart' => [
                'delivered' => PickupTask::query()->where('status', 'completed')->count(),
                'received_by_ngos' => RescueRequest::query()->where('status', 'approved')->count(),
                'pending_available' => Donation::query()
                    ->whereIn('status', ['available', 'requested'])
                    ->count(),
            ],
            'impact' => [
                'completed_donations' => $completedDonations->count(),
                'meals' => $meals,
                'waste' => (int) round($meals * 0.25),
                'co2' => (int) round($meals * 0.64),
            ],
        ]);
    }
}