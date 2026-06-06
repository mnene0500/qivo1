"use client"

import { useEffect } from "react"
import { useUser } from "@/firebase/auth/use-user"
import { savePushSubscriptionAction } from "@/app/actions/matchflow-actions"

/**
 * @fileOverview Manages PWA Web Push subscriptions and permissions.
 * Explicitly requests notification access on mount.
 */
export function PushNotificationManager() {
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const initPush = async () => {
      try {
        // 1. Check/Request Permission
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          console.warn("[Push Manager]: Notification permission denied.");
          return;
        }

        // 2. Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        
        // 3. Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        // 4. Subscribe if not already subscribed
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!subscription && vapidPublicKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }

        // 5. Save to database
        if (subscription) {
          const subJson = subscription.toJSON();
          if (subJson.endpoint) {
            await savePushSubscriptionAction(user.id, subJson.endpoint, subJson);
          }
        }
      } catch (err) {
        console.error("[Push Subscription Error]:", err);
      }
    }

    initPush();
  }, [user?.id]);

  return null
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
