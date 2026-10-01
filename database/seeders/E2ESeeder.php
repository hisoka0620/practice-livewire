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
    }
}
