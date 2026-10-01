<?php

namespace App\Enums;

enum TaskStatusFilter: string
{
    case All = '';
    case Completed = 'completed';
    case Incomplete = 'incomplete';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::All => 'All',
            self::Completed => 'Completed',
            self::Incomplete => 'Incomplete',
            self::Expired => 'Expired',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn(self $status) => [
                $status->value => $status->label(),
            ])
            ->all();
    }
}
