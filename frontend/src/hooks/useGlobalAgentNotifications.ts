import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/AuthProvider';

interface AgentRun {
  id: string;
  status: string;
  error?: string | null;
  thread_id: string;
  // Add other relevant fields from agent_runs table if needed for notifications
}

// Define a more specific type for the project data fetched
interface ProjectWithName {
  name: string;
}

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3'; // User needs to place a sound file here

// Helper function to get a more descriptive name for the agent run
async function getAgentRunContext(supabaseClient: SupabaseClient, threadId: string): Promise<string> {
  try {
    const { data: threadData, error: threadError } = await supabaseClient
      .from('threads')
      .select(`
        project_id,
        projects ( name )
      `)
      .eq('thread_id', threadId)
      .single();

    if (threadError || !threadData) {
      console.warn(`[GlobalNotifications] Could not fetch thread data for ${threadId}:`, threadError);
      return `Task (Thread ID: ${threadId.substring(0, 6)})`;
    }
    
    // Adjust for projects potentially being an array from the Supabase client
    const projectsArray = threadData.projects as ProjectWithName[] | ProjectWithName | null;
    let projectName: string | undefined;

    if (Array.isArray(projectsArray) && projectsArray.length > 0) {
      projectName = projectsArray[0]?.name;
    } else if (projectsArray && !Array.isArray(projectsArray)) {
      projectName = (projectsArray as ProjectWithName)?.name;
    }
    
    return projectName ? `Task in project '${projectName}'` : `Task (Thread ID: ${threadId.substring(0, 6)})`;

  } catch (e) {
    console.warn(`[GlobalNotifications] Error fetching context for thread ${threadId}:`, e);
    return `Task (Thread ID: ${threadId.substring(0, 6)})`;
  }
}

export function useGlobalAgentNotifications() {
  const supabase = createClient();
  const { user } = useAuth(); 
  const [notifiedRunIds, setNotifiedRunIds] = useState<Set<string>>(new Set());
  
  // Define terminal states based on backend logic (e.g., from agent/run_utils.py or celery tasks)
  const activeTerminalStates = ['completed', 'failed', 'stopped', 'error', 'cancelled'];

  const playNotificationSound = useCallback(() => {
    const audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.play().catch(error => console.warn('[GlobalNotifications] Error playing sound:', error));
  }, []);

  const showOSNotification = useCallback(async (title: string, options: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.warn('[GlobalNotifications] This browser does not support desktop notification');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, options);
      playNotificationSound();
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
        playNotificationSound();
      } else {
        console.info('[GlobalNotifications] OS Notification permission denied by user.');
      }
    } else {
        console.info('[GlobalNotifications] OS Notification permission was previously denied.');
    }
  }, [playNotificationSound]);

  useEffect(() => {
    if (!user || !supabase) {
      return;
    }

    const channel = supabase
      .channel('global-agent-run-notifications')
      .on<RealtimePostgresChangesPayload<AgentRun>>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_runs',
          // RLS policies on the 'agent_runs' table should handle user-specific filtering.
          // No explicit client-side filter like 'user_id=eq.${user.id}' is added here,
          // relying on RLS to only send relevant updates.
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            // All'interno di questo blocco, payload è effettivamente RealtimePostgresUpdatePayload<AgentRun>
            // TypeScript potrebbe non inferirlo automaticamente, quindi le conversioni esplicite sono ancora utili.

            const oldRun = payload.old as Partial<AgentRun>; // Per UPDATE, .old è Partial<T>
            const newRun = payload.new as unknown as AgentRun; // Per UPDATE, .new è T - con doppia asserzione

            if (!newRun?.id || !newRun?.status || !oldRun?.status) {
              console.warn('[GlobalNotifications] Insufficient data in payload for UPDATE:', payload);
              return;
            }

            const wasActive = !activeTerminalStates.includes(oldRun.status);
            const isNowTerminal = activeTerminalStates.includes(newRun.status);

            if (wasActive && isNowTerminal && !notifiedRunIds.has(newRun.id)) {
              setNotifiedRunIds((prev) => new Set(prev).add(newRun.id));

              const taskContext = await getAgentRunContext(supabase, newRun.thread_id);
              let toastMessage = '';
              let osNotificationTitle = '';
              let osNotificationBody = '';

              if (newRun.status === 'completed') {
                toastMessage = `${taskContext} completed successfully.`;
                osNotificationTitle = 'Task Completed';
                osNotificationBody = `${taskContext} has finished successfully.`;
                toast.success(toastMessage);
              } else if (newRun.status === 'failed' || newRun.status === 'error') {
                toastMessage = `${taskContext} failed. ${newRun.error || ''}`;
                osNotificationTitle = 'Task Failed';
                osNotificationBody = `${taskContext} failed. ${newRun.error || ''}`;
                toast.error(toastMessage);
              } else if (newRun.status === 'stopped' || newRun.status === 'cancelled') {
                toastMessage = `${taskContext} was stopped or cancelled.`;
                osNotificationTitle = 'Task Stopped/Cancelled';
                osNotificationBody = `${taskContext} was stopped or cancelled.`;
                toast.info(toastMessage);
              }

              // Show OS notification if a relevant title was set
              if (osNotificationTitle) {
                showOSNotification(osNotificationTitle, { body: osNotificationBody });
                // playNotificationSound(); // Sound is now played by showOSNotification upon success
              }
            }
          } else {
            // Questo non dovrebbe accadere data la sottoscrizione
            console.warn('[GlobalNotifications] Received non-UPDATE event:', payload);
            return;
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // console.log('[GlobalNotifications] Successfully subscribed to agent_runs updates!');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[GlobalNotifications] Subscription error/closed:', status, err);
          // Optionally, attempt to resubscribe or notify user of lost connection
        }
      });

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(error => {
          console.error('[GlobalNotifications] Error removing channel:', error);
        });
      }
    };
  }, [user, supabase, notifiedRunIds, showOSNotification, playNotificationSound]);
} 