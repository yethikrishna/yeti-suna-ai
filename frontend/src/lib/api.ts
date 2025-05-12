import { createClient } from '@/lib/supabase/client';

// Get backend URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Set to keep track of agent runs that are known to be non-running
const nonRunningAgentRuns = new Set<string>();
// Map to keep track of active EventSource streams
const activeStreams = new Map<string, EventSource>();

// Custom error for billing issues
export class BillingError extends Error {
  status: number;
  detail: { message: string; [key: string]: any }; // Allow other properties in detail

  constructor(
    status: number,
    detail: { message: string; [key: string]: any },
    message?: string,
  ) {
    super(message || detail.message || `Billing Error: ${status}`);
    this.name = 'BillingError';
    this.status = status;
    this.detail = detail;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BillingError.prototype);
  }
}

// Type Definitions (moved from potential separate file for clarity)
export type Project = {
  id: string;
  name: string;
  description: string;
  account_id: string;
  created_at: string;
  updated_at?: string;
  sandbox: {
    vnc_preview?: string;
    sandbox_url?: string;
    id?: string;
    pass?: string;
  };
  is_public?: boolean; // Flag to indicate if the project is public
  [key: string]: any; // Allow additional properties to handle database fields
};

export type Thread = {
  thread_id: string;
  account_id: string | null;
  project_id?: string | null;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional properties to handle database fields
};

export type Message = {
  role: string;
  content: string;
  type: string;
};

export type AgentRun = {
  id: string;
  thread_id: string;
  status: 'running' | 'completed' | 'stopped' | 'error';
  started_at: string;
  completed_at: string | null;
  responses: Message[];
  error: string | null;
};

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export interface InitiateAgentResponse {
  thread_id: string;
  agent_run_id: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  instance_id: string;
}

export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  mod_time: string;
  permissions?: string;
}

// Project APIs
export const getProjects = async (): Promise<Project[]> => {
  try {
    // MODIFIED: In self-hosted mode without auth, there are no user-specific projects
    // to fetch via Supabase RLS in the standard way. Return empty array.
    // Alternatively, we could fetch from a backend endpoint if one existed
    // that listed projects accessible by the dummy_user_id, but that's not standard.
    console.log('[API] getProjects called in self-hosted mode, returning empty array.');
    return [];

    /* Original code using Supabase client removed:
    const supabase = createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting current user:', userError);
      return [];
    }

    if (!userData.user) {
      console.log('[API] No user logged in, returning empty projects array');
      return [];
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('account_id', userData.user.id);

    if (error) {
      if (
        error.code === '42501' &&
        error.message.includes('has_role_on_account')
      ) {
        console.error(
          'Permission error: User does not have proper account access',
        );
        return [];
      }
      throw error;
    }

    console.log('[API] Raw projects from DB:', data?.length, data);

    const mappedProjects: Project[] = (data || []).map((project) => ({
      id: project.project_id,
      name: project.name || '',
      description: project.description || '',
      account_id: project.account_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
      sandbox: project.sandbox || {
        id: '',
        pass: '',
        vnc_preview: '',
        sandbox_url: '',
      },
    }));

    console.log('[API] Mapped projects for frontend:', mappedProjects.length);

    return mappedProjects;
    */
  } catch (err) {
    // This catch block might now be unreachable unless the modified code throws.
    console.error('Error fetching projects:', err);
    return [];
  }
};

export const getProject = async (projectId: string): Promise<Project> => {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      // Handle the specific "no rows returned" error from Supabase
      if (error.code === 'PGRST116') {
        throw new Error(`Project not found or not accessible: ${projectId}`);
      }
      throw error;
    }

    console.log('Raw project data from database:', data);

    // If project has a sandbox, ensure it's started
    if (data.sandbox?.id) {
      // Fire off sandbox activation without blocking
      const ensureSandboxActive = async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          // For public projects, we don't need authentication
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          console.log(`Ensuring sandbox is active for project ${projectId}...`);
          const response = await fetch(
            `${API_URL}/project/${projectId}/sandbox/ensure-active`,
            {
              method: 'POST',
              headers,
            },
          );

          if (!response.ok) {
            const errorText = await response
              .text()
              .catch(() => 'No error details available');
            console.warn(
              `Failed to ensure sandbox is active: ${response.status} ${response.statusText}`,
              errorText,
            );
          } else {
            console.log('Sandbox activation successful');
          }
        } catch (sandboxError) {
          console.warn('Failed to ensure sandbox is active:', sandboxError);
        }
      };

      // Start the sandbox activation without awaiting
      ensureSandboxActive();
    }

    // Map database fields to our Project type
    const mappedProject: Project = {
      id: data.project_id,
      name: data.name || '',
      description: data.description || '',
      account_id: data.account_id,
      is_public: data.is_public || false,
      created_at: data.created_at,
      sandbox: data.sandbox || {
        id: '',
        pass: '',
        vnc_preview: '',
        sandbox_url: '',
      },
    };

    console.log('Mapped project data for frontend:', mappedProject);

    return mappedProject;
  } catch (error) {
    console.error(`Error fetching project ${projectId}:`, error);
    throw error;
  }
};

export const createProject = async (
  projectData: { name: string; description: string },
  // accountId is no longer needed from frontend, backend will use dummy_user_id
): Promise<Project> => {
  try {
    console.log('[API] createProject called with data:', projectData);
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Backend's get_current_user_id_from_jwt expects a Bearer token,
        // even if it's a dummy one for self-hosted mode.
        'Authorization': 'Bearer dummy_self_host_token',
      },
      body: JSON.stringify({
        name: projectData.name,
        description: projectData.description,
        // account_id will be set by the backend based on dummy_user_id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create project, unknown error' }));
      console.error('Error creating project:', response.status, errorData);
      // Check for billing-related errors specifically if they can occur here
      if (response.status === 402) { // Payment Required (typical for billing errors)
        throw new BillingError(response.status, errorData.detail || errorData, errorData.message);
      }
      throw new Error(errorData.message || `Failed to create project: ${response.statusText}`);
    }

    const createdProject: Project = await response.json();
    console.log('[API] Project created successfully:', createdProject);
    return createdProject;
  } catch (error) {
    console.error('Error in createProject:', error);
    if (error instanceof BillingError) throw error; // Re-throw billing errors
    throw new Error(`Error creating project: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updateProject = async (
  projectId: string,
  data: Partial<Project>,
): Promise<Project> => {
  const supabase = createClient();

  console.log('Updating project with ID:', projectId);
  console.log('Update data:', data);

  // Sanity check to avoid update errors
  if (!projectId || projectId === '') {
    console.error('Attempted to update project with invalid ID:', projectId);
    throw new Error('Cannot update project: Invalid project ID');
  }

  const { data: updatedData, error } = await supabase
    .from('projects')
    .update(data)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  if (!updatedData) {
    throw new Error('No data returned from update');
  }

  // Dispatch a custom event to notify components about the project change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('project-updated', {
        detail: {
          projectId,
          updatedData: {
            id: updatedData.project_id,
            name: updatedData.name,
            description: updatedData.description,
          },
        },
      }),
    );
  }

  // Return formatted project data - use same mapping as getProject
  return {
    id: updatedData.project_id,
    name: updatedData.name,
    description: updatedData.description || '',
    account_id: updatedData.account_id,
    created_at: updatedData.created_at,
    sandbox: updatedData.sandbox || {
      id: '',
      pass: '',
      vnc_preview: '',
      sandbox_url: '',
    },
  };
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('project_id', projectId);

  if (error) throw error;
};

// Thread APIs
export const getThreads = async (projectId?: string): Promise<Thread[]> => {
  // MODIFIED: In self-hosted mode without auth, cannot reliably get user-specific threads via Supabase RLS.
  // Returning empty array. If threads associated with dummy_user_id are needed,
  // a dedicated backend endpoint would be required.
  console.log('[API] getThreads called in self-hosted mode, returning empty array.');
  return [];

  /* Original code using Supabase client removed:
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error getting current user:', userError);
    return [];
  }

  if (!userData.user) {
    console.log('[API] No user logged in, returning empty threads array');
    return [];
  }

  let query = supabase.from('threads').select('*');

  query = query.eq('account_id', userData.user.id);

  if (projectId) {
    console.log('[API] Filtering threads by project_id:', projectId);
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[API] Error fetching threads:', error);
    throw error;
  }

  console.log('[API] Raw threads from DB:', data?.length, data);

  const mappedThreads: Thread[] = (data || []).map((thread) => ({
    thread_id: thread.thread_id,
    account_id: thread.account_id,
    project_id: thread.project_id,
    created_at: thread.created_at,
    updated_at: thread.updated_at,
  }));

  return mappedThreads;
  */
};

export const getThread = async (threadId: string): Promise<Thread> => {
  // MODIFIED: Use fetch instead of Supabase client
  try {
    console.log(`[API] Getting thread ${threadId}`);
    const response = await fetch(`${API_URL}/threads/${threadId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer dummy_self_host_token',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get thread, unknown error' }));
      console.error('Error getting thread:', response.status, errorData);
      // It might be better to throw here if a thread is essential for a page
      // For now, let's allow the page to handle a null-like or error state.
      throw new Error(errorData.message || `Failed to get thread: ${response.statusText}`);
    }
    const thread: Thread = await response.json();
    console.log('[API] Thread fetched successfully:', thread);
    return thread;
  } catch (error) {
    console.error(`Error fetching thread ${threadId}:`, error);
    throw error; // Re-throw to be handled by the calling component
  }

  /* Original code using Supabase client removed:
  const supabase = createClient();
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('thread_id', threadId)
    .single();

  if (error) throw error;

  return data;
  */
};

export const createThread = async (projectId: string): Promise<Thread> => {
  try {
    console.log(`[API] Creating thread for project ${projectId}`);
    const response = await fetch(`${API_URL}/projects/${projectId}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy_self_host_token',
      },
      // No body needed for creating a thread, projectId is in URL
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create thread, unknown error' }));
      console.error('Error creating thread:', response.status, errorData);
      throw new Error(errorData.message || `Failed to create thread: ${response.statusText}`);
    }

    const createdThread: Thread = await response.json();
    console.log('[API] Thread created successfully:', createdThread);
    return createdThread;
  } catch (error) {
    console.error('Error in createThread:', error);
    throw new Error(`Error creating thread: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const addUserMessage = async (
  threadId: string,
  content: string,
): Promise<void> => {
  try {
    console.log(`[API] Adding user message to thread ${threadId}`);
    const response = await fetch(`${API_URL}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy_self_host_token',
      },
      body: JSON.stringify({ role: 'user', content: content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to add user message, unknown error' }));
      console.error('Error adding user message:', response.status, errorData);
      throw new Error(errorData.message || `Failed to add user message: ${response.statusText}`);
    }
    console.log('[API] User message added successfully.');
    // No specific data to return for this endpoint
  } catch (error) {
    console.error('Error in addUserMessage:', error);
    throw new Error(`Error adding user message: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getMessages = async (threadId: string): Promise<Message[]> => {
  // MODIFIED: Use fetch instead of Supabase client
  try {
    console.log(`[API] Getting messages for thread ${threadId}`);
    const response = await fetch(`${API_URL}/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        // Backend should allow fetching messages with dummy token
        'Authorization': 'Bearer dummy_self_host_token',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get messages, unknown error' }));
      console.error('Error getting messages:', response.status, errorData);
      // Return empty array on error to prevent UI crash
      return [];
      // throw new Error(errorData.message || `Failed to get messages: ${response.statusText}`);
    }
    const messages: Message[] = await response.json();
    console.log('[API] Messages fetched successfully:', messages.length);
    return messages;

  } catch (error) {
     console.error('Error in getMessages:', error);
     // Return empty array on error
     return [];
     // throw new Error(`Error getting messages: ${error instanceof Error ? error.message : String(error)}`);
  }

  /* Original code using Supabase client removed:
  const supabase = createClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .neq('type', 'cost')
    .neq('type', 'summary')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error(`Error getting messages: ${error.message}`);
  }

  console.log('[API] Messages fetched:', data);

  return data || [];
  */
};

// Agent APIs
export const startAgent = async (
  threadId: string,
  options?: {
    model_name?: string;
    enable_thinking?: boolean;
    reasoning_effort?: string;
    stream?: boolean; // Stream option is handled by streamAgent, but backend might accept it
  },
): Promise<{ agent_run_id: string }> => {
  try {
    console.log(`[API] Starting agent for thread ${threadId} with options:`, options);
    const response = await fetch(`${API_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy_self_host_token',
      },
      body: JSON.stringify(options || {}), // Send options if provided
    });

    if (!response.ok) {
       const errorData = await response.json().catch(() => ({ message: 'Failed to start agent, unknown error' }));
       console.error('Error starting agent:', response.status, errorData);
       if (response.status === 402) { // Check specifically for billing errors
        throw new BillingError(response.status, errorData.detail || errorData, errorData.message);
      }
      throw new Error(errorData.message || `Failed to start agent: ${response.statusText}`);
    }

    const result: { agent_run_id: string } = await response.json();
    console.log('[API] Agent started successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in startAgent:', error);
    if (error instanceof BillingError) throw error; // Re-throw billing errors
    throw new Error(`Error starting agent: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const stopAgent = async (agentRunId: string): Promise<void> => {
  // Add to non-running set immediately to prevent reconnection attempts
  nonRunningAgentRuns.add(agentRunId);

  // Close any existing stream
  const existingStream = activeStreams.get(agentRunId);
  if (existingStream) {
    console.log(
      `[API] Closing existing stream for ${agentRunId} before stopping agent`,
    );
    existingStream.close();
    activeStreams.delete(agentRunId);
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${API_URL}/agent-run/${agentRunId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    // Add cache: 'no-store' to prevent caching
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Error stopping agent: ${response.statusText}`);
  }
};

export const getAgentStatus = async (agentRunId: string): Promise<AgentRun> => {
  console.log(`[API] Requesting agent status for ${agentRunId}`);

  if (nonRunningAgentRuns.has(agentRunId)) {
    console.log(`[API] Agent run ${agentRunId} is known to be non-running, returning error status.`);
    // Return an error-like AgentRun object instead of throwing
    return {
      id: agentRunId,
      thread_id: '', // Or try to get from context if available
      status: 'error',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      responses: [],
      error: `Agent run ${agentRunId} is not running (cached status).`,
    };
  }

  try {
    console.log(`[API] Fetching agent status from: ${API_URL}/agent-run/${agentRunId}`);
    const response = await fetch(`${API_URL}/agent-run/${agentRunId}`, {
      headers: {
        'Authorization': 'Bearer dummy_self_host_token',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      console.error(`[API] Error getting agent status: ${response.status} ${response.statusText}`, errorText);
      if (response.status === 404) {
        nonRunningAgentRuns.add(agentRunId);
      }
      // Return an error-like AgentRun object
      return {
        id: agentRunId,
        thread_id: '',
        status: 'error',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        responses: [],
        error: `Error getting agent status: ${response.statusText} (${response.status}) - ${errorText}`,
      };
    }

    const data: AgentRun = await response.json();
    console.log(`[API] Successfully got agent status:`, data);
    if (data.status !== 'running') {
      nonRunningAgentRuns.add(agentRunId);
    }
    return data;
  } catch (error) {
    console.error('[API] Failed to get agent status:', error);
    return {
      id: agentRunId,
      thread_id: '',
      status: 'error',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      responses: [],
      error: `Failed to get agent status: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const getAgentRuns = async (threadId: string): Promise<AgentRun[]> => {
  try {
    console.log(`[API] Fetching agent runs for thread ${threadId}`);
    const response = await fetch(`${API_URL}/threads/${threadId}/agent-runs`, { // Corrected endpoint based on backend
      headers: {
        'Authorization': 'Bearer dummy_self_host_token',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to get agent runs, unknown error' }));
      console.error('Error getting agent runs:', response.status, errorData);
      return []; // Return empty on error
      // throw new Error(errorData.message || `Failed to get agent runs: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[API] Agent runs fetched successfully:', data.agent_runs?.length);
    return data.agent_runs || [];
  } catch (error) {
    console.error('Failed to get agent runs:', error);
    return []; // Return empty on error
    // throw new Error(`Failed to get agent runs: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const streamAgent = (
  agentRunId: string,
  callbacks: {
    onMessage: (content: string) => void;
    onError: (error: Error | string) => void;
    onClose: () => void;
  },
): (() => void) => {
  console.log(`[STREAM] streamAgent called for ${agentRunId}`);

  // Check if this agent run is known to be non-running
  if (nonRunningAgentRuns.has(agentRunId)) {
    console.log(
      `[STREAM] Agent run ${agentRunId} is known to be non-running, not creating stream`,
    );
    // Notify the caller immediately
    setTimeout(() => {
      callbacks.onError(`Agent run ${agentRunId} is not running`);
      callbacks.onClose();
    }, 0);

    // Return a no-op cleanup function
    return () => {};
  }

  // Check if there's already an active stream for this agent run
  const existingStream = activeStreams.get(agentRunId);
  if (existingStream) {
    console.log(
      `[STREAM] Stream already exists for ${agentRunId}, closing it first`,
    );
    existingStream.close();
    activeStreams.delete(agentRunId);
  }

  // Set up a new stream
  try {
    const setupStream = async () => {
      // First verify the agent is actually running
      try {
        const status = await getAgentStatus(agentRunId);
        if (status.status !== 'running') {
          console.log(
            `[STREAM] Agent run ${agentRunId} is not running (status: ${status.status}), not creating stream`,
          );
          nonRunningAgentRuns.add(agentRunId);
          callbacks.onError(
            `Agent run ${agentRunId} is not running (status: ${status.status})`,
          );
          callbacks.onClose();
          return;
        }
      } catch (err) {
        console.error(`[STREAM] Error verifying agent run ${agentRunId}:`, err);

        // Check if this is a "not found" error
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isNotFoundError =
          errorMessage.includes('not found') ||
          errorMessage.includes('404') ||
          errorMessage.includes('does not exist');

        if (isNotFoundError) {
          console.log(
            `[STREAM] Agent run ${agentRunId} not found, not creating stream`,
          );
          nonRunningAgentRuns.add(agentRunId);
        }

        callbacks.onError(errorMessage);
        callbacks.onClose();
        return;
      }

      // Use a dummy token for self-hosted mode
      const dummyToken = 'dummy_self_host_token';

      const url = new URL(`${API_URL}/agent-run/${agentRunId}/stream`);
      url.searchParams.append('token', dummyToken); // Pass dummy token as URL param

      console.log(`[STREAM] Creating EventSource for ${agentRunId} with dummy token`);
      const eventSource = new EventSource(url.toString());

      // Store the EventSource in the active streams map
      activeStreams.set(agentRunId, eventSource);

      eventSource.onopen = () => {
        console.log(`[STREAM] Connection opened for ${agentRunId}`);
      };

      eventSource.onmessage = (event) => {
        try {
          const rawData = event.data;
          if (rawData.includes('"type":"ping"')) return;

          // Log raw data for debugging (truncated for readability)
          console.log(
            `[STREAM] Received data for ${agentRunId}: ${rawData.substring(0, 100)}${rawData.length > 100 ? '...' : ''}`,
          );

          // Skip empty messages
          if (!rawData || rawData.trim() === '') {
            console.debug('[STREAM] Received empty message, skipping');
            return;
          }

          // Check for "Agent run not found" error
          if (
            rawData.includes('Agent run') &&
            rawData.includes('not found in active runs')
          ) {
            console.log(
              `[STREAM] Agent run ${agentRunId} not found in active runs, closing stream`,
            );

            // Add to non-running set to prevent future reconnection attempts
            nonRunningAgentRuns.add(agentRunId);

            // Notify about the error
            callbacks.onError('Agent run not found in active runs');

            // Clean up
            eventSource.close();
            activeStreams.delete(agentRunId);
            callbacks.onClose();

            return;
          }

          // Check for completion messages
          if (
            rawData.includes('"type":"status"') &&
            rawData.includes('"status":"completed"')
          ) {
            console.log(
              `[STREAM] Detected completion status message for ${agentRunId}`,
            );

            // Check for specific completion messages that indicate we should stop checking
            if (
              rawData.includes('Run data not available for streaming') ||
              rawData.includes('Stream ended with status: completed')
            ) {
              console.log(
                `[STREAM] Detected final completion message for ${agentRunId}, adding to non-running set`,
              );
              // Add to non-running set to prevent future reconnection attempts
              nonRunningAgentRuns.add(agentRunId);
            }

            // Notify about the message
            callbacks.onMessage(rawData);

            // Clean up
            eventSource.close();
            activeStreams.delete(agentRunId);
            callbacks.onClose();

            return;
          }

          // Check for thread run end message
          if (
            rawData.includes('"type":"status"') &&
            rawData.includes('"status_type":"thread_run_end"')
          ) {
            console.log(
              `[STREAM] Detected thread run end message for ${agentRunId}`,
            );

            // Add to non-running set
            nonRunningAgentRuns.add(agentRunId);

            // Notify about the message
            callbacks.onMessage(rawData);

            // Clean up
            eventSource.close();
            activeStreams.delete(agentRunId);
            callbacks.onClose();

            return;
          }

          // For all other messages, just pass them through
          callbacks.onMessage(rawData);
        } catch (error) {
          console.error(`[STREAM] Error handling message:`, error);
          callbacks.onError(error instanceof Error ? error : String(error));
        }
      };

      eventSource.onerror = (event) => {
        console.log(`[STREAM] EventSource error for ${agentRunId}:`, event);

        // Check if the agent is still running
        getAgentStatus(agentRunId)
          .then((status) => {
            if (status.status !== 'running') {
              console.log(
                `[STREAM] Agent run ${agentRunId} is not running after error, closing stream`,
              );
              nonRunningAgentRuns.add(agentRunId);
              eventSource.close();
              activeStreams.delete(agentRunId);
              callbacks.onClose();
            } else {
              console.log(
                `[STREAM] Agent run ${agentRunId} is still running after error, keeping stream open`,
              );
              // Let the browser handle reconnection for non-fatal errors
            }
          })
          .catch((err) => {
            console.error(
              `[STREAM] Error checking agent status after stream error:`,
              err,
            );

            // Check if this is a "not found" error
            const errMsg = err instanceof Error ? err.message : String(err);
            const isNotFoundErr =
              errMsg.includes('not found') ||
              errMsg.includes('404') ||
              errMsg.includes('does not exist');

            if (isNotFoundErr) {
              console.log(
                `[STREAM] Agent run ${agentRunId} not found after error, closing stream`,
              );
              nonRunningAgentRuns.add(agentRunId);
              eventSource.close();
              activeStreams.delete(agentRunId);
              callbacks.onClose();
            }

            // For other errors, notify but don't close the stream
            callbacks.onError(errMsg);
          });
      };
    };

    // Start the stream setup
    setupStream();

    // Return a cleanup function
    return () => {
      console.log(`[STREAM] Cleanup called for ${agentRunId}`);
      const stream = activeStreams.get(agentRunId);
      if (stream) {
        console.log(`[STREAM] Closing stream for ${agentRunId}`);
        stream.close();
        activeStreams.delete(agentRunId);
      }
    };
  } catch (error) {
    console.error(`[STREAM] Error setting up stream for ${agentRunId}:`, error);
    callbacks.onError(error instanceof Error ? error : String(error));
    callbacks.onClose();
    return () => {};
  }
};

// Sandbox API Functions
export const createSandboxFile = async (
  sandboxId: string,
  filePath: string,
  content: string,
): Promise<void> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Use FormData to handle both text and binary content more reliably
    const formData = new FormData();
    formData.append('path', filePath);

    // Create a Blob from the content string and append as a file
    const blob = new Blob([content], { type: 'application/octet-stream' });
    formData.append('file', blob, filePath.split('/').pop() || 'file');

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error creating sandbox file: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error creating sandbox file: ${response.statusText} (${response.status})`,
      );
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create sandbox file:', error);
    throw error;
  }
};

// Fallback method for legacy support using JSON
export const createSandboxFileJson = async (
  sandboxId: string,
  filePath: string,
  content: string,
): Promise<void> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${API_URL}/sandboxes/${sandboxId}/files/json`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          path: filePath,
          content: content,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error creating sandbox file (JSON): ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error creating sandbox file: ${response.statusText} (${response.status})`,
      );
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create sandbox file with JSON:', error);
    throw error;
  }
};

export const listSandboxFiles = async (
  sandboxId: string,
  path: string,
): Promise<FileInfo[]> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = new URL(`${API_URL}/sandboxes/${sandboxId}/files`);
    url.searchParams.append('path', path);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error listing sandbox files: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error listing sandbox files: ${response.statusText} (${response.status})`,
      );
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Failed to list sandbox files:', error);
    throw error;
  }
};

export const getSandboxFileContent = async (
  sandboxId: string,
  path: string,
): Promise<string | Blob> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = new URL(`${API_URL}/sandboxes/${sandboxId}/files/content`);
    url.searchParams.append('path', path);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error getting sandbox file content: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error getting sandbox file content: ${response.statusText} (${response.status})`,
      );
    }

    // Check if it's a text file or binary file based on content-type
    const contentType = response.headers.get('content-type');
    if (
      (contentType && contentType.includes('text')) ||
      contentType?.includes('application/json')
    ) {
      return await response.text();
    } else {
      return await response.blob();
    }
  } catch (error) {
    console.error('Failed to get sandbox file content:', error);
    throw error;
  }
};

export const updateThread = async (
  threadId: string,
  data: Partial<Thread>,
): Promise<Thread> => {
  const supabase = createClient();

  // Format the data for update
  const updateData = { ...data };

  // Update the thread
  const { data: updatedThread, error } = await supabase
    .from('threads')
    .update(updateData)
    .eq('thread_id', threadId)
    .select()
    .single();

  if (error) {
    console.error('Error updating thread:', error);
    throw new Error(`Error updating thread: ${error.message}`);
  }

  return updatedThread;
};

export const toggleThreadPublicStatus = async (
  threadId: string,
  isPublic: boolean,
): Promise<Thread> => {
  return updateThread(threadId, { is_public: isPublic });
};

export const deleteThread = async (threadId: string): Promise<void> => {
  try {
    const supabase = createClient();

    // First delete all agent runs associated with this thread
    console.log(`Deleting all agent runs for thread ${threadId}`);
    const { error: agentRunsError } = await supabase
      .from('agent_runs')
      .delete()
      .eq('thread_id', threadId);

    if (agentRunsError) {
      console.error('Error deleting agent runs:', agentRunsError);
      throw new Error(`Error deleting agent runs: ${agentRunsError.message}`);
    }

    // Then delete all messages associated with the thread
    console.log(`Deleting all messages for thread ${threadId}`);
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('thread_id', threadId);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw new Error(`Error deleting messages: ${messagesError.message}`);
    }

    // Finally, delete the thread itself
    console.log(`Deleting thread ${threadId}`);
    const { error: threadError } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', threadId);

    if (threadError) {
      console.error('Error deleting thread:', threadError);
      throw new Error(`Error deleting thread: ${threadError.message}`);
    }

    console.log(
      `Thread ${threadId} successfully deleted with all related items`,
    );
  } catch (error) {
    console.error('Error deleting thread and related items:', error);
    throw error;
  }
};

// Function to get public projects
export const getPublicProjects = async (): Promise<Project[]> => {
  try {
    const supabase = createClient();

    // Query for threads that are marked as public
    const { data: publicThreads, error: threadsError } = await supabase
      .from('threads')
      .select('project_id')
      .eq('is_public', true);

    if (threadsError) {
      console.error('Error fetching public threads:', threadsError);
      return [];
    }

    // If no public threads found, return empty array
    if (!publicThreads?.length) {
      return [];
    }

    // Extract unique project IDs from public threads
    const publicProjectIds = [
      ...new Set(publicThreads.map((thread) => thread.project_id)),
    ].filter(Boolean);

    // If no valid project IDs, return empty array
    if (!publicProjectIds.length) {
      return [];
    }

    // Get the projects that have public threads
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('project_id', publicProjectIds);

    if (projectsError) {
      console.error('Error fetching public projects:', projectsError);
      return [];
    }

    console.log(
      '[API] Raw public projects from DB:',
      projects?.length,
      projects,
    );

    // Map database fields to our Project type
    const mappedProjects: Project[] = (projects || []).map((project) => ({
      id: project.project_id,
      name: project.name || '',
      description: project.description || '',
      account_id: project.account_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
      sandbox: project.sandbox || {
        id: '',
        pass: '',
        vnc_preview: '',
        sandbox_url: '',
      },
      is_public: true, // Mark these as public projects
    }));

    console.log(
      '[API] Mapped public projects for frontend:',
      mappedProjects.length,
    );

    return mappedProjects;
  } catch (err) {
    console.error('Error fetching public projects:', err);
    return [];
  }
};

export const initiateAgent = async (
  formData: FormData,
): Promise<InitiateAgentResponse> => {
  try {
    console.log('[API] initiateAgent called with FormData:', Array.from(formData.entries()));

    const response = await fetch(`${API_URL}/agent/initiate`, {
      method: 'POST',
      headers: {
        // 'Content-Type' is set automatically for FormData by the browser
        // Add the dummy Authorization header
        'Authorization': 'Bearer dummy_self_host_token',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to initiate agent, unknown error' }));
      console.error('Error initiating agent:', response.status, errorData);
       if (response.status === 402) {
        throw new BillingError(response.status, errorData.detail || errorData, errorData.message);
      }
      throw new Error(errorData.message || `Failed to initiate agent: ${response.statusText}`);
    }

    const result: InitiateAgentResponse = await response.json();
    console.log('[API] Agent initiated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in initiateAgent:', error);
    if (error instanceof BillingError) throw error;
    throw new Error(`Error initiating agent: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API health check failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Billing API Types
export interface CreateCheckoutSessionRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
}

export interface CreatePortalSessionRequest {
  return_url: string;
}

export interface SubscriptionStatus {
  status: string; // Includes 'active', 'trialing', 'past_due', 'scheduled_downgrade', 'no_subscription'
  plan_name?: string;
  price_id?: string; // Added
  current_period_end?: string; // ISO Date string
  cancel_at_period_end: boolean;
  trial_end?: string; // ISO Date string
  minutes_limit?: number;
  current_usage?: number;
  // Fields for scheduled changes
  has_schedule: boolean;
  scheduled_plan_name?: string;
  scheduled_price_id?: string; // Added
  scheduled_change_date?: string; // ISO Date string - Deprecate? Check backend usage
  schedule_effective_date?: string; // ISO Date string - Added for consistency
}

export interface BillingStatusResponse {
  can_run: boolean;
  message: string;
  subscription: {
    price_id: string;
    plan_name: string;
    minutes_limit?: number;
  };
}

export interface CreateCheckoutSessionResponse {
  status:
    | 'upgraded'
    | 'downgrade_scheduled'
    | 'checkout_created'
    | 'no_change'
    | 'new'
    | 'updated'
    | 'scheduled';
  subscription_id?: string;
  schedule_id?: string;
  session_id?: string;
  url?: string;
  effective_date?: string;
  message?: string;
  details?: {
    is_upgrade?: boolean;
    effective_date?: string;
    current_price?: number;
    new_price?: number;
    invoice?: {
      id: string;
      status: string;
      amount_due: number;
      amount_paid: number;
    };
  };
}

// Billing API Functions
export const createCheckoutSession = async (
  request: CreateCheckoutSessionRequest,
): Promise<CreateCheckoutSessionResponse> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error creating checkout session: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error creating checkout session: ${response.statusText} (${response.status})`,
      );
    }

    const data = await response.json();
    console.log('Checkout session response:', data);

    // Handle all possible statuses
    switch (data.status) {
      case 'upgraded':
      case 'updated':
      case 'downgrade_scheduled':
      case 'scheduled':
      case 'no_change':
        return data;
      case 'new':
      case 'checkout_created':
        if (!data.url) {
          throw new Error('No checkout URL provided');
        }
        return data;
      default:
        console.warn(
          'Unexpected status from createCheckoutSession:',
          data.status,
        );
        return data;
    }
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

export const createPortalSession = async (
  request: CreatePortalSessionRequest,
): Promise<{ url: string }> => {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/billing/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'No error details available');
      console.error(
        `Error creating portal session: ${response.status} ${response.statusText}`,
        errorText,
      );
      throw new Error(
        `Error creating portal session: ${response.statusText} (${response.status})`,
      );
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw error;
  }
};

export const getSubscription = async (): Promise<SubscriptionStatus> => {
  // MODIFIED: Return dummy data as billing is disabled for self-hosting
  console.log('[API] getSubscription called, returning dummy non-billing data.');
  return {
    status: 'stripe_disabled', // Or 'no_subscription' or a custom status
    plan_name: 'N/A (Self-hosted)',
    price_id: 'self_hosted_free',
    cancel_at_period_end: false,
    minutes_limit: Infinity, // Or a very high number, or null/undefined
    current_usage: 0,
    has_schedule: false,
  };
};

export const checkBillingStatus = async (): Promise<BillingStatusResponse> => {
  // MODIFIED: Return dummy data as billing is disabled for self-hosting
  console.log('[API] checkBillingStatus called, returning dummy non-billing data.');
  return {
    can_run: true, // Always allow running in self-hosted mode without billing
    message: 'Billing is disabled for self-hosted version.',
    subscription: {
      price_id: 'self_hosted_free',
      plan_name: 'N/A (Self-hosted)',
      // minutes_limit can be omitted if not applicable, or set to Infinity
    },
  };
};

// Knowledge Base APIs
export interface KBDocument {
  id: string; // Changed from uuid.UUID to string for frontend simplicity
  file_name: string;
  created_at: string; // Keep as string, can be parsed by Date if needed
  status: string;
  error_message?: string | null;
  mime_type: string;
  file_size: number;
}

export interface KBUpdateResponse {
  document_id: string; // Changed from uuid.UUID to string
  file_name: string;
  status: string;
  message: string;
}

export const listKnowledgeBaseDocuments = async (projectId: string): Promise<KBDocument[]> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_URL}/kb/projects/${projectId}/documents`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to list KB documents' }));
    console.error('Failed to list KB documents:', errorData);
    throw new Error(errorData.detail || 'Failed to list KB documents');
  }
  return response.json();
};

export const deleteKnowledgeBaseDocument = async (projectId: string, documentId: string): Promise<void> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_URL}/kb/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // For 204 No Content, response.ok might be true but no JSON body
    if (response.status === 204) {
      return;
    }
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete KB document' }));
    console.error('Failed to delete KB document:', errorData);
    throw new Error(errorData.detail || 'Failed to delete KB document');
  }
  // No content expected on successful delete (204)
};

export const uploadKnowledgeBaseDocument = async (projectId: string, file: File): Promise<KBUpdateResponse> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/kb/projects/${projectId}/documents`, {
    method: 'POST',
    headers: {
      // Content-Type is set automatically by browser for FormData
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to upload KB document' }));
    console.error('Failed to upload KB document:', errorData);
    // Check for specific billing error structure from backend
    if (response.status === 402 && errorData.detail?.message) {
        throw new BillingError(response.status, errorData.detail, errorData.detail.message);
    }
    throw new Error(errorData.detail || 'Failed to upload KB document');
  }
  return response.json();
};
