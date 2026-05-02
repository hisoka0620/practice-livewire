<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class TaskReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The number of times the notification may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    protected int $dueCount;

    /**
     * Create a new notification instance.
     */
    public function __construct(int $dueCount = 0)
    {
        $this->dueCount = $dueCount;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    /**
     * Calculate the number of seconds to wait before retrying the notification.
     */
    public function backoff(): array
    {
        return [60, 300, 900]; // 1 minute, 5 minutes, 15 minutes
    }

    /**
     * Determine which queues should be used for each notification channel.
     *
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return [
            WebPushChannel::class => 'push-notifications',
        ];
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        $body = $this->dueCount > 0
            ? "You have {$this->dueCount} task(s) that are due or due soon. Don't forget to complete them!"
            : "You have tasks that are due soon. Don't forget to complete them!";

        return (new WebPushMessage)
            ->title('Task Reminder')
            ->icon('/favicon.ico')
            ->body($body)
            ->action('View Tasks', 'view_tasks')
            ->data(['url' => url('/todo-list'), 'due_count' => $this->dueCount])
            ->options(['TTL' => 86400]); // 24 hours in seconds
    }
}
