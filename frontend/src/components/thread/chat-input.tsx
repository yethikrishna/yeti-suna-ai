
'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Square, Loader2, X, Paperclip, Settings, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// Define API_URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface ChatInputProps {
  threadId: string;
  initialInput?: string;
  onMessageSent?: () => void;
  onMessageResponseStarted?: () => void;
  onMessageResponseCompleted?: () => void;
  onMessageResponseError?: (error: Error) => void;
  isResponding: boolean;
  setIsResponding: (isResponding: boolean) => void;
  onFileUploadSuccess?: (uploadedFiles: any[]) => void;
  agentId: string;
}

const ChatInput = forwardRef<{
  focus: () => void;
  setInput: (value: string) => void;
  handleSend: () => void;
}, ChatInputProps>((
  {
    threadId,
    initialInput = '',
    onMessageSent,
    onMessageResponseStarted,
    onMessageResponseCompleted,
    onMessageResponseError,
    isResponding,
    setIsResponding,
    onFileUploadSuccess,
    agentId,
  },
  ref
) => {
  const [input, setInput] = useState(initialInput);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [model, setModel] = useState<string>("gpt-4o"); // Default model
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    setInput: (value: string) => {
      setInput(value);
      adjustTextareaHeight();
    },
    handleSend: () => {
      handleSendMessage();
    }
  }));

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isResponding) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
      event.target.value = ''; // Reset file input
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);
    const uploadedFileIds: string[] = [];

    try {
      for (const file of selectedFiles) {
        const filePath = `${threadId}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('user_files')
          .upload(filePath, file);

        if (error) {
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        if (data) {
          // Get public URL (consider security implications)
          const { data: urlData } = supabase.storage.from('user_files').getPublicUrl(filePath);
          uploadedFileIds.push(urlData.publicUrl);
        }
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully.`);
      setSelectedFiles([]);
      if (onFileUploadSuccess) {
        // Pass file details if needed, here just passing URLs
        onFileUploadSuccess(uploadedFileIds.map(url => ({ url, name: url.split('/').pop() })));
      }
      return uploadedFileIds;
    } catch (error: any) { // Explicitly type error as any or Error
      console.error("File upload error:", error);
      toast.error(`File upload failed: ${error.message}`);
      // Optionally keep failed files for retry?
      return []; // Return empty array on failure
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && selectedFiles.length === 0) return;
    if (isResponding) return;

    setIsResponding(true);
    if (onMessageResponseStarted) onMessageResponseStarted();

    let uploadedFileUrls: string[] = [];
    if (selectedFiles.length > 0) {
      uploadedFileUrls = await handleUploadFiles();
      // If upload fails and input is empty, don't proceed
      if (uploadedFileUrls.length === 0 && !trimmedInput) {
        setIsResponding(false);
        if (onMessageResponseCompleted) onMessageResponseCompleted();
        return;
      }
    }

    const messageContent = trimmedInput;
    setInput('');
    setTimeout(adjustTextareaHeight, 0); // Adjust height after clearing input

    if (onMessageSent) onMessageSent();

    try {
      const response = await fetch(`${API_URL}/threads/${threadId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            file_urls: uploadedFileUrls,
            model: model, // Include selected model
            agent_id: agentId // Include agentId
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // No need to process response here if handled by parent

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Error: ${error.message}`);
      if (onMessageResponseError) onMessageResponseError(error);
      // Restore input if sending failed?
      // setInput(messageContent);
    } finally {
      // Parent component should set isResponding to false when stream ends
      // setIsResponding(false);
      // if (onMessageResponseCompleted) onMessageResponseCompleted();
    }
  };

  const handleStopResponding = async () => {
    try {
      const response = await fetch(`${API_URL}/threads/${threadId}/interrupt`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      toast.info("Processing stopped.");
      // Let the polling mechanism in the parent handle the state update
      // setIsResponding(false);
      // if (onMessageResponseCompleted) onMessageResponseCompleted();
    } catch (error: any) {
      console.error('Error stopping response:', error);
      toast.error(`Error stopping: ${error.message}`);
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative flex flex-col gap-2 px-4 pb-4 pt-2 border-t bg-background shadow-lg"> {/* Added pt-2 */}
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50 max-h-28 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background border rounded-full px-3 py-1 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-xs" title={file.name}>{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  disabled={isUploading}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative flex items-end gap-2">
          {/* File Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isResponding || isUploading}
                className="flex-shrink-0"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Attach files</p>
            </TooltipContent>
          </Tooltip>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".c,.cpp,.csv,.docx,.html,.java,.json,.md,.pdf,.php,.pptx,.py,.rb,.tex,.txt,.css,.jpeg,.jpg,.js,.gif,.png,.ts,.xlsx"
          />

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... Shift+Enter for new line"
            className="flex-1 resize-none overflow-y-auto max-h-40 min-h-[40px] pr-10 text-sm leading-6"
            rows={1}
            disabled={isResponding || isUploading}
            style={{ height: '40px' }} // Initial height
          />

          {/* Send/Stop Button */}
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
            {/* Model Selector Dialog */}
            <Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isResponding || isUploading}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Model Settings</p>
                </TooltipContent>
              </Tooltip>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Model Selection</DialogTitle>
                </DialogHeader>
                <RadioGroup value={model} onValueChange={setModel} className="grid gap-4 py-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gpt-4o" id="gpt-4o" />
                    <Label htmlFor="gpt-4o">GPT-4o (OpenAI)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="claude-3-5-sonnet-20240620" id="claude-3.5-sonnet" />
                    <Label htmlFor="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</Label>
                  </div>
                  {/* Add more models as needed */}
                </RadioGroup>
                {/* Add other settings here if needed */}
              </DialogContent>
            </Dialog>

            {/* Send / Stop Button */}
            <AnimatePresence mode="wait">
              {isResponding ? (
                <motion.div
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleStopResponding}
                        className="h-8 w-8"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stop generating</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={(!input.trim() && selectedFiles.length === 0) || isUploading}
                        className="h-8 w-8"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send message</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;


