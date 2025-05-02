"use client"

import React from "react"
import { PromptCustomizationDemo } from "@/components/employees/prompt-customization-demo"
import { DebugLink } from "@/components/debug/debug-link"

export default function DemoPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b py-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">SUNA</h1>
          <div className="flex items-center gap-4">
            <DebugLink variant="badge" tooltipPosition="bottom" />
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Personalizzazione Prompt</h2>
            <p className="text-muted-foreground">
              Questa pagina mostra come utilizzare la nuova funzionalità di personalizzazione dei prompt nella piattaforma SUNA.
            </p>
          </div>
          
          <PromptCustomizationDemo />
        </div>
      </main>
      
      <footer className="border-t py-6 bg-muted/20">
        <div className="container">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SUNA Platform
            </p>
            <div className="text-sm text-muted-foreground">
              <span>Environment: {process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 