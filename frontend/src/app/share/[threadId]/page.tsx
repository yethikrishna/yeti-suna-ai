"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Play, 
  Pause, 
  ArrowDown, 
  User, 
  Bot, 
  Code, 
  CheckCircle, 
  XCircle, 
  Loader2 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { getSharedThread, getProject, type Project, type ThreadMessage, type ToolCall } from "@/lib/api";
import { ToolCallPanelWithDebugInfo } from "@/components/thread/tool-call-side-panel";
import { FileViewerModal } from "@/components/file-viewer-modal";
import { type Message as ApiMessageType } from "ai"; // Import the specific type

// Define the structure for a message with potential tool calls
interface DisplayMessage extends ThreadMessage {
  toolCalls?: ToolCall[];
  toolResult?: any; // Store the result associated with a tool call message
}

// Helper to group tool calls and results with messages
function groupMessagesWithTools(messages: ThreadMessage[], toolCalls: ToolCall[]): DisplayMessage[] {
  const displayMessages: DisplayMessage[] = [];
  const toolCallMap = new Map<string, ToolCall[]>();
  const toolResultMap = new Map<string, any>();

  // Group tool calls by assistant message ID
  toolCalls.forEach(tc => {
    if (tc.assistant_message_id) {
      if (!toolCallMap.has(tc.assistant_message_id)) {
        toolCallMap.set(tc.assistant_message_id, []);
      }
      toolCallMap.get(tc.assistant_message_id)?.push(tc);
    }
  });

  // Map tool results to tool call IDs
  messages.forEach(msg => {
    if (msg.role === "tool" && msg.tool_call_id && msg.content) {
      try {
        toolResultMap.set(msg.tool_call_id, JSON.parse(msg.content as string));
      } catch (e) {
        toolResultMap.set(msg.tool_call_id, { error: "Failed to parse result", content: msg.content });
      }
    }
  });

  // Combine messages, tool calls, and results
  messages.forEach(msg => {
    if (msg.role === "assistant") {
      const calls = toolCallMap.get(msg.id);
      if (calls) {
        displayMessages.push({ ...msg, toolCalls: calls });
      } else {
        displayMessages.push(msg);
      }
    } else if (msg.role === "user") {
      displayMessages.push(msg);
    } else if (msg.role === "tool" && msg.tool_call_id) {
      // Attach the result to the corresponding tool call within the assistant message
      const assistantMsgIndex = displayMessages.findIndex(dm => 
        dm.toolCalls?.some(tc => tc.id === msg.tool_call_id)
      );
      if (assistantMsgIndex !== -1) {
        const toolCallIndex = displayMessages[assistantMsgIndex].toolCalls?.findIndex(tc => tc.id === msg.tool_call_id);
        if (toolCallIndex !== undefined && toolCallIndex !== -1) {
          // Ensure toolCalls array exists before modification
          if (!displayMessages[assistantMsgIndex].toolCalls) {
            displayMessages[assistantMsgIndex].toolCalls = [];
          }
          // Ensure the specific tool call exists
          if (displayMessages[assistantMsgIndex].toolCalls![toolCallIndex]) {
            displayMessages[assistantMsgIndex].toolCalls![toolCallIndex] = {
              ...displayMessages[assistantMsgIndex].toolCalls![toolCallIndex],
              result: toolResultMap.get(msg.tool_call_id)
            };
          }
        }
      }
    }
  });

  return displayMessages;
}

export default function SharedThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<DisplayMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreamingText, setIsStreamingText] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const [toolPlaybackIndex, setToolPlaybackIndex] = useState(-1);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [currentToolIndex, setCurrentToolIndex] = useState(-1); // For side panel navigation
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null); // Store sandboxId
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
    async function fetchData() {
      if (!threadId) return;
      setIsLoading(true);
      try {
        const threadData = await getSharedThread(threadId);
        if (threadData.project_id) {
          const projectData = await getProject(threadData.project_id);
          setProject(projectData);
          setSandboxId(projectData.sandbox_id); // Store sandboxId from project
        }
        const groupedMessages = groupMessagesWithTools(threadData.messages, threadData.tool_calls);
        setMessages(groupedMessages);
        setToolCalls(threadData.tool_calls); // Store raw tool calls for the side panel
        setVisibleMessages([]); // Start with no visible messages for playback
        setCurrentMessageIndex(0);
        setToolPlaybackIndex(-1);
        setError(null);
      } catch (err) {
        console.error("Error loading shared thread:", err);
        setError(err instanceof Error ? err.message : "Could not load shared thread. It might be private or deleted.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [threadId]);

  // --- Playback Logic ---
  const streamText = useCallback((text: string, index: number, onComplete: () => void) => {
    let i = 0;
    setIsStreamingText(true);
    setStreamingText("");
    
    function type() {
      if (i < text.length) {
        setStreamingText((prev) => prev + text.charAt(i));
        i++;
        playbackTimeoutRef.current = setTimeout(type, 20); // Adjust speed as needed
      } else {
        setIsStreamingText(false);
        // Add the completed message to visible messages
        setVisibleMessages(prev => {
          const currentMsg = messages[index];
          // Avoid adding duplicates if playback was paused/resumed
          if (prev.length > 0 && prev[prev.length - 1]?.id === currentMsg.id) {
            return prev;
          }
          return [...prev, { ...currentMsg, content: text }]; // Ensure full content is stored
        });
        onComplete();
      }
    }
    type();
  }, [messages]);

  const playNext = useCallback(() => {
    if (!isPlaying || currentMessageIndex >= messages.length) {
      setIsPlaying(false);
      return;
    }

    const message = messages[currentMessageIndex];
    let delay = 500; // Default delay

    if (message.role === "user" || (message.role === "assistant" && !message.toolCalls)) {
      const content = message.content as string;
      setVisibleMessages(prev => {
        // Avoid adding duplicates
        if (prev.length > 0 && prev[prev.length - 1]?.id === message.id) {
          return prev;
        }
        return [...prev, message];
      });
      delay = Math.max(500, content.length * 15); // Delay based on text length
      setCurrentMessageIndex(prev => prev + 1);
      playbackTimeoutRef.current = setTimeout(playNext, delay);
    } else if (message.role === "assistant" && message.toolCalls) {
      const content = message.content as string | null;
      const calls = message.toolCalls;
      
      // 1. Show Assistant Message (if any text content)
      if (content && content.trim().length > 0) {
        streamText(content, currentMessageIndex, () => {
          // 2. After text streams, process tool calls sequentially
          playNextToolCall(0, calls, () => {
            setCurrentMessageIndex(prev => prev + 1);
            playNext(); // Move to the next message after all tool calls are shown
          });
        });
      } else {
        // If no text content, just process tool calls
        setVisibleMessages(prev => {
           // Add the assistant message shell (without content) to show tool calls under it
           if (prev.length > 0 && prev[prev.length - 1]?.id === message.id) {
             return prev;
           }
           return [...prev, message];
        });
        playNextToolCall(0, calls, () => {
          setCurrentMessageIndex(prev => prev + 1);
          playNext();
        });
      }
    } else {
      // Skip tool role messages during direct playback, they are handled via tool calls
      setCurrentMessageIndex(prev => prev + 1);
      playNext();
    }
  }, [isPlaying, currentMessageIndex, messages, streamText]);

  const playNextToolCall = useCallback((toolIndex: number, calls: ToolCall[], onComplete: () => void) => {
    if (toolIndex >= calls.length) {
      setCurrentToolCall(null);
      setToolPlaybackIndex(-1);
      onComplete();
      return;
    }

    const call = calls[toolIndex];
    const globalToolIndex = toolCalls.findIndex(tc => tc.id === call.id);
    
    setCurrentToolCall(call);
    setToolPlaybackIndex(globalToolIndex); // Track the current tool call being shown
    setCurrentToolIndex(globalToolIndex); // Update side panel index
    setIsSidePanelOpen(true); // Open side panel to show the tool call

    // Update the specific message in visibleMessages to include the currently playing tool call
    setVisibleMessages(prev => prev.map(msg => {
      if (msg.id === call.assistant_message_id) {
        return {
          ...msg,
          // Only show the tool calls up to the current one being played
          toolCalls: calls.slice(0, toolIndex + 1).map(c => ({
            ...c,
            // Include result if it exists on the original call object
            result: toolCalls.find(tc => tc.id === c.id)?.result
          }))
        };
      }
      return msg;
    }));

    // Simulate tool execution time + result display time
    playbackTimeoutRef.current = setTimeout(() => {
      playNextToolCall(toolIndex + 1, calls, onComplete);
    }, 1500); // Adjust delay for showing each tool call

  }, [toolCalls]);

  useEffect(() => {
    if (isPlaying && currentMessageIndex < messages.length) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
      playNext();
    } else if (currentMessageIndex >= messages.length) {
      setIsPlaying(false); // Stop playback when done
    }

    // Cleanup timeout on unmount or when isPlaying changes
    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, [isPlaying, playNext, currentMessageIndex, messages.length]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    setCurrentMessageIndex(0);
    setVisibleMessages([]);
    setStreamingText("");
    setIsStreamingText(false);
    setCurrentToolCall(null);
    setToolPlaybackIndex(-1);
    setIsSidePanelOpen(false);
    setCurrentToolIndex(-1);
    // Restart playback after a short delay
    setTimeout(() => setIsPlaying(true), 100);
  };

  // --- Scrolling Logic ---
  useEffect(() => {
    // Scroll to the latest message when streaming or when a new non-streaming message appears
    if (isStreamingText && latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    } else if (visibleMessages.length > 0 && messagesEndRef.current && !isStreamingText) {
      // Check if user is near the bottom before auto-scrolling
      const container = scrollContainerRef.current;
      if (container) {
        const threshold = 100; // Pixels from bottom
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }
    }
  }, [streamingText, visibleMessages, isStreamingText]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const threshold = 200; // Show button if user scrolled up more than this
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleScrollButtonClick = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // --- Tool Call Panel Navigation ---
  const handleSidePanelNavigate = (index: number) => {
    if (index >= 0 && index < toolCalls.length) {
      setIsPlaying(false); // Pause playback if user interacts
      setCurrentToolIndex(index);
      const targetCall = toolCalls[index];
      
      // Find the message index containing this tool call
      const messageIdx = messages.findIndex(msg => msg.id === targetCall.assistant_message_id);
      
      if (messageIdx !== -1) {
        // Show all messages up to and including the one with the tool call
        const messagesToShow = messages.slice(0, messageIdx + 1).map((msg, idx) => {
          if (idx === messageIdx && msg.toolCalls) {
            // Find the index of the target tool call within the message's calls
            const toolCallIdx = msg.toolCalls.findIndex(tc => tc.id === targetCall.id);
            return {
              ...msg,
              // Show tool calls up to the selected one
              toolCalls: msg.toolCalls.slice(0, toolCallIdx + 1).map(c => ({
                ...c,
                result: toolCalls.find(tc => tc.id === c.id)?.result
              }))
            };
          }
          return msg;
        });
        setVisibleMessages(messagesToShow);
        setCurrentMessageIndex(messageIdx + 1); // Set index for potential resume
        setToolPlaybackIndex(index); // Sync tool playback index
        setCurrentToolCall(targetCall);

        // Scroll the specific tool call into view in the main chat if possible
        // (Requires refs on tool call elements - simplified for now)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
      }
    }
  };

  // --- File Viewer --- 
  const handleViewFile = (filePath: string) => {
    setFileToView(filePath);
    setFileViewerOpen(true);
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Loading shared conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
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
      if (toolCall.result.error) {
        resultDisplay = <span className="text-red-500 text-xs">Error: {toolCall.result.error}</span>;
      } else if (typeof toolCall.result.content === 'string' && toolCall.result.content.startsWith('File written:') || toolCall.result.content.startsWith('File read:')) {
        resultDisplay = <span className="text-xs text-muted-foreground">{toolCall.result.content}</span>;
      } else {
        try {
          // Attempt to pretty-print JSON if possible
          const jsonResult = typeof toolCall.result.content === 'string' ? JSON.parse(toolCall.result.content) : toolCall.result.content;
          resultDisplay = (
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(jsonResult, null, 2)}
            </pre>
          );
        } catch {
          // Fallback for non-JSON string results
          resultDisplay = <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{toolCall.result.content}</pre>;
        }
      }
    } else {
      resultDisplay = <span className="text-xs text-muted-foreground italic">No result available</span>;
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
    <div className="flex h-screen bg-background">
      {/* Main chat area */}
      <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ease-in-out ${
        isSidePanelOpen ? 'lg:mr-[550px] xl:mr-[650px]' : '' 
      }`}>
        {/* Header */}
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/kortix-symbol.svg" alt="Suna Logo" width={24} height={24} />
            <h1 className="text-lg font-semibold">Shared Conversation</h1>
          </div>
          {project && (
            <span className="text-sm text-muted-foreground">Agent: {project.name}</span>
          )}
        </header>
        
        {/* Message List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          <div className="max-w-3xl mx-auto w-full">
            {visibleMessages.map((message, index) => (
              <div key={message.id || `msg-${index}`} ref={index === visibleMessages.length - 1 ? latestMessageRef : null}>
                {message.role === "user" && (
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">You</p>
                      <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3 text-sm">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                       <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">Assistant</p>
                      {/* Display streamed text if this is the last message and streaming */}
                      {index === visibleMessages.length - 1 && isStreamingText ? (
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
                              // Add custom component for file links
                              a({ href, children }) {
                                if (href?.startsWith("sandboxfs://")) {
                                  const filePath = href.substring("sandboxfs://".length);
                                  return (
                                    <Button 
                                      variant="link"
                                      className="p-0 h-auto text-sm text-primary inline-block"
                                      onClick={() => handleViewFile(filePath)}
                                    >
                                      {children}
                                    </Button>
                                  );
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                              },
                            }}
                          >
                            {streamingText}
                          </ReactMarkdown>
                          <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1"></span>
                        </div>
                      ) : message.content ? (
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
                                    return (
                                      <Button 
                                        variant="link"
                                        className="p-0 h-auto text-sm text-primary inline-block"
                                        onClick={() => handleViewFile(filePath)}
                                      >
                                        {children}
                                      </Button>
                                    );
                                  }
                                  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                },
                              }}
                           >
                              {message.content as string}
                           </ReactMarkdown>
                        </div>
                      ) : null}
                      {/* Display Tool Calls under the assistant message */}
                      {message.toolCalls && message.toolCalls.map((toolCall, toolIndex) => (
                        <div key={toolCall.id || `tool-${toolIndex}`} className="mt-2 pl-4 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Code className="h-4 w-4" />
                            <span>Tool Used: {toolCall.name || 'Unnamed Tool'}</span>
                            {toolPlaybackIndex === toolCalls.findIndex(tc => tc.id === toolCall.id) && currentToolCall ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : toolCall.result ? (
                              toolCall.result.error ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )
                            ) : (
                              <span className="text-xs italic">(No result)</span> // Should ideally not happen if tool role message exists
                            )}
                          </div>
                          {/* Optionally show brief result or link to side panel */}
                          {/* <p className="text-xs text-muted-foreground pl-6">Args: {JSON.stringify(toolCall.args)}</p> */}
                          {/* Result is implicitly shown in the side panel */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Display streaming assistant message if it's the next one */}
            {currentMessageIndex === visibleMessages.length && isStreamingText && messages[currentMessageIndex]?.role === 'assistant' && (
              <div ref={latestMessageRef}>
                 <div className="flex items-start gap-3 mb-6">
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
                                return (
                                  <Button 
                                    variant="link"
                                    className="p-0 h-auto text-sm text-primary inline-block"
                                    onClick={() => handleViewFile(filePath)}
                                  >
                                    {children}
                                  </Button>
                                );
                              }
                              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                            },
                          }}
                        >
                          {streamingText}
                        </ReactMarkdown>
                        <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1"></span>
                      </div>
                    </div>
                  </div>
              </div>
            )}
            
            {/* Display current tool call being processed if it's the next step */}
            {currentMessageIndex === visibleMessages.length && 
             !isStreamingText && 
             currentToolCall && 
             messages[currentMessageIndex]?.id === currentToolCall.assistant_message_id && (
              <div ref={latestMessageRef}>
                {/* Render the parent assistant message shell if not already visible */}
                {!visibleMessages.some(msg => msg.id === currentToolCall.assistant_message_id) && (
                   <div className="flex items-start gap-3 mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                       <Image src="/kortix-symbol.svg" alt="Suna" width={20} height={20} className="object-contain"/>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold">Assistant</p>
                      {/* If the assistant message had content, it would have streamed before */} 
                    </div>
                  </div>
                )}
                {/* Indicate the tool call being processed */}
                 <div className="flex items-start gap-3 mb-6 pl-11"> {/* Indent tool call indicator */} 
                    <div className="flex-1 space-y-2">
                      <div className="mt-2 pl-4 border-l-2 border-primary/20">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Code className="h-4 w-4" />
                          <span>Tool Used: {currentToolCall.name || 'Unnamed Tool'}</span>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Fallback loading indicator if messages are empty during playback */}
            {messages.length > 0 && visibleMessages.length === 0 && isPlaying && (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            
            {/* Show tool call indicator even if message content is empty */}
            {visibleMessages.map((message, index) => {
              if (message.role !== 'assistant' || !message.toolCalls) return null;
              // Only render tool call indicators if the message content itself was empty
              // or if it's the currently playing tool call's parent message
              const shouldRenderIndicator = !message.content || 
                (currentToolCall && message.id === currentToolCall.assistant_message_id);
              
              if (!shouldRenderIndicator) return null;
              
              return message.toolCalls.map((toolCall, toolIndex) => {
                // Find the global index for status check
                const globalToolIndex = toolCalls.findIndex(tc => tc.id === toolCall.id);
                const isCurrentPlayingTool = toolPlaybackIndex === globalToolIndex;
                
                return (
                  <div key={toolCall.id || `tool-indicator-${toolIndex}`} className="pl-11 mb-6"> {/* Indent */} 
                    <div className="mt-2 pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Code className="h-4 w-4" />
                        <span>Tool Used: {toolCall.name || 'Unnamed Tool'}</span>
                        {isCurrentPlayingTool ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : toolCall.result ? (
                          toolCall.result.error ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )
                        ) : (
                          <span className="text-xs italic">(No result)</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })}
            
            {/* Show streaming indicator if no messages yet */}
            {visibleMessages.length === 0 && isStreamingText && (
              <div ref={latestMessageRef}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 mt-2 rounded-md flex items-center justify-center overflow-hidden bg-primary/10">
                    <Image src="/kortix-symbol.svg" alt="Suna" width={14} height={14} className="object-contain"/>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="max-w-[90%] px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-150" />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse delay-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
        
        {/* Floating playback controls */}
        {messages.length > 0 && (
          <div className={`fixed bottom-4 z-10 transform bg-background/90 backdrop-blur rounded-full border shadow-md px-3 py-1.5 transition-all duration-300 ease-in-out ${
            isSidePanelOpen 
              ? 'left-1/2 -translate-x-1/4 sm:left-[calc(50%-225px)] md:left-[calc(50%-250px)] lg:left-[calc(50%-275px)] xl:left-[calc(50%-325px)]' 
              : 'left-1/2 -translate-x-1/2'
          }`}>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
                className="h-8 w-8"
              >
                {isPlaying ? 
                  <Pause className="h-4 w-4" /> : 
                  <Play className="h-4 w-4" />
                }
              </Button>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{Math.min(currentMessageIndex + (isStreamingText ? 0 : 1), messages.length)}/{messages.length}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={resetPlayback}
                className="h-8 w-8"
              >
                {/* Use a rewind or restart icon */} 
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rewind"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentMessageIndex(messages.length);
                  // Show all messages instantly, processing tool calls correctly
                  const allMessagesWithTools = groupMessagesWithTools(messages, toolCalls);
                  setVisibleMessages(allMessagesWithTools);
                  setToolPlaybackIndex(toolCalls.length - 1);
                  setStreamingText("");
                  setIsStreamingText(false);
                  setCurrentToolCall(null);
                  if (toolCalls.length > 0) {
                    setCurrentToolIndex(toolCalls.length - 1);
                    setIsSidePanelOpen(true);
                  }
                  // Scroll to bottom after rendering all messages
                  setTimeout(() => handleScrollButtonClick(), 50);
                }}
                className="text-xs"
              >
                Skip to end
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-6 z-10 h-8 w-8 rounded-full shadow-md lg:right-[calc(650px+1.5rem)] xl:right-[calc(750px+1.5rem)] transition-all duration-300 ease-in-out"
          onClick={handleScrollButtonClick}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
      {/* Tool calls side panel */}
      <ToolCallPanelWithDebugInfo
        isOpen={isSidePanelOpen} 
        onClose={() => setIsSidePanelOpen(false)}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]} // Pass original messages
        agentStatus="idle" // Or determine based on playback state
        currentIndex={currentToolIndex}
        onNavigate={handleSidePanelNavigate}
        project={project}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        onViewFile={handleViewFile} // Pass file view handler
      />
      {/* File Viewer Modal */}
      <FileViewerModal
        open={fileViewerOpen}
        onOpenChange={setFileViewerOpen}
        sandboxId={sandboxId || ""} // Pass sandboxId
        initialFilePath={fileToView}
        project={project}
      />
    </div>
  );
}

