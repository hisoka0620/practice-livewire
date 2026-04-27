<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Carbon;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'priority',
        'is_completed',
        'deadline',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
        ];
    }

    /**
     * If the value is an empty string, convert it to null
     */
    protected function deadline(): Attribute
    {
        return Attribute::make(
            set: fn($value) => blank($value) ? null : $value,
        );
    }

    /**
     * Get the deadline status attribute
     */
    protected function deadlineStatus(): Attribute
    {
        return Attribute::make(
            get: function (mixed $value, array $attributes) {
                $deadline = $this->deadline;
                $now = Carbon::now();
                $tomorrow = $now->copy()->addDay();
                return match (true) {
                    $deadline?->isPast() => 'overdue',
                    $deadline?->between($now, $tomorrow) => 'due_soon',
                    default => null,
                };
            }
        );
    }

    /**
     * Get the deadline color class attribute
     */
    protected function deadlineColorClass(): Attribute
    {
        return Attribute::make(
            get: function (mixed $value, array $attributes) {
                return match ($this->deadline_status) {
                    'overdue' => 'text-red-600!',
                    'due_soon' => 'text-yellow-600!',
                    default => null,
                };
            }
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    #[Scope]
    protected function filterBySearch(Builder $query, string $search = ''): void
    {
        if (blank(mb_convert_kana($search, 's'))) {
            $query;
        }

        $query->whereAny(
            ['title', 'description', 'priority'],
            'like',
            '%' . trim(mb_convert_kana($search, 's')) . '%'
        );
    }

    #[Scope]
    protected function filterByPriority(Builder $query, string $priority = ''): void
    {
        $priority ? $query->where('priority', $priority) : $query;
    }

    #[Scope]
    protected function filterByStatus(Builder $query, string $taskStatus = ''): void
    {
        match ($taskStatus) {
            'completed' => $query->where('is_completed', true),
            'incomplete' => $query->where('is_completed', false),
            'expired' => $query->where('deadline', '<', Carbon::now()),
            default => $query,
        };
    }

    #[Scope]
    protected function sortByDeadline(Builder $query, string $value = ''): void
    {
        $value ? $query->orderBy('deadline', $value) : $query;
    }
}
