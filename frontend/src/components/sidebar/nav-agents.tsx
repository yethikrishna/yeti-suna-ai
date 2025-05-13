'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ArrowUpRight,
  Edit,
  Link as LinkIcon,
  MoreHorizontal,
  Trash2,
  Plus,
  MessagesSquare,
  Loader2,
  Share2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { getProjects, getThreads, Project, Thread, createProject, createThread, deleteThread, updateThread, updateProject, deleteProject } from "@/lib/api"
import Link from "next/link"
import { ShareModal } from "./share-modal"
import { DeleteConfirmationDialog } from "@/components/thread/DeleteConfirmationDialog"
import { useDeleteOperation } from '@/contexts/DeleteOperationContext'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function NavAgents() {
  const { isMobile, state: sidebarState } = useSidebar()
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectThreads, setProjectThreads] = useState<Record<string, Thread[]>>({})
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [loadingProjectThreads, setLoadingProjectThreads] = useState<Record<string, boolean>>({})
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ threadId: string, projectId: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isNavigatingRef = useRef(false)
  const { performDelete, isOperationInProgress } = useDeleteOperation();
  const isPerformingActionRef = useRef(false);

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isSubmittingProject, setIsSubmittingProject] = useState(false)
  const newProjectInputRef = useRef<HTMLInputElement>(null)

  const [creatingThreadForProject, setCreatingThreadForProject] = useState<string | null>(null)

  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [currentRenameValue, setCurrentRenameValue] = useState<string>("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // --- Project Rename/Delete State ---
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [currentProjectRenameValue, setCurrentProjectRenameValue] = useState<string>("");
  const projectRenameInputRef = useRef<HTMLInputElement>(null);
  const [isProjectDeleteDialogOpen, setIsProjectDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const isDeletingProjectRef = useRef(false); // Ref to prevent double delete calls

  // --- Share Modal State ---
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedThreadIdToShare, setSelectedThreadIdToShare] = useState<string | null>(null);
  const [selectedProjectIdToShare, setSelectedProjectIdToShare] = useState<string | null>(null);

  const sortProjects = (projectList: Project[]): Project[] => {
    return [...projectList].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  };
  const sortThreads = (threadList: Thread[]): Thread[] => {
     return [...threadList].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
  };

  const loadProjects = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingProjects(true);
    try {
      const fetchedProjects = await getProjects();
      setProjects(sortProjects(fetchedProjects));
    } catch (err) {
      console.error('Error loading projects:', err);
      toast.error("Failed to load projects.");
      setProjects([]);
    } finally {
      if (showLoading) setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadProjects(true);
  }, [loadProjects]);

  const toggleProjectExpansion = useCallback(async (projectId: string) => {
    const isCurrentlyExpanded = !!expandedProjects[projectId];
    setExpandedProjects(prev => ({ ...prev, [projectId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !projectThreads[projectId] && !loadingProjectThreads[projectId]) {
      setLoadingProjectThreads(prev => ({ ...prev, [projectId]: true }));
      try {
        const fetchedThreads = await getThreads(projectId);
        setProjectThreads(prev => ({
          ...prev,
          [projectId]: sortThreads(fetchedThreads)
        }));
      } catch (err) {
        console.error(`Error loading threads for project ${projectId}:`, err);
        toast.error(`Failed to load threads for project.`);
      } finally {
        setLoadingProjectThreads(prev => ({ ...prev, [projectId]: false }));
      }
    }
  }, [expandedProjects, projectThreads, loadingProjectThreads]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isSubmittingProject) return;

    setIsSubmittingProject(true);
    try {
      const newProject = await createProject({ name: newProjectName.trim(), description: '' });
      if (newProject) {
        toast.success(`Project "${newProject.name}" created.`);
        setProjects(prev => sortProjects([newProject, ...prev]));
        setExpandedProjects(prev => ({...prev, [newProject.project_id]: false}));
        setIsCreatingProject(false);
        setNewProjectName('');
      } else {
        throw new Error("Project creation returned null.");
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCreateThread = async (projectId: string) => {
    if (creatingThreadForProject) return;

    setCreatingThreadForProject(projectId);
    try {
      const newThread = await createThread(projectId);
      if (newThread) {
        toast.success(`New conversation started.`);
        setProjectThreads(prev => ({
           ...prev,
           [projectId]: sortThreads([newThread, ...(prev[projectId] || [])])
        }));
        if (!expandedProjects[projectId]) {
           setExpandedProjects(prev => ({ ...prev, [projectId]: true }));
        }
        router.push(`/agents/${newThread.thread_id}`);
        setLoadingThreadId(newThread.thread_id);
      } else {
        throw new Error("Thread creation returned null.");
      }
    } catch (error) {
      console.error(`Error creating thread in project ${projectId}:`, error);
      toast.error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
       setCreatingThreadForProject(null);
    }
  };

  useEffect(() => {
    if (isCreatingProject && newProjectInputRef.current) {
      newProjectInputRef.current.focus();
    }
  }, [isCreatingProject]);

  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string) => {
    setLoadingThreadId(threadId);
  };

  const handleDeleteThread = async (threadId: string, threadName: string) => {
    setThreadToDelete({ id: threadId, name: threadName });
    setIsDeleteDialogOpen(true);
  };

  const handleStartRename = (thread: Thread) => {
    setRenamingThreadId(thread.thread_id);
    setCurrentRenameValue(thread.name || "");
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const handleCancelRename = () => {
    setRenamingThreadId(null);
    setCurrentRenameValue("");
  };

  const handleConfirmRename = async () => {
    if (!renamingThreadId || !currentRenameValue.trim()) {
      handleCancelRename();
      return;
    }

    const originalThread = projectThreads[
      Object.keys(projectThreads).find(pId => 
        projectThreads[pId]?.some(t => t.thread_id === renamingThreadId)
      ) || ''
    ]?.find(t => t.thread_id === renamingThreadId);

    if (originalThread?.name === currentRenameValue.trim()) {
       handleCancelRename();
       return;
    }

    const threadIdToRename = renamingThreadId;
    const newName = currentRenameValue.trim();
    setRenamingThreadId(null);

    const operationId = `rename-thread-${threadIdToRename}`;
    const toastId = toast.loading(`Renaming conversation to "${newName}"...`);

    try {
      const updatedThread = await updateThread(threadIdToRename, { name: newName });

      setProjectThreads(prev => {
        const projectId = updatedThread.project_id;
        if (!projectId || !prev[projectId]) {
            console.warn("Could not find project for updated thread in local state.");
            return prev;
        }
        const updatedThreads = prev[projectId].map(t =>
            t.thread_id === threadIdToRename ? { ...t, name: updatedThread.name, updated_at: updatedThread.updated_at } : t
        );
        return { ...prev, [projectId]: sortThreads(updatedThreads) };
      });

      toast.success(`Conversation renamed to "${updatedThread.name}".`, { id: toastId });
    } catch (error) {
      console.error('Error renaming thread:', error);
      toast.error(`Failed to rename conversation: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
        setCurrentRenameValue("");
    }
  };

  const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleConfirmRename();
    } else if (event.key === 'Escape') {
      handleCancelRename();
    }
  };

  const confirmDelete = async () => {
    if (!threadToDelete || isPerformingActionRef.current) return;

    isPerformingActionRef.current = true;
    setIsDeleteDialogOpen(false);

    const { id: threadId, name: threadName } = threadToDelete;
    const projectId = Object.keys(projectThreads).find(pId => projectThreads[pId]?.some(t => t.thread_id === threadId));

    console.log(`DELETION - Starting deletion for thread ${threadId} (name: ${threadName}, project: ${projectId})`);

    const operationId = `delete-thread-${threadId}`;
    const isThreadActive = pathname?.includes(threadId);

    try {
        await performDelete(
          operationId,
          isThreadActive ?? false,
          async () => {
            await deleteThread(threadId);
            console.log(`DELETION - API call successful for thread ${threadId}`);

            if (projectId) {
                setProjectThreads(prev => {
                    const updatedThreads = (prev[projectId] || []).filter(t => t.thread_id !== threadId);
                    return { ...prev, [projectId]: updatedThreads };
                });
                console.log(`DELETION - Removed thread ${threadId} from local state for project ${projectId}`);
            } else {
                 console.warn(`DELETION - Could not find project ID for deleted thread ${threadId} in local state.`);
            }
          }
        );
    } finally {
        setThreadToDelete(null);
        isPerformingActionRef.current = false;
        console.log(`DELETION - Process finished for thread ${threadId}`);
    }
  };

  // --- Project Rename/Delete Logic ---
  const handleStartProjectRename = (project: Project) => {
    setRenamingProjectId(project.project_id);
    setCurrentProjectRenameValue(project.name || "");
    setTimeout(() => projectRenameInputRef.current?.focus(), 0);
  };

  const handleCancelProjectRename = () => {
    setRenamingProjectId(null);
    setCurrentProjectRenameValue("");
  };

  const handleConfirmProjectRename = async () => {
    if (!renamingProjectId || !currentProjectRenameValue.trim()) {
      handleCancelProjectRename();
      return;
    }

    const originalProject = projects.find(p => p.project_id === renamingProjectId);
    if (originalProject?.name === currentProjectRenameValue.trim()) {
      handleCancelProjectRename();
      return;
    }

    const projectIdToRename = renamingProjectId;
    const newName = currentProjectRenameValue.trim();
    setRenamingProjectId(null); // Optimistic UI update

    const toastId = toast.loading(`Renaming project to "${newName}"...`);

    try {
      const updatedProject = await updateProject(projectIdToRename, { name: newName });
      setProjects(prev => sortProjects(prev.map(p =>
        p.project_id === projectIdToRename ? { ...p, name: updatedProject.name, updated_at: updatedProject.updated_at } : p
      )));
      toast.success(`Project renamed to "${updatedProject.name}".`, { id: toastId });
    } catch (error) {
      console.error('Error renaming project:', error);
      toast.error(`Failed to rename project: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
      // Revert optimistic UI update or re-enable input if needed
      setRenamingProjectId(projectIdToRename);
    } finally {
        setCurrentProjectRenameValue("");
    }
  };

  const handleProjectRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleConfirmProjectRename();
    } else if (event.key === 'Escape') {
      handleCancelProjectRename();
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete({ id: project.project_id, name: project.name || 'Unnamed Project' });
    setIsProjectDeleteDialogOpen(true);
  };

  const confirmProjectDelete = async () => {
    if (!projectToDelete || isDeletingProjectRef.current) return;

    isDeletingProjectRef.current = true;
    const { id: projectId, name: projectName } = projectToDelete;
    setIsProjectDeleteDialogOpen(false);

    // TODO: Improve delete operation state using useDeleteOperation or similar
    const toastId = toast.loading(`Deleting project "${projectName}"...`);

    try {
      await deleteProject(projectId);
      setProjects(prev => sortProjects(prev.filter(p => p.project_id !== projectId)));
      // Also remove related threads from local state if they exist
      setProjectThreads(prev => {
          const newState = {...prev};
          delete newState[projectId];
          return newState;
      });
       setExpandedProjects(prev => {
          const newState = {...prev};
          delete newState[projectId];
          return newState;
      });
      toast.success(`Project "${projectName}" deleted.`, { id: toastId });

       // TODO: Navigate away if the current view is related to the deleted project?
       // e.g., if (pathname.includes(projectId)) router.push('/dashboard');

    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(`Failed to delete project "${projectName}": ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
        setProjectToDelete(null);
        isDeletingProjectRef.current = false;
    }
  };
  // --- End Project Rename/Delete Logic ---

  // --- Share Modal Logic ---
  const handleOpenShareModal = (threadId: string, projectId: string) => {
    setSelectedThreadIdToShare(threadId);
    setSelectedProjectIdToShare(projectId); // Keep projectId for the modal for now
    setIsShareModalOpen(true);
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setSelectedThreadIdToShare(null);
    setSelectedProjectIdToShare(null);
  }

  if (isLoadingProjects) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarGroup>
           {!isCreatingProject && (
             <SidebarMenuAction className="justify-center">
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full"
                 onClick={() => setIsCreatingProject(true)}
               >
                 <Plus className="mr-2 h-4 w-4" /> New Project
               </Button>
             </SidebarMenuAction>
           )}

           {isCreatingProject && (
             <div className="p-2 space-y-2">
               <Input
                 ref={newProjectInputRef}
                 type="text"
                 placeholder="New project name..."
                 value={newProjectName}
                 onChange={(e) => setNewProjectName(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                 disabled={isSubmittingProject}
                 className="h-8 text-sm"
               />
               <div className="flex justify-end gap-2">
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsCreatingProject(false); setNewProjectName(''); }}
                    disabled={isSubmittingProject}
                 >
                   Cancel
                 </Button>
                 <Button
                    size="sm"
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || isSubmittingProject}
                 >
                   {isSubmittingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                 </Button>
               </div>
             </div>
           )}

           <SidebarGroupLabel>Projects</SidebarGroupLabel>

           {projects.length === 0 && !isCreatingProject && (
             <p className="text-xs text-muted-foreground px-4 py-2">No projects yet.</p>
           )}

           {projects.map((project) => {
             const isExpanded = !!expandedProjects[project.project_id];
             const isLoadingThreads = !!loadingProjectThreads[project.project_id];
             const threads = projectThreads[project.project_id] || [];
             const isCreatingThread = creatingThreadForProject === project.project_id;
             const isRenamingThisProject = renamingProjectId === project.project_id;

             return (
               <div key={project.project_id} className="mt-1">
                 <SidebarMenuItem
                    className={cn(
                      `group justify-between items-center pr-1`,
                      isExpanded && !isRenamingThisProject && 'bg-accent',
                      isRenamingThisProject ? 'cursor-default' : 'cursor-pointer'
                    )}
                    onClick={(e) => {
                      if (isRenamingThisProject) return;
                      e.preventDefault();
                      e.stopPropagation();
                      toggleProjectExpansion(project.project_id);
                    }}
                 >
                     <div className="flex items-center flex-grow overflow-hidden min-w-0">
                        {isExpanded ? <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />}
                        {isExpanded ? <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" /> : <Folder className="h-4 w-4 mr-2 flex-shrink-0" />}
                        {isRenamingThisProject ? (
                           <Input
                             ref={projectRenameInputRef}
                             value={currentProjectRenameValue}
                             onChange={(e) => setCurrentProjectRenameValue(e.target.value)}
                             onKeyDown={handleProjectRenameKeyDown}
                             onBlur={handleConfirmProjectRename}
                             onClick={(e) => e.stopPropagation()}
                             className="h-6 text-sm flex-grow mr-1"
                             autoFocus
                           />
                         ) : (
                           <span className="truncate flex-grow" title={project.name}>
                             {project.name || 'Unnamed Project'}
                           </span>
                         )}
                        {isLoadingThreads && <Loader2 className="h-4 w-4 animate-spin ml-2 flex-shrink-0" />}
                      </div>
                      {!isRenamingThisProject && sidebarState !== 'collapsed' && (
                         <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateThread(project.project_id);
                                      }}
                                      disabled={isCreatingThread}
                                    >
                                      {isCreatingThread ? <Loader2 className="h-3 w-3 animate-spin"/> : <Plus className="h-3 w-3" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">New Conversation</TooltipContent>
                              </Tooltip>
                              <DropdownMenu>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                       <DropdownMenuTrigger asChild>
                                          <Button
                                             variant="ghost"
                                             size="icon"
                                             className="h-6 w-6"
                                             onClick={(e) => e.stopPropagation()}
                                          >
                                             <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                       </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Project Options</TooltipContent>
                                 </Tooltip>
                                 <DropdownMenuContent side="right" align="start" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => handleStartProjectRename(project)}>
                                       <Edit className="mr-2 h-4 w-4" />
                                       <span>Rename Project</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                       className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                       onClick={() => handleDeleteProject(project)}
                                    >
                                       <Trash2 className="mr-2 h-4 w-4" />
                                       <span>Delete Project</span>
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                         </div>
                      )}
                 </SidebarMenuItem>

                 {isExpanded && (
                     <div className="pl-4 border-l border-muted ml-[13px] py-1">
                        {isLoadingThreads && (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!isLoadingThreads && threads.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1 italic">No conversations yet.</p>
                        )}
                        {!isLoadingThreads && threads.map((thread) => {
                            const isActive = pathname?.includes(thread.thread_id);
                            const isLoadingNav = loadingThreadId === thread.thread_id;
                            const url = `/agents/${thread.thread_id}`;
                            const threadDisplayName = thread.name || `Conv. ${thread.thread_id.substring(0, 8)}...`;
                            const fullThreadTitle = thread.name || `Conversation ${thread.thread_id}`;
                            const isRenamingThisThread = renamingThreadId === thread.thread_id;

                            return (
                              <SidebarMenuItem
                                key={thread.thread_id}
                                className="group justify-between items-center pr-1 text-sm"
                              >
                                <div className="flex items-center justify-between w-full gap-1">
                                 {isRenamingThisThread ? (
                                    <Input
                                      ref={renameInputRef}
                                      value={currentRenameValue}
                                      onChange={(e) => setCurrentRenameValue(e.target.value)}
                                      onKeyDown={handleRenameKeyDown}
                                      onBlur={handleConfirmRename}
                                      className="h-7 text-sm flex-grow mr-1"
                                      autoFocus
                                    />
                                  ) : (
                                    <Link
                                      href={url}
                                      onClick={(e) => handleThreadClick(e, thread.thread_id)}
                                      className={cn(
                                        "flex items-center flex-grow overflow-hidden rounded-md px-2 py-1 hover:bg-accent",
                                        isActive && "bg-accent font-medium"
                                      )}
                                      data-active={isActive}
                                      title={fullThreadTitle}
                                    >
                                      {isLoadingNav ? (
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin flex-shrink-0" />
                                      ) : (
                                        <MessagesSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                                      )}
                                      <span className="truncate flex-grow" title={fullThreadTitle}>
                                        {threadDisplayName}
                                      </span>
                                    </Link>
                                  )}

                                  {!isRenamingThisThread && sidebarState !== 'collapsed' && (
                                    <DropdownMenu>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">Options</TooltipContent>
                                      </Tooltip>
                                      <DropdownMenuContent side="right" align="start" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem onClick={() => handleStartRename(thread)}>
                                          <Edit className="mr-2 h-4 w-4" />
                                          <span>Rename</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleOpenShareModal(thread.thread_id, project.project_id)}>
                                          <Share2 className="mr-2 h-4 w-4" />
                                          <span>Share</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                          onClick={() => handleDeleteThread(thread.thread_id, threadDisplayName)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Delete</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </SidebarMenuItem>
                            );
                          })}
                     </div>
                  )}
               </div>
             );
           })}
        </SidebarGroup>
      </SidebarMenu>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        threadName={threadToDelete?.name ?? 'this conversation'}
        isDeleting={isOperationInProgress.current}
      />

      {/* Confirmation Dialog for Project Deletion */}
      <DeleteConfirmationDialog
        isOpen={isProjectDeleteDialogOpen}
        onClose={() => setIsProjectDeleteDialogOpen(false)}
        onConfirm={confirmProjectDelete}
        threadName={`project "${projectToDelete?.name ?? 'this project'}"`}
        isDeleting={isDeletingProjectRef.current}
        title="Delete Project"
        description={`Are you sure you want to delete the project "${projectToDelete?.name ?? 'this project'}" and all its conversations? This action cannot be undone.`}
      />

      {/* Share Modal Instance */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        threadId={selectedThreadIdToShare ?? undefined}
        projectId={selectedProjectIdToShare ?? undefined}
      />
    </>
  );
}
