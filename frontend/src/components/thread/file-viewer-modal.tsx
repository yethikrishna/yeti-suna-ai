"use client";

import { useState, useEffect, useRef, Fragment, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  File,
  Folder,
  FolderOpen,
  Upload,
  Download,
  ChevronRight,
  Home,
  ChevronLeft,
  Loader,
  AlertTriangle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileRenderer, getFileTypeFromExtension } from "@/components/file-renderers";
import { listSandboxFiles, getSandboxFileContent, type FileInfo, Project } from "@/lib/api";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

// Define API_URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  agentId: string;
  project: Project | null;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  threadId,
  agentId,
  project,
}) => {
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isFileContentLoading, setIsFileContentLoading] = useState<boolean>(false);
  const [isFileContentError, setIsFileContentError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(["."]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const fetchFiles = useCallback(async (path: string, updateHistory = true) => {
    if (!project?.sandbox_id) {
      setError("Sandbox not available for this project.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFiles = await listSandboxFiles(project.sandbox_id, path);
      // Sort files: folders first, then alphabetically
      fetchedFiles.sort((a, b) => {
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(fetchedFiles);
      setCurrentPath(path);
      if (updateHistory) {
        const newHistory = history.slice(0, historyIndex + 1);
        if (newHistory[newHistory.length - 1] !== path) {
          newHistory.push(path);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      }
    } catch (err: any) {
      setError(`Failed to load files: ${err.message}`);
      toast.error(`Failed to load files: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [project?.sandbox_id, history, historyIndex]);

  useEffect(() => {
    if (isOpen && project?.sandbox_id) {
      fetchFiles(currentPath, false); // Fetch initial or current path without updating history on open
    }
  }, [isOpen, project?.sandbox_id, fetchFiles, currentPath]);

  const handleItemClick = (item: FileInfo) => {
    if (item.is_dir) {
      const newPath = `${currentPath}/${item.name}`.replace(/\/\//g, "/");
      fetchFiles(newPath);
    } else {
      handleFileSelect(item);
    }
  };

  const handleFileSelect = async (file: FileInfo) => {
    if (!project?.sandbox_id) return;
    setSelectedFile(file);
    setIsFileContentLoading(true);
    setIsFileContentError(null);
    setFileContent(null);
    try {
      const content = await getSandboxFileContent(project.sandbox_id, `${currentPath}/${file.name}`.replace(/\/\//g, "/"));
      setFileContent(content);
    } catch (err: any) {
      setIsFileContentError(`Failed to load file content: ${err.message}`);
      toast.error(`Failed to load file content: ${err.message}`);
    } finally {
      setIsFileContentLoading(false);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      fetchFiles(history[newIndex], false);
      setSelectedFile(null); // Clear file selection when navigating back
      setFileContent(null);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      fetchFiles(history[newIndex], false);
      setSelectedFile(null); // Clear file selection when navigating forward
      setFileContent(null);
    }
  };

  const handleHome = () => {
    fetchFiles(".");
    setSelectedFile(null);
    setFileContent(null);
  };

  const handlePathSegmentClick = (index: number) => {
    const segments = currentPath.split("/").filter(Boolean);
    const newPath = index === -1 ? "." : `./${segments.slice(0, index + 1).join("/")}`;
    fetchFiles(newPath);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!project?.sandbox_id) return;
    if (event.target.files && event.target.files.length > 0) {
      const filesToUpload = Array.from(event.target.files);
      setIsUploading(true);
      setError(null);
      let uploadSuccess = true;

      try {
        for (const file of filesToUpload) {
          const filePath = `${currentPath}/${file.name}`.replace(/\/\//g, "/");
          const { error: uploadError } = await supabase.storage
            .from("sandbox_files") // Assuming a bucket named sandbox_files
            .upload(filePath, file, { upsert: true }); // Use upsert to overwrite if exists

          if (uploadError) {
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          // Now, inform the backend API to copy the file from storage to the sandbox
          const response = await fetch(`${API_URL}/sandbox/${project.sandbox_id}/files`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "upload",
              source_path: filePath, // Path in Supabase storage
              destination_path: filePath, // Path in the sandbox
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            // Attempt to clean up the uploaded file from storage if sandbox copy fails
            await supabase.storage.from("sandbox_files").remove([filePath]);
            throw new Error(
              `Failed to copy ${file.name} to sandbox: ${errorData.detail || response.statusText}`
            );
          }
        }
        toast.success(`${filesToUpload.length} file(s) uploaded successfully to ${currentPath}.`);
        fetchFiles(currentPath, false); // Refresh file list
      } catch (err: any) {
        setError(`Upload failed: ${err.message}`);
        toast.error(`Upload failed: ${err.message}`);
        uploadSuccess = false;
      } finally {
        setIsUploading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleDownload = async (item: FileInfo) => {
    if (!project?.sandbox_id) return;
    const filePath = `${currentPath}/${item.name}`.replace(/\/\//g, "/");
    try {
      // 1. Request backend to copy file from sandbox to Supabase storage
      const copyResponse = await fetch(`${API_URL}/sandbox/${project.sandbox_id}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "prepare_download",
          source_path: filePath, // Path in sandbox
          destination_path: `downloads/${project.sandbox_id}/${Date.now()}_${item.name}`, // Temporary path in storage
        }),
      });

      if (!copyResponse.ok) {
        const errorData = await copyResponse.json();
        throw new Error(
          `Failed to prepare download: ${errorData.detail || copyResponse.statusText}`
        );
      }

      const { storage_path: tempStoragePath } = await copyResponse.json();

      // 2. Get signed URL for the file in storage
      const { data: urlData, error: urlError } = await supabase.storage
        .from("sandbox_files")
        .createSignedUrl(tempStoragePath, 60); // URL valid for 60 seconds

      if (urlError) {
        throw new Error(`Failed to get download URL: ${urlError.message}`);
      }

      // 3. Trigger download in browser
      const link = document.createElement("a");
      link.href = urlData.signedUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${item.name}...`);

      // 4. Optional: Clean up the temporary file in storage after a delay
      setTimeout(async () => {
        await supabase.storage.from("sandbox_files").remove([tempStoragePath]);
      }, 70000); // 70 seconds

    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
      toast.error(`Download failed: ${err.message}`);
    }
  };

  const renderBreadcrumbs = () => {
    const segments = currentPath.split("/").filter(Boolean);
    return (
      <div className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap py-1">
        <button
          onClick={() => handlePathSegmentClick(-1)}
          className="hover:text-foreground hover:underline"
        >
          <Home className="h-4 w-4 inline-block mr-1" />
          Root
        </button>
        {segments.map((segment, index) => (
          <Fragment key={index}>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <button
              onClick={() => handlePathSegmentClick(index)}
              className={`hover:text-foreground hover:underline ${index === segments.length - 1 ? "text-foreground font-medium" : ""}`}
            >
              {segment}
            </button>
          </Fragment>
        ))}
      </div>
    );
  };

  const renderFileIcon = (item: FileInfo) => {
    if (item.is_dir) {
      return <Folder className="h-5 w-5 text-sky-500 flex-shrink-0" />;
    }
    const fileType = getFileTypeFromExtension(item.name.split(".").pop() || "");
    switch (fileType) {
      case "image":
        return <FileText className="h-5 w-5 text-purple-500 flex-shrink-0" />; // Placeholder, maybe specific image icon
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />;
      case "code":
        return <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />; // Placeholder, maybe specific code icon
      case "text":
        return <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />;
      default:
        return <File className="h-5 w-5 text-gray-400 flex-shrink-0" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Sandbox File Explorer</DialogTitle>
        </DialogHeader>

        <div className="flex items-center p-2 border-b space-x-1 bg-muted/50">
          <Button variant="ghost" size="icon" onClick={handleBack} disabled={historyIndex === 0 || isLoading}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleForward} disabled={historyIndex === history.length - 1 || isLoading}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleHome} disabled={currentPath === "." || isLoading}>
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex-grow px-2">{renderBreadcrumbs()}</div>
          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isLoading || isUploading}>
            {isUploading ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </div>

        {error && (
          <div className="p-4 text-red-600 bg-red-100 border-b border-red-200 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" /> {error}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* File List Pane */}
          <ScrollArea className="w-1/3 border-r h-full">
            <div className="p-2">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 flex-grow" />
                  </div>
                ))
              ) : files.length === 0 && !error ? (
                <div className="text-center text-muted-foreground p-4">Empty directory</div>
              ) : (
                files.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between space-x-3 p-2 rounded-md cursor-pointer hover:bg-muted ${selectedFile?.name === item.name && !item.is_dir ? "bg-muted font-medium" : ""}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {renderFileIcon(item)}
                      <span className="truncate text-sm" title={item.name}>{item.name}</span>
                    </div>
                    {!item.is_dir && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          {/* Add other actions like rename, delete here */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* File Content Pane */}
          <ScrollArea className="w-2/3 h-full">
            <div className="p-4 h-full">
              {selectedFile && !selectedFile.is_dir ? (
                isFileContentLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : isFileContentError ? (
                  <div className="text-red-600 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" /> {isFileContentError}
                  </div>
                ) : fileContent !== null ? (
                  <FileRenderer
                    fileName={selectedFile.name}
                    fileContent={fileContent}
                  />
                ) : (
                  <div className="text-muted-foreground">Could not load file content.</div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to view its content
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerModal;

