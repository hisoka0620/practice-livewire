<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

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

        $subscription = $user->updatePushSubscription($endpoint, $key, $token, $contentEncoding);

        // Log for monitoring
        Log::info('Push subscription updated', [
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'action' => $subscription->wasRecentlyCreated ? 'created' : 'updated',
        ]);

        $statusCode = $subscription->wasRecentlyCreated ? 201 : 200;

        return response()->json(['message' => 'Subscription stored.'], $statusCode);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => 'required|url',
        ]);

        $endpoint = $data['endpoint'];

        $user = $request->user();

        $user->deletePushSubscription($endpoint);

        Log::info('Push subscription deleted', [
            'user_id' => $user->id,
            'endpoint' => $endpoint,
        ]);

        return response()->json(['message' => 'Subscription deleted.'], 200);
    }
}
