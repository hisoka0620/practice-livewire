<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class PushSubscriptionTest extends TestCase
{
  use RefreshDatabase;

  public function test_authenticated_user_can_store_subscription()
  {
    $user = User::factory()->create();

    $payload = [
      'endpoint' => 'https://example.test/endpoint',
      'keys' => [
        'p256dh' => 'public_key',
        'auth' => 'auth_token',
      ],
    ];

    $this->actingAs($user)
      ->postJson(route('push.subscriptions.store'), $payload)
      ->assertStatus(201);

    $this->assertDatabaseHas('push_subscriptions', [
      'subscribable_id' => $user->id,
      'endpoint' => 'https://example.test/endpoint',
    ]);
  }
}
