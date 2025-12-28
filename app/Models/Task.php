<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Attributes\Scope;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'is_completed',
        'priority'
    ];

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
    protected function filterByCompleted(Builder $query, string $completed = ''): void
    {
        match ($completed) {
            't' => $query->where('is_completed', true),
            'f' => $query->where('is_completed', false),
            default => $query,
        };
    }
}
