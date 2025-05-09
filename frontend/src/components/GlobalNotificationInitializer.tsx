'use client';

import { useGlobalAgentNotifications } from '@/hooks/useGlobalAgentNotifications';

export function GlobalNotificationInitializer() {
  useGlobalAgentNotifications();
  return null; // This component doesn't render anything itself
} 