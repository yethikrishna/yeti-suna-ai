"use client"

import Link from "next/link"
import { Bot } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavAIEmployees() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>AI Employees</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/ai-employees">
              <Bot className="h-4 w-4" />
              <span>Template Gallery</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
} 