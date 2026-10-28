<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class E2ESeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Calendar E2E User',
            'email' => 'calendar-e2e@example.test',
        ]);

        Task::factory()->for($user)->create([
            'title' => 'Timezone boundary task',
            'priority' => 'high',
            'is_completed' => false,
            'deadline' => Carbon::parse('2026-10-02 00:30:00', 'Asia/Tokyo'),
        ]);

        // Dedicated account for the screenshot suite: its fixture must not be
        // contaminated while other suites create tasks in parallel. The name
        // matches the shared E2E user so the avatar initials stay pixel-stable.
        $screenshotUser = User::factory()->create([
            'name' => 'Calendar E2E User',
            'email' => 'calendar-screenshot@example.test',
        ]);

        Task::factory()->for($screenshotUser)->create([
            'title' => 'Timezone boundary task',
            'priority' => 'high',
            'is_completed' => false,
            'deadline' => Carbon::parse('2026-10-02 00:30:00', 'Asia/Tokyo'),
        ]);
    }
}
