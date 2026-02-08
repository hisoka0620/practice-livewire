<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class TaskReminderNotification extends Notification
{
    use Queueable;

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
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    public function toWebPush(object $notifiable, object $notification): WebPushMessage
    {
        $body = $this->dueCount > 0
            ? "You have {$this->dueCount} task(s) that are due or due soon. Don't forget to complete them!"
            : "You have tasks that are due soon. Don't forget to complete them!";

        return (new WebPushMessage)
            ->title('Task Reminder')
            ->body($body)
            ->action('View Tasks', 'view_tasks')
            ->data(['url' => url('/todo-list'), 'due_count' => $this->dueCount]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
