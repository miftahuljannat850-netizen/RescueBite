<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Donation;
use App\Models\PickupTask;
use App\Models\RescueRequest;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WorkflowController extends Controller
{
    public function ngoRequests(Request $request): JsonResponse
    {
        $this->requireApproved($request, 'ngo');

        $requests = RescueRequest::query()
            ->where('ngo_id', $request->user()->id)
            ->with(['donation.donor:id,name', 'pickupTask.volunteer:id,name'])
            ->latest()
            ->get()
            ->map(fn (RescueRequest $item) => $this->requestPayload($item));

        return response()->json(['data' => $requests]);
    }

    public function requestDonation(Request $request, int $donationId): JsonResponse
    {
        $this->requireApproved($request, 'ngo');
        $ngo = $request->user();

        $rescueRequest = DB::transaction(function () use ($ngo, $donationId): RescueRequest {
            $donation = Donation::query()->lockForUpdate()->find($donationId);

            if (! $donation || $donation->status !== 'available' || $donation->pickup_deadline->isPast()) {
                abort(422, 'This donation is no longer available.');
            }

            if ($donation->user_id === $ngo->id) {
                abort(403, 'You cannot request your own donation.');
            }

            $existing = RescueRequest::query()
                ->where('donation_id', $donation->id)
                ->whereIn('status', ['pending', 'approved'])
                ->first();

            if ($existing) {
                abort(422, 'This donation already has an active request.');
            }

            $item = RescueRequest::create([
                'donation_id' => $donation->id,
                'ngo_id' => $ngo->id,
                'status' => 'pending',
                'requested_at' => now(),
            ]);

            $donation->update(['status' => 'requested']);
            $this->log($ngo->id, 'donation_request_created', $item, ['donation_id' => $donation->id]);

            return $item;
        });

        return response()->json([
            'message' => 'Donation request submitted for admin approval.',
            'request' => $this->requestPayload($rescueRequest->load(['donation.donor:id,name'])),
        ], 201);
    }

    public function volunteerTasks(Request $request): JsonResponse
    {
        $this->requireApproved($request, 'volunteer');
        $volunteerId = $request->user()->id;

        $tasks = PickupTask::query()
            ->where(function ($query) use ($volunteerId): void {
                $query->whereNull('volunteer_id')->where('status', 'available')
                    ->orWhere('volunteer_id', $volunteerId);
            })
            ->with(['rescueRequest.donation.donor:id,name', 'rescueRequest.ngo:id,name'])
            ->latest()
            ->get()
            ->map(fn (PickupTask $task) => $this->taskPayload($task));

        return response()->json(['data' => $tasks]);
    }

    public function acceptPickup(Request $request, int $taskId): JsonResponse
    {
        $this->requireApproved($request, 'volunteer');
        $volunteer = $request->user();

        $task = DB::transaction(function () use ($volunteer, $taskId): PickupTask {
            $task = PickupTask::query()->lockForUpdate()->find($taskId);

            if (! $task || $task->status !== 'available' || $task->volunteer_id !== null) {
                abort(422, 'This pickup is no longer available.');
            }

            $task->forceFill([
                'volunteer_id' => $volunteer->id,
                'status' => 'accepted',
                'assigned_at' => now(),
            ])->save();

            $this->log($volunteer->id, 'pickup_accepted', $task);

            return $task;
        });

        return response()->json([
            'message' => 'Pickup accepted successfully.',
            'task' => $this->taskPayload($task->load(['rescueRequest.donation.donor:id,name', 'rescueRequest.ngo:id,name'])),
        ]);
    }

    public function updatePickup(Request $request, int $taskId): JsonResponse
    {
        $this->requireApproved($request, 'volunteer');
        $validated = $request->validate([
            'status' => ['required', Rule::in(['en_route', 'picked_up', 'delivered', 'completed'])],
            'completion_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $task = DB::transaction(function () use ($request, $taskId, $validated): PickupTask {
            $task = PickupTask::query()
                ->where('id', $taskId)
                ->where('volunteer_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            $task->completion_note = $validated['completion_note'] ?? $task->completion_note;
            if ($validated['status'] === 'picked_up') {
                $task->picked_up_at = now();
            }

            if (in_array($validated['status'], ['delivered', 'completed'], true)) {
                $completedAt = now();
                $task->status = 'completed';
                $task->delivered_at = $completedAt;
                $task->completed_at = $completedAt;
                $task->save();

                $rescueRequest = RescueRequest::query()
                    ->lockForUpdate()
                    ->findOrFail($task->rescue_request_id);
                $donation = Donation::query()
                    ->lockForUpdate()
                    ->findOrFail($rescueRequest->donation_id);

                $rescueRequest->update(['status' => 'completed']);
                $donation->update(['status' => 'completed']);
            } else {
                $task->status = $validated['status'];
                $task->save();
            }

            $this->log($request->user()->id, 'pickup_status_updated', $task, ['status' => $task->status]);

            return $task;
        });

        return response()->json([
            'message' => 'Pickup status updated.',
            'task' => $this->taskPayload($task->fresh()->load(['rescueRequest.donation.donor:id,name', 'rescueRequest.ngo:id,name'])),
        ]);
    }

    private function requireApproved(Request $request, string $role): void
    {
        $user = $request->user();
        abort_unless($user && $user->role === $role, 403, ucfirst($role).' access only.');
        abort_unless($user->approval_status === 'approved', 403, 'Your account must be approved before using this workflow.');
    }

    private function requestPayload(RescueRequest $item): array
    {
        return [
            'id' => $item->id,
            'status' => $item->status,
            'requested_at' => $item->requested_at?->toIso8601String(),
            'reviewed_at' => $item->reviewed_at?->toIso8601String(),
            'donation' => $item->donation ? [
                'id' => $item->donation->id,
                'food' => $item->donation->food,
                'quantity' => $item->donation->quantity,
                'address' => $item->donation->address,
                'pickup_deadline' => $item->donation->pickup_deadline?->toIso8601String(),
                'status' => $item->donation->status,
                'donor_name' => $item->donation->donor?->name,
            ] : null,
            'pickup_task' => $item->pickupTask ? $this->taskPayload($item->pickupTask) : null,
        ];
    }

    private function taskPayload(PickupTask $task): array
    {
        $request = $task->rescueRequest;
        $donation = $request?->donation;

        return [
            'id' => $task->id,
            'status' => $task->status,
            'assigned_at' => $task->assigned_at?->toIso8601String(),
            'picked_up_at' => $task->picked_up_at?->toIso8601String(),
            'delivered_at' => $task->delivered_at?->toIso8601String(),
            'completed_at' => $task->completed_at?->toIso8601String(),
            'donation_id' => $donation?->id,
            'food' => $donation?->food,
            'quantity' => $donation?->quantity,
            'pickup_location' => $donation?->address,
            'destination' => $request?->ngo?->name,
            'donor_name' => $donation?->donor?->name,
            'volunteer_name' => $task->volunteer?->name,
        ];
    }

    private function log(?int $actorId, string $action, object $entity, array $metadata = []): void
    {
        ActivityLog::create([
            'actor_id' => $actorId,
            'action' => $action,
            'entity_type' => $entity::class,
            'entity_id' => $entity->id,
            'metadata' => $metadata,
        ]);
    }
}
