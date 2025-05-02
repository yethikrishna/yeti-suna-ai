"use client"

import React from "react"
import Link from "next/link"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Bug } from "lucide-react"

interface DebugLinkProps {
  tab?: "cache" | "prompt-diagnostic" | "system"
  tooltipPosition?: "top" | "right" | "bottom" | "left"
  variant?: "icon" | "text" | "badge"
  className?: string
}

export function DebugLink({
  tab = "prompt-diagnostic",
  tooltipPosition = "right",
  variant = "icon",
  className = ""
}: DebugLinkProps) {
  // Solo in development mode, altrimenti non mostrare nulla
  if (process.env.NODE_ENV !== "development") {
    return null
  }
  
  let content
  let url = `/debug${tab ? `?tab=${tab}` : ""}`
  
  switch (variant) {
    case "text":
      content = (
        <Link 
          href={url}
          className={`text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ${className}`}
          target="_blank"
        >
          <Bug className="h-3 w-3" />
          <span>Debug Console</span>
        </Link>
      )
      break
      
    case "badge":
      content = (
        <Link 
          href={url}
          className={`inline-flex h-6 items-center rounded-full border bg-muted px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted/80 ${className}`}
          target="_blank"
        >
          <Bug className="h-3 w-3 mr-1" />
          <span>Debug</span>
        </Link>
      )
      break
      
    case "icon":
    default:
      content = (
        <Link 
          href={url}
          className={`text-muted-foreground hover:text-foreground ${className}`}
          target="_blank"
        >
          <Bug className="h-4 w-4" />
        </Link>
      )
      break
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side={tooltipPosition} className="text-xs">
          <p>Apri la Console di Debug</p>
          {tab && <p className="text-muted-foreground text-[10px]">Tab: {tab}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 