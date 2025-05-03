"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ChatInput from "@/components/chat-input";
import { 
  createProject, 
  createThread, 
  addUserMessage, 
  startAgent, 
  generateThreadName, 
  getPersonalAccount,
  type StartAgentOptions,
  type SubscriptionInfo
} from "@/lib/api";
import { BillingError } from "@/lib/errors";
import { useBilling } from "@/hooks/use-billing";
import BillingErrorAlert from "@/components/billing/billing-error-alert";
import config from "@/config";

const PENDING_PROMPT_KEY = "pendingDashboardPrompt";

function DashboardContent() {
  const router = useRouter();
  const chatInputRef = useRef<{ focus: () => void }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [autoSubmit, setAutoSubmit] = useState(false);
  const { setOpen: setOpenMobile } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { billingError, handleBillingError, clearBillingError, personalAccount } = useBilling();

  // Function to check if running in local development mode
  const isLocalMode = () => process.env.NODE_ENV === "development";

  const handleSubmit = async (message: string, files?: File[], options?: StartAgentOptions) => {
    if (!message.trim() && (!files || files.length === 0)) return;
    
    setIsSubmitting(true);
    clearBillingError(); // Clear previous billing errors
    localStorage.removeItem(PENDING_PROMPT_KEY); // Clear pending prompt on submission
    
    try {
      // ---- Handle file uploads first (IF APPLICABLE) ----
      if (files && files.length > 0) {
        console.log("Handling file uploads...");
        // Placeholder for actual file upload logic
        // Example: Upload files, get IDs/references
        // const uploadedFiles = await uploadFiles(files);
        
        // Then proceed similar to text-only, but include file info
        const projectName = await generateThreadName(message || "Chat with files");
        const newProject = await createProject({ name: projectName, description: "" });
        const thread = await createThread(newProject.id);
        
        // Add user message (potentially including file references)
        await addUserMessage(thread.thread_id, message, /* Pass file info here if needed */);
        
        // Start agent, potentially passing file info in options
        const agentOptions = { ...options, /* Add file info if needed */ };
        await startAgent(thread.thread_id, agentOptions);
        
        router.push(`/agents/${thread.thread_id}`);
        // TODO: Implement actual file upload and integration with addUserMessage/startAgent
        // For now, just log and proceed as if text-only after a delay
        console.warn("File upload logic not fully implemented. Proceeding as text-only.");
        // await handleTextOnlySubmit(message, options); // Fallback or integrate properly
        // Simulate processing time for files
        // await new Promise(resolve => setTimeout(resolve, 1500));
        // For demo, redirect after creating thread
        // router.push(`/agents/${thread.thread_id}`);
        // toast.info("File upload initiated. Agent will process shortly.");
        // setIsSubmitting(false); // Reset state after initial setup
        // return; // Stop here until file upload is fully integrated
        
        // TEMPORARY: Fallback to text-only logic for now
        // await handleTextOnlySubmit(message, options);
      } else {
        // ---- Handle text-only messages ----
        console.log(`Submitting text-only message: "${message}"`);
        const projectName = await generateThreadName(message);
        const newProject = await createProject({ name: projectName, description: "" });
        const thread = await createThread(newProject.id);
        await addUserMessage(thread.thread_id, message);
        await startAgent(thread.thread_id, options); // Pass original options here
        router.push(`/agents/${thread.thread_id}`);
      }
    } catch (error: any) {
        console.error("Error during submission process:", error);
        if (error instanceof BillingError) {
             // Delegate billing error handling
             console.log("Handling BillingError:", error.detail);
             handleBillingError({
                message: error.detail.message || "Monthly usage limit reached. Please upgrade your plan.",
                currentUsage: error.detail.currentUsage as number | undefined,
                limit: error.detail.limit as number | undefined,
                subscription: error.detail.subscription || {
                    price_id: config.SUBSCRIPTION_TIERS.FREE.priceId,
                    plan_name: "Free"
                }
             });
             setIsSubmitting(false);
             return; // Stop further processing for billing errors
        }
        // Handle other errors
        const isConnectionError = error instanceof TypeError && error.message.includes("Failed to fetch");
        if (!isLocalMode() || isConnectionError) {
           toast.error(error.message || "An unexpected error occurred");
        }
        setIsSubmitting(false); // Reset submitting state on all errors
    }
  };

  // Check for pending prompt in localStorage on mount
  useEffect(() => {
    // Use a small delay to ensure we're fully mounted
    const timer = setTimeout(() => {
      const pendingPrompt = localStorage.getItem(PENDING_PROMPT_KEY);
      
      if (pendingPrompt) {
        setInputValue(pendingPrompt);
        setAutoSubmit(true); // Flag to auto-submit after mounting
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-submit the form if we have a pending prompt
  useEffect(() => {
    if (autoSubmit && inputValue && !isSubmitting) {
      const timer = setTimeout(() => {
        handleSubmit(inputValue);
        setAutoSubmit(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoSubmit, inputValue, isSubmitting, handleSubmit]); // Added handleSubmit to dependency array

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      {isMobile && (
        <div className="absolute top-4 left-4 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8" 
                onClick={() => setOpenMobile(true)}
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open menu</TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[90%]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-medium text-foreground mb-2">Hey </h1>
          <h2 className="text-2xl text-muted-foreground">What would you like Suna to do today?</h2>
        </div>
        
        <ChatInput 
          ref={chatInputRef}
          onSubmit={handleSubmit} 
          loading={isSubmitting}
          placeholder="Describe what you need help with..."
          value={inputValue}
          onChange={setInputValue}
          hideAttachments={false}
        />
      </div>
      
      {/* Billing Error Alert */}
      <BillingErrorAlert
        message={billingError?.message}
        currentUsage={billingError?.currentUsage}
        limit={billingError?.limit}
        accountId={personalAccount?.account_id}
        onDismiss={clearBillingError}
        isOpen={!!billingError}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[90%]">
          <div className="flex flex-col items-center text-center mb-10">
            <Skeleton className="h-10 w-40 mb-2" />
            <Skeleton className="h-7 w-56" />
          </div>
          
          <Skeleton className="w-full h-[100px] rounded-xl" />
          <div className="flex justify-center mt-3">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

