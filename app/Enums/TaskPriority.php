<?php

namespace App\Enums;

enum TaskPriority: string
{
    case All = '';
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';

    public function label(): string
    {
        return match ($this) {
            self::All => 'All',
            self::Low => 'Low',
            self::Medium => 'Medium',
            self::High => 'High',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn(self $priority) => [
                $priority->value => $priority->label(),
            ])
            ->all();
    }
}
