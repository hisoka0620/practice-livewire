<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PushSubscriptionController extends Controller
{
  public function store(Request $request): JsonResponse
  {
    $data = $request->validate([
      'endpoint' => 'required|url',
      'keys.p256dh' => 'required|string',
      'keys.auth' => 'required|string',
    ]);

    $endpoint = $data['endpoint'];
    $key = $data['keys']['p256dh'];
    $token = $data['keys']['auth'];

    $contentEncoding = $request->input('contentEncoding', 'aesgcm');

    $user = $request->user();

    if (! $user) {
      return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $user->updatePushSubscription($endpoint, $key, $token, $contentEncoding);

    return response()->json(['message' => 'Subscription stored.'], 201);
  }
}
