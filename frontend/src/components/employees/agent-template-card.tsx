"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface AgentTemplateCardProps {
  id: string
  name: string
  description: string
  icon: string
  category: string
  isSelected: boolean
  onClick: (id: string) => void
}

export function AgentTemplateCard({
  id,
  name,
  description,
  icon,
  category,
  isSelected,
  onClick,
}: AgentTemplateCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col p-4 rounded-lg border transition-all cursor-pointer h-[120px]",
        "hover:border-primary/50 hover:shadow-sm",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card"
      )}
      onClick={() => onClick(id)}
    >
      <div className="flex flex-row items-center mb-3">
        <div className="text-3xl min-w-[40px]">
          {icon}
        </div>
        <h3 className="font-medium text-base">{name}</h3>
      </div>
      <div className="pl-0 pb-1">
        <p className="text-sm line-clamp-2 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
} 