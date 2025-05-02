// FileBrowser 组件：用于浏览沙盒文件系统，支持文件夹导航、文件预览和选择文件等功能
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { File, Folder, ChevronRight, ChevronUp, FileText, Coffee } from "lucide-react";
import { listSandboxFiles, getSandboxFileContent, type FileInfo } from "@/lib/api";
import { toast } from "sonner";

// FileBrowser 组件的 props 类型定义
interface FileBrowserProps {
  sandboxId: string; // 沙盒唯一标识
  onSelectFile?: (path: string, content: string) => void; // 选择文件回调
  trigger?: React.ReactNode; // 触发按钮
}

// FileBrowser 组件实现
export function FileBrowser({ sandboxId, onSelectFile, trigger }: FileBrowserProps) {
  const [isOpen, setIsOpen] = useState(false); // 控制弹窗显示
  const [currentPath, setCurrentPath] = useState(""); // 当前目录路径
  const [files, setFiles] = useState<FileInfo[]>([]); // 当前目录下文件列表
  const [isLoading, setIsLoading] = useState(false); // 加载状态
  const [fileContent, setFileContent] = useState<string | null>(null); // 当前预览文件内容
  const [selectedFile, setSelectedFile] = useState<string | null>(null); // 当前选中文件路径
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]); // 面包屑导航
  
  // 弹窗打开时重置状态并加载根目录文件
  useEffect(() => {
    if (isOpen) {
      loadFiles("");
    } else {
      setFileContent(null);
      setSelectedFile(null);
    }
  }, [isOpen, sandboxId]);
  
  // 加载指定路径下的文件列表
  const loadFiles = async (path: string) => {
    setIsLoading(true);
    try {
      const files = await listSandboxFiles(sandboxId, path);
      setFiles(files);
      setCurrentPath(path);
      // 更新面包屑导航
      if (path === "") {
        setBreadcrumbs([]);
      } else {
        const parts = path.split('/').filter(Boolean);
        setBreadcrumbs(parts);
      }
    } catch (error) {
      toast.error("Failed to load files");
      console.error("Failed to load files:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 加载指定文件内容
  const loadFileContent = async (path: string) => {
    setIsLoading(true);
    setSelectedFile(path);
    try {
      const content = await getSandboxFileContent(sandboxId, path);
      if (typeof content === 'string') {
        setFileContent(content);
      } else {
        // 二进制文件显示提示
        setFileContent("[Binary file]");
      }
    } catch (error) {
      toast.error("Failed to load file content");
      console.error("Failed to load file content:", error);
      setFileContent(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 点击文件或文件夹
  const handleItemClick = (file: FileInfo) => {
    if (file.is_dir) {
      loadFiles(file.path);
    } else {
      loadFileContent(file.path);
    }
  };
  
  // 面包屑导航跳转
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // 根目录
      loadFiles("");
    } else {
      const path = breadcrumbs.slice(0, index + 1).join('/');
      loadFiles(path);
    }
  };
  
  // 选择文件按钮点击
  const handleSelectFile = () => {
    if (selectedFile && fileContent && onSelectFile) {
      onSelectFile(selectedFile, fileContent);
      setIsOpen(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Browse Files</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sandbox Files</DialogTitle>
        </DialogHeader>
        {/* 面包屑导航 */}
        <div className="flex items-center space-x-1 text-sm py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => navigateToBreadcrumb(-1)}
          >
            <Folder className="h-4 w-4 mr-1" />
            root
          </Button>
          {breadcrumbs.map((part, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => navigateToBreadcrumb(index)}
              >
                {part}
              </Button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* 文件列表 */}
          <div className="border rounded-md overflow-y-auto h-[400px]">
            {isLoading && !files.length ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Coffee className="h-8 w-8 mb-2" />
                <p>No files found</p>
              </div>
            ) : (
              <div className="p-2">
                {currentPath !== "" && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm mb-1"
                    onClick={() => {
                      const parentPath = currentPath.split('/').slice(0, -1).join('/');
                      loadFiles(parentPath);
                    }}
                  >
                    <ChevronUp className="h-4 w-4 mr-2" />
                    ..
                  </Button>
                )}
                {files.map((file) => (
                  <Button
                    key={file.path}
                    variant={selectedFile === file.path ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm mb-1"
                    onClick={() => handleItemClick(file)}
                  >
                    {file.is_dir ? (
                      <Folder className="h-4 w-4 mr-2" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    {file.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          {/* 文件预览 */}
          <div className="border rounded-md overflow-hidden flex flex-col">
            <div className="p-2 bg-muted text-sm font-medium border-b">
              {selectedFile ? selectedFile.split('/').pop() : "File Preview"}
            </div>
            <div className="p-2 overflow-y-auto flex-1 h-[360px]">
              {isLoading && selectedFile ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : fileContent ? (
                <pre className="whitespace-pre-wrap text-xs">{fileContent}</pre>
              ) : (
                <div className="text-muted-foreground text-xs">No file selected</div>
              )}
            </div>
            <div className="p-2 border-t flex justify-end">
              <Button onClick={handleSelectFile} disabled={!selectedFile || !fileContent}>
                Select File
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}