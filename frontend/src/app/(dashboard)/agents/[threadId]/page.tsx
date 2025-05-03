"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useCompletion, type Message as ApiMessageType } from "ai/react";
import { 
  User, 
  Bot, 
  Loader2, 
  Code, 
  CheckCircle, 
  XCircle, 
  CircleDashed, 
  AlertCircle, 
  StopCircle, 
  FileText, 
  FileCode, 
  FileImage, 
  FileArchive, 
  FileQuestion 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ChatInput from "@/components/chat-input";
import ToolCallSidePanel from '@/components/thread/tool-call-side-panel';
import { FileViewerModal } from "@/components/file-viewer-modal";
import { 
  getThread, 
  getProject, 
  getToolCalls, 
  getAgentStatus, 
  stopAgent, 
  type Project, 
  type ThreadMessage, 
  type ToolCall, 
  type AgentStatus 
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { BillingError } from "@/lib/errors";
import config from "@/config";

// Define the structure for a message with potential tool calls
interface DisplayMessage extends ThreadMessage {
  toolCalls?: ToolCall[];
}

// Helper to group tool calls with messages
function groupMessagesWithTools(messages: ThreadMessage[], toolCalls: ToolCall[]): DisplayMessage[] {
  const displayMessages: DisplayMessage[] = [];
  const toolCallMap = new Map<string, ToolCall[]>();

  // Group tool calls by assistant message ID
  toolCalls.forEach(tc => {
    if (tc.assistant_message_id) {
      if (!toolCallMap.has(tc.assistant_message_id)) {
        toolCallMap.set(tc.assistant_message_id, []);
      }
      toolCallMap.get(tc.assistant_message_id)?.push(tc);
    }
  });

  // Combine messages and tool calls
  messages.forEach(msg => {
    if (msg.role === "assistant") {
      const calls = toolCallMap.get(msg.id);
      displayMessages.push({ ...msg, toolCalls: calls });
    } else {
      displayMessages.push(msg);
    }
  });

  return displayMessages;
}

// Helper to get file icon
const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (["js", "ts", "jsx", "tsx", "py", "rb", "java", "c", "cpp", "cs", "go", "php", "html", "css", "scss", "json", "yaml", "yml", "md"].includes(extension || "")) {
    return FileCode;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(extension || "")) {
    return FileImage;
  }
  if (["zip", "tar", "gz", "rar", "7z"].includes(extension || "")) {
    return FileArchive;
  }
  if (["txt", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension || "")) {
    return FileText;
  }
  return FileQuestion;
};

export default function AgentThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [currentToolIndex, setCurrentToolIndex] = useState(-1);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [autoOpenedPanel, setAutoOpenedPanel] = useState(false);
  const [showBillingAlert, setShowBillingAlert] = useState(false);
  const [billingData, setBillingData] = useState<any>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userClosedPanelRef = useRef(false);
  const isMobile = useMediaQuery("(max-width: 768px)");


  const { 
    completion, 
    input, 
    setInput, 
    handleInputChange, 
    handleSubmit, 
    stop, 
    isLoading: isCompletionLoading, 
    error: completionError 
  } = useCompletion({
    api: `/api/threads/${threadId}/chat`,
    body: { threadId },
    onFinish: (prompt, completion) => {
      console.log("Completion finished:", completion);
      setIsSending(false);
      fetchData(); // Refresh data after completion
      startPolling(); // Restart polling for agent status
    },
    onError: (err) => {
      console.error("Completion error:", err);
      setIsSending(false);
      if (err.message.includes("BillingError")) {
        try {
          const errorDetails = JSON.parse(err.message.split("BillingError: ")[1]);
          setBillingData({
            message: errorDetails.message || "Monthly usage limit reached. Please upgrade your plan.",
            currentUsage: errorDetails.currentUsage,
            limit: errorDetails.limit,
            accountId: project?.personal_account_id // Assuming project has personal_account_id
          });
          setShowBillingAlert(true);
        } catch (parseError) {
          toast.error("Monthly usage limit reached. Please upgrade your plan.");
        }
      } else {
        toast.error(err.message || "Failed to send message");
      }
      startPolling(); // Ensure polling restarts even on error
    }
  });

  // --- Data Fetching and Polling ---
  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (!threadId) return;
    if (isInitialLoad) setIsLoading(true);
    try {
      const [threadData, toolCallsData, statusData, projectData] = await Promise.all([
        getThread(threadId),
        getToolCalls(threadId),
        getAgentStatus(threadId),
        project ? Promise.resolve(project) : (threadData && threadData.project_id ? getProject(threadData.project_id) : Promise.resolve(null))
      ]);

      if (!project && projectData) {
        setProject(projectData);
        setSandboxId(projectData.sandbox_id);
      }
      
      const groupedMessages = groupMessagesWithTools(threadData.messages, toolCallsData);
      setMessages(groupedMessages);
      setToolCalls(toolCallsData);
      setAgentStatus(statusData.status);
      setError(null);

      // Auto-open side panel if new tool calls appeared and user hasn't closed it
      if (toolCallsData.length > toolCalls.length && !userClosedPanelRef.current && !autoOpenedPanel) {
        setIsSidePanelOpen(true);
        setCurrentToolIndex(toolCallsData.length - 1); // Navigate to the latest tool call
        setAutoOpenedPanel(true); // Mark that we auto-opened it once
      }
      // Reset auto-open flag if tool calls decrease (e.g., thread reset)
      if (toolCallsData.length < toolCalls.length) {
        setAutoOpenedPanel(false);
        userClosedPanelRef.current = false; // Allow auto-open again
      }

    } catch (err) {
      console.error("Error loading thread data:", err);
      setError(err instanceof Error ? err.message : "Could not load conversation.");
      // Stop polling on critical fetch errors
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [threadId, project, toolCalls.length, autoOpenedPanel]); // Include dependencies

  const startPolling = useCallback(() => {
    // Clear existing interval if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    // Start new polling
    pollingIntervalRef.current = setInterval(() => {
      fetchData();
    }, 3000); // Poll every 3 seconds
  }, [fetchData]);

  useEffect(() => {
    fetchData(true); // Initial fetch
    startPolling(); // Start polling

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [threadId, startPolling]); // Only re-run if threadId changes

  // Stop polling if agent becomes idle or errored
  useEffect(() => {
    if ((agentStatus === "idle" || agentStatus === "error") && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("Polling stopped for status:", agentStatus);
    }
  }, [agentStatus]);

  // --- Message Submission ---
  const handleSubmitMessage = (messageText: string, files?: File[]) => {
    if (!messageText.trim() && (!files || files.length === 0)) return;
    
    // TODO: Handle file uploads if files are provided
    if (files && files.length > 0) {
      toast.info("File uploads are not yet fully supported in this view.");
      // Placeholder: Add logic to upload files and potentially include references
      // in the message sent to the backend.
    }
    
    setIsSending(true);
    setShowBillingAlert(false); // Hide previous billing alerts
    setInput(messageText); // Set input for useCompletion
    handleSubmit(); // Trigger useCompletion hook
    setNewMessage(""); // Clear input field
    
    // Stop current polling and fetch immediately to show user message
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    // Optimistically add user message (will be replaced by fetch)
    setMessages(prev => [...prev, { id: `temp-${Date.now()}`, role: "user", content: messageText, created_at: new Date().toISOString(), thread_id: threadId }]);
    // Fetch data almost immediately after optimistic update
    setTimeout(() => fetchData(), 100);
  };

  // --- Agent Control ---
  const handleStopAgent = async () => {
    if (!threadId || agentStatus !== "running") return;
    console.log("Attempting to stop agent...");
    // Optimistically update status
    setAgentStatus("stopping");
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    stop(); // Stop AI completion if in progress
    try {
      await stopAgent(threadId);
      toast.success("Agent stopping process initiated.");
      // Fetch data after a short delay to allow status update
      setTimeout(() => fetchData(), 1500);
    } catch (err) {
      console.error("Error stopping agent:", err);
      toast.error("Failed to stop agent.");
      // Resume polling if stop failed
      startPolling();
    } 
  };

  // --- Scrolling Logic ---
  useEffect(() => {
    // Scroll to the latest message or completion chunk
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, completion, agentStatus]); // Scroll when messages, completion, or status change

  // --- Tool Call Panel Navigation ---
  const handleSidePanelNavigate = (index: number) => {
    if (index >= 0 && index < toolCalls.length) {
      setCurrentToolIndex(index);
      // Optional: Scroll the corresponding message/tool call into view in the main chat
      // This requires adding refs to individual tool call elements, which can be complex.
      // For now, just update the index.
    }
  };

  // --- File Viewer --- 
  const handleOpenFileViewer = (filePath?: string) => {
    setFileToView(filePath || null);
    setFileViewerOpen(true);
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Tool view render functions for the side panel
  const toolViewAssistant = (message: ApiMessageType) => (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-5 h-5 mt-1 rounded-md flex items-center justify-center overflow-hidden bg-primary/10">
        <Image src="/kortix-symbol.svg" alt="Suna" width={14} height={14} className="object-contain"/>
      </div>
      <div className="flex-1 space-y-1">
        <span className="font-semibold text-sm">Assistant</span>
        {message.content && <p className="text-xs text-muted-foreground">{message.content}</p>}
      </div>
    </div>
  );

  const toolViewResult = (toolCall: ToolCall) => {
    let resultDisplay = null;
    if (toolCall.result) {
      // Try to parse the result content
      let parsedResult = toolCall.result;
      try {
        if (typeof toolCall.result === 'string') {
          parsedResult = JSON.parse(toolCall.result);
        }
      } catch {}

      if (parsedResult.error) {
        resultDisplay = <span className="text-red-500 text-xs">Error: {parsedResult.error}</span>;
      } else if (typeof parsedResult.content === 'string' && (parsedResult.content.startsWith('File written:') || parsedResult.content.startsWith('File read:'))) {
        resultDisplay = <span className="text-xs text-muted-foreground">{parsedResult.content}</span>;
      } else {
        try {
          // Attempt to pretty-print JSON if possible
          const jsonResult = typeof parsedResult.content === 'string' ? JSON.parse(parsedResult.content) : parsedResult.content;
          resultDisplay = (
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(jsonResult, null, 2)}
            </pre>
          );
        } catch {
          // Fallback for non-JSON string results
          resultDisplay = <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{parsedResult.content || JSON.stringify(parsedResult)}</pre>;
        }
      }
    } else {
      resultDisplay = <span className="text-xs text-muted-foreground italic">Result pending...</span>;
    }

    return (
      <div className="flex items-start gap-3 mt-2">
        <div className="flex-shrink-0 w-5 h-5 mt-1 rounded-md flex items-center justify-center overflow-hidden bg-secondary">
          <Code className="h-3 w-3 text-secondary-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <span className="font-semibold text-sm">Tool Result</span>
          <div className="text-xs text-muted-foreground">
            {resultDisplay}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full relative transition-all duration-300 ease-in-out",
      isSidePanelOpen ? "lg:mr-[550px] xl:mr-[650px]" : ""
    )}>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <header className="border-b p-3 flex items-center justify-between flex-shrink-0 h-[57px]">
          <div className="flex items-center gap-2">
            {project ? (
              <>
                <Image src="/kortix-symbol.svg" alt="Suna Logo" width={20} height={20} />
                <h1 className="text-base font-semibold truncate" title={project.name}>{project.name}</h1>
              </>
            ) : (
              <Skeleton className="h-5 w-32" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {agentStatus === "running" && (
              <Button variant="outline" size="sm" onClick={handleStopAgent} className="text-xs">
                <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                Stop Agent
              </Button>
            )}
            {/* Add other controls if needed */}
          </div>
        </header>
        
        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth" id="message-list">
          <div className="max-w-3xl mx-auto w-full pb-24"> {/* Added padding-bottom */} 
            {messages.length === 0 && !isLoading && agentStatus === 'idle' && (
              <div className="text-center text-muted-foreground pt-10">
                Start the conversation by sending a message.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={message.id || `msg-${index}`} className="mb-6">
                {message.role === "user" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">You</p>
                      <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3 text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                       <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">Assistant</p>
                      {message.content && message.content.trim().length > 0 && (
                        <div className="bg-muted rounded-lg max-w-[90%] px-4 py-3 text-sm">
                           <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                a({ href, children }) {
                                  if (href?.startsWith("sandboxfs://")) {
                                    const filePath = href.substring("sandboxfs://".length);
                                    const FileName = filePath.split('/').pop();
                                    const Icon = getFileIcon(FileName || "");
                                    return (
                                      <Button 
                                        variant="link"
                                        className="p-0 h-auto text-sm text-primary inline-flex items-center gap-1"
                                        onClick={() => handleOpenFileViewer(filePath)}
                                      >
                                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                        {children}
                                      </Button>
                                    );
                                  }
                                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
                                },
                              }}
                           >
                              {message.content as string}
                           </ReactMarkdown>
                        </div>
                      )}
                      {/* Display Tool Calls under the assistant message */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.toolCalls.map((toolCall) => {
                            const globalToolIndex = toolCalls.findIndex(tc => tc.id === toolCall.id);
                            const toolName = toolCall.name || 'Unnamed Tool';
                            let paramDisplay = '';
                            try {
                              if (toolCall.args) {
                                const args = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args;
                                // Simple display logic - adjust as needed
                                if (args.file) paramDisplay = args.file.split('/').pop();
                                else if (args.command) paramDisplay = args.command.split(' ')[0];
                                else if (args.url) paramDisplay = new URL(args.url).hostname;
                                else if (args.query) paramDisplay = args.query;
                                else if (args.prompt) paramDisplay = args.prompt.substring(0, 20) + '...';
                                else if (args.text) paramDisplay = args.text.substring(0, 20) + '...';
                              }
                            } catch {}

                            return (
                              <div key={toolCall.id} className="pl-4 border-l-2 border-primary/20">
                                <button 
                                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left py-0.5"
                                  onClick={() => {
                                    setIsSidePanelOpen(true);
                                    setCurrentToolIndex(globalToolIndex);
                                    userClosedPanelRef.current = false; // User interacted, allow auto-open again
                                  }}
                                >
                                  {toolCall.result ? (
                                    toolCall.result.error ? (
                                      <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    )
                                  ) : (
                                    <CircleDashed className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="font-mono text-xs">{toolName}</span>
                                  {paramDisplay && <span className="ml-1 text-muted-foreground/70 truncate max-w-[200px]" title={paramDisplay}>{paramDisplay}</span>}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Display streaming completion */}
            {completion && (
              <div ref={latestMessageRef} className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">Assistant</p>
                    <div className="bg-muted rounded-lg max-w-[90%] px-4 py-3 text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                          a({ href, children }) {
                            if (href?.startsWith("sandboxfs://")) {
                              const filePath = href.substring("sandboxfs://".length);
                              const FileName = filePath.split('/').pop();
                              const Icon = getFileIcon(FileName || "");
                              return (
                                <Button 
                                  variant="link"
                                  className="p-0 h-auto text-sm text-primary inline-flex items-center gap-1"
                                  onClick={() => handleOpenFileViewer(filePath)}
                                >
                                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                  {children}
                                </Button>
                              );
                            }
                            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
                          },
                        }}
                      >
                        {completion}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Display agent thinking/running state */}
            {(agentStatus === 'running' || agentStatus === 'connecting' || agentStatus === 'stopping') && !completion && (
              <div ref={latestMessageRef} className="mb-6">
                {(() => {
                  // Find the latest assistant message ID that might have pending tool calls
                  let lastAssistantMsgId: string | null = null;
                  for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].role === 'assistant') {
                      lastAssistantMsgId = messages[i].id;
                      break;
                    }
                  }
                  
                  // Filter tool calls that happened *after* the last assistant message or have no message ID yet
                  const pendingToolCalls = toolCalls.filter(tc => 
                    !tc.result && 
                    (!lastAssistantMsgId || new Date(tc.created_at) > new Date(messages.find(m => m.id === lastAssistantMsgId)?.created_at || 0))
                  );

                  // Check if the last message was an assistant message with tool calls that are all finished
                  const lastMsg = messages[messages.length - 1];
                  const allLastToolsFinished = lastMsg?.role === 'assistant' && 
                                             lastMsg.toolCalls && 
                                             lastMsg.toolCalls.every(tc => tc.result);

                  // Show thinking indicator only if:
                  // 1. Agent is running/connecting/stopping
                  // 2. There's no streaming completion
                  // 3. EITHER there are no pending tool calls displayed yet OR the last message's tools are all finished
                  if (pendingToolCalls.length === 0 || allLastToolsFinished) {
                    return (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-semibold">Assistant</p>
                          <div className="bg-muted rounded-lg max-w-[90%] px-4 py-3 text-sm">
                            <div className="flex items-center gap-1.5 py-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-150" />
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-300" />
                            </div>
                          </div>
                          {/* Display pending tool calls below thinking indicator */}
                          {pendingToolCalls.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {pendingToolCalls.map(toolCall => {
                                const globalToolIndex = toolCalls.findIndex(tc => tc.id === toolCall.id);
                                const toolName = toolCall.name || 'Unnamed Tool';
                                let paramDisplay = '';
                                try {
                                  if (toolCall.args) {
                                    const args = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args;
                                    if (args.file) paramDisplay = args.file.split('/').pop();
                                    else if (args.command) paramDisplay = args.command.split(' ')[0];
                                    else if (args.url) paramDisplay = new URL(args.url).hostname;
                                    else if (args.query) paramDisplay = args.query;
                                    else if (args.prompt) paramDisplay = args.prompt.substring(0, 20) + '...';
                                    else if (args.text) paramDisplay = args.text.substring(0, 20) + '...';
                                  }
                                } catch {}
                                
                                return (
                                  <div key={toolCall.id} className="pl-4 border-l-2 border-primary/20">
                                    <button 
                                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left py-0.5"
                                      onClick={() => {
                                        setIsSidePanelOpen(true);
                                        setCurrentToolIndex(globalToolIndex);
                                        userClosedPanelRef.current = false;
                                      }}
                                    >
                                      {(() => {
                                          // Find the corresponding tool call in the main toolCalls array to check status
                                          const currentToolCallState = toolCalls[globalToolIndex];
                                          return (
                                            <>
                                              {currentToolCallState?.result ? (
                                                currentToolCallState.result.error ? (
                                                  <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                                ) : (
                                                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                                )
                                              ) : (
                                                <CircleDashed className="h-3.5 w-3.5 text-primary flex-shrink-0 animate-spin animation-duration-2000" />
                                              )}
                                              <span className="font-mono text-xs text-primary">{toolName}</span>
                                              {paramDisplay && <span className="ml-1 text-primary/70 truncate max-w-[200px]" title={paramDisplay}>{paramDisplay}</span>}
                                            </>
                                          );
                                      })()}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  // If not showing thinking indicator, but there are pending tool calls, show them under the last assistant message
                  else if (pendingToolCalls.length > 0) {
                    return pendingToolCalls.map(toolCall => {
                      const globalToolIndex = toolCalls.findIndex(tc => tc.id === toolCall.id);
                      const toolName = toolCall.name || 'Unnamed Tool';
                      let paramDisplay = '';
                      try {
                        if (toolCall.args) {
                          const args = typeof toolCall.args === 'string' ? JSON.parse(toolCall.args) : toolCall.args;
                          if (args.file) paramDisplay = args.file.split('/').pop();
                          else if (args.command) paramDisplay = args.command.split(' ')[0];
                          else if (args.url) paramDisplay = new URL(args.url).hostname;
                          else if (args.query) paramDisplay = args.query;
                          else if (args.prompt) paramDisplay = args.prompt.substring(0, 20) + '...';
                          else if (args.text) paramDisplay = args.text.substring(0, 20) + '...';
                        }
                      } catch {}
                      
                      return (
                        <div key={toolCall.id} className="flex items-start gap-3">
                           {/* Placeholder for Assistant Icon - assumes it's under the last assistant message */}
                           <div className="w-8 h-8 flex-shrink-0"></div> 
                           <div className="flex-1 space-y-2">
                             <div className="mt-0"> {/* Adjust spacing if needed */} 
                                <div className="pl-4 border-l-2 border-primary/20">
                                  {(() => {
                                      const currentToolCallState = toolCalls[globalToolIndex];
                                      return (
                                        <button 
                                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left py-0.5"
                                          onClick={() => {
                                            setIsSidePanelOpen(true);
                                            setCurrentToolIndex(globalToolIndex);
                                            userClosedPanelRef.current = false;
                                          }}
                                        >
                                          {currentToolCallState?.result ? (
                                            currentToolCallState.result.error ? (
                                              <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                            ) : (
                                              <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                            )
                                          ) : (
                                            <CircleDashed className="h-3.5 w-3.5 text-primary flex-shrink-0 animate-spin animation-duration-2000" />
                                          )}
                                          <span className="font-mono text-xs text-primary">{toolName}</span>
                                          {paramDisplay && <span className="ml-1 text-primary/70 truncate max-w-[200px]" title={paramDisplay}>{paramDisplay}</span>}
                                        </button>
                                      );
                                  })()}
                                </div>
                              </div>
                            </div>
                        </div>
                      );
                    });
                  }
                  // If agent is stopping, show a specific indicator
                  else if (agentStatus === 'stopping') {
                     return (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="font-semibold">Assistant</p>
                            <div className="bg-muted rounded-lg max-w-[90%] px-4 py-3 text-sm text-muted-foreground italic">
                              Stopping agent...
                            </div>
                          </div>
                        </div>
                      );
                  }
                  // Otherwise, render nothing for this state
                  return null;
                })()}
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </div>
      {/* Input Area */}
      <div className={cn(
        "fixed bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pt-8 transition-all duration-200 ease-in-out",
      		'left-[72px]',
        isSidePanelOpen ? 'right-[90%] sm:right-[450px] md:right-[500px] lg:right-[550px] xl:right-[650px]' : 'right-0',
        isMobile ? 'left-0 right-0' : ''
      )}>
        <div className={cn(
          "mx-auto",
          isMobile ? "w-full px-4" : "max-w-3xl"
        )}>
          <ChatInput
            value={newMessage}
            onChange={setNewMessage}
            onSubmit={handleSubmitMessage}
            placeholder="Ask Suna anything..."
            loading={isSending || isCompletionLoading}
            disabled={isSending || isCompletionLoading || agentStatus === 'running' || agentStatus === 'connecting' || agentStatus === 'stopping'}
            isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
            onStopAgent={handleStopAgent}
            autoFocus={!isLoading}
            onFileBrowse={handleOpenFileViewer}
            sandboxId={sandboxId || undefined}
          />
        </div>
      </div>
      {/* Tool Call Side Panel */}
      <ToolCallSidePanel 
        isOpen={isSidePanelOpen} 
        onClose={() => {
          setIsSidePanelOpen(false);
          userClosedPanelRef.current = true;
          setAutoOpenedPanel(true); // Prevent auto-reopen immediately
        }}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]} // Pass display messages for context
        agentStatus={agentStatus}
        currentIndex={currentToolIndex}
        onNavigate={handleSidePanelNavigate}
        project={project || undefined}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        onViewFile={handleOpenFileViewer} // Pass file view handler
      />
      {/* File Viewer Modal */}
      {sandboxId && (
        <FileViewerModal
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          sandboxId={sandboxId}
          initialFilePath={fileToView}
          project={project || undefined}
        />
      )}
      {/* Billing Alert */}
        message={billingData.message}
        currentUsage={billingData.currentUsage}
        limit={billingData.limit}
        accountId={billingData.accountId}
        onDismiss={() => setShowBillingAlert(false)}
        isOpen={showBillingAlert}
      />
    </div>
  );
}

