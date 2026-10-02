<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\DonorController;
use App\Http\Controllers\NgoController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\AdminOperationsController;
use App\Http\Controllers\HomepageAnalyticsController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/health', function () {
    $commitSha = trim((string) @file_get_contents(base_path('deployed-commit.txt')));

    return response()->json([
        'status' => 'ok',
        'service' => 'RescueBite API',
        'commit_sha' => $commitSha ?: null,
    ]);
});

Route::get('/donations', [DonationController::class, 'index']);
Route::get('/homepage/analytics', HomepageAnalyticsController::class);

Route::middleware('api.token')->group(function (): void {
    Route::middleware('role:admin')->prefix('admin')->group(function (): void {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        Route::get('/ngos', [AdminController::class, 'ngos']);
        Route::patch('/ngos/{id}/approve', [AdminController::class, 'approveNgo'])
            ->whereNumber('id');
        Route::patch('/ngos/{id}/reject', [AdminController::class, 'rejectNgo'])
            ->whereNumber('id');

        Route::get('/volunteers', [AdminController::class, 'volunteers']);
        Route::patch('/volunteers/{id}/approve', [AdminController::class, 'approveVolunteer'])
            ->whereNumber('id');
        Route::patch('/volunteers/{id}/reject', [AdminController::class, 'rejectVolunteer'])
            ->whereNumber('id');

        Route::get('/donors', [AdminOperationsController::class, 'donors']);
        Route::get('/donations', [AdminOperationsController::class, 'donations']);
        Route::get('/requests', [AdminOperationsController::class, 'requests']);

        Route::patch('/requests/{id}/{decision}', [AdminOperationsController::class, 'reviewRequest'])
            ->whereIn('decision', ['approve', 'reject']);

        Route::get('/reports', [AdminOperationsController::class, 'reports']);
        Route::get('/activity', [AdminOperationsController::class, 'activity']);
        Route::get('/reported-content', [AdminOperationsController::class, 'reportsContent']);

        Route::patch('/reported-content/{id}', [AdminOperationsController::class, 'resolveReport'])
            ->whereNumber('id');
    });

    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('role:donor')->group(function (): void {
        Route::get('/my-donations', [DonorController::class, 'myDonations']);
        Route::post('/donations', [DonationController::class, 'store']);
        Route::post('/food-donations', [DonationController::class, 'store']);
    });

    Route::middleware('role:ngo')->group(function (): void {
        Route::get('/ngo/requests', [WorkflowController::class, 'ngoRequests']);

        Route::post('/ngo/donations/{donationId}/request', [WorkflowController::class, 'requestDonation'])
            ->whereNumber('donationId');

        Route::get('/requests', [NgoController::class, 'requests']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'readAll']);

        Route::patch('/notifications/{notificationId}/read', [NotificationController::class, 'markRead'])
            ->whereNumber('notificationId');

        // Backward-compatible alias from the original API contract.
        Route::put('/notifications/{notificationId}/read', [NotificationController::class, 'markRead'])
            ->whereNumber('notificationId');
    });

    Route::middleware('role:volunteer')->prefix('volunteer')->group(function (): void {
        Route::get('/tasks', [WorkflowController::class, 'volunteerTasks']);

        Route::patch('/tasks/{taskId}/accept', [WorkflowController::class, 'acceptPickup'])
            ->whereNumber('taskId');

        Route::patch('/tasks/{taskId}', [WorkflowController::class, 'updatePickup'])
            ->whereNumber('taskId');
    });
});