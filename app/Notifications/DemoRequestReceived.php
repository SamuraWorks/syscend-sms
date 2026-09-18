<?php

namespace App\Notifications;

use App\Models\DemoRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DemoRequestReceived extends Notification
{
    use Queueable;

    public function __construct(public DemoRequest $demo)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Request Received — Syscend Demo')
            ->greeting('Thank you, ' . $this->demo->contact_name . '!')
            ->line('Your demo request has been received successfully.')
            ->line('**Reference Number:** ' . $this->demo->request_id)
            ->line('**School:** ' . $this->demo->school_name)
            ->line('A member of the Syscend team will contact you within 24–48 business hours to learn more about your school and schedule a personalized demonstration.')
            ->line('While you wait, feel free to explore our platform and follow our latest updates.')
            ->action('Visit Syscend Campus', url('/'))
            ->line('If you have any questions, reach us at syscend@gmail.com or WhatsApp +232 79 630 777.')
            ->salutation('Best regards,\nThe Syscend Team');
    }
}
