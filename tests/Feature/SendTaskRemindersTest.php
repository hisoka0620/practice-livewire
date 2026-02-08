<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskReminderNotification;

class SendTaskRemindersTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_sends_push_notifications_to_users_with_due_tasks()
    {
        Notification::fake();

        $user = User::factory()->create();

        // register a dummy push subscription for the user
        $user->updatePushSubscription('https://example.test/endpoint', 'public_key', 'auth_token', 'aesgcm');

        // create a task due now for the user
        Task::factory()->for($user)->create([
            'deadline' => now(),
            'is_completed' => false,
        ]);

        $this->artisan('tasks:send-reminders')->assertExitCode(0);

        Notification::assertSentTo(
            [$user],
            TaskReminderNotification::class
        );
    }
}
