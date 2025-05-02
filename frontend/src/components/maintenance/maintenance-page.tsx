"use client"

import { useEffect, useState } from "react"
import { Loader2, Server, RefreshCw, AlertCircle } from "lucide-react"
import { checkApiHealth } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MaintenancePage() {
  const [isCheckingHealth, setIsCheckingHealth] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsCheckingHealth(true)
    try {
      await checkApiHealth()
      // If we get here, the API is healthy
      window.location.reload()
    } catch (error) {
      console.error('API health check failed:', error)
    } finally {
      setIsCheckingHealth(false)
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkHealth()
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Server className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">
            系统维护中
          </h1>
          
          <p className="text-muted-foreground">
            我们正在对系统进行维护。我们的团队正在努力使所有功能尽快恢复正常运行。感谢您的耐心等待。
          </p>

          <Alert className="mt-6">
            <AlertTitle>AI 智能助手已暂停</AlertTitle>
            <AlertDescription>
              所有正在运行的 AI 智能助手已在维护期间暂停。系统恢复在线后，您需要手动重新启动这些任务。
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-4">
          <Button
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="w-full"
          >
            <RefreshCw className={cn(
              "mr-2 h-4 w-4",
              isCheckingHealth && "animate-spin"
            )} />
            {isCheckingHealth ? "检查中..." : "再次检查"}
          </Button>

          {lastChecked && (
            <p className="text-sm text-muted-foreground">
              上次检查时间: {lastChecked.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}