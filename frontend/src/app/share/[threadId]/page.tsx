'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default function SharePage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [thread, setThread] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) return;

    const fetchSharedThread = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API call to fetch the shared thread
        const response = await fetch(`/api/share/${threadId}`);

        if (!response.ok) {
          throw new Error('Failed to load shared thread');
        }

        const data = await response.json();
        setThread(data);
      } catch (error) {
        console.error('Error fetching shared thread:', error);
        setError('This shared thread could not be loaded or does not exist.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedThread();
  }, [threadId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="space-y-2 mt-8">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Thread Not Available</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen p-4">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{thread?.title || 'Shared Conversation'}</h1>

        <div className="space-y-4">
          {thread?.messages?.map((message: any, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-muted ml-auto'
                  : 'bg-primary/10'
              }`}
            >
              <div className="font-medium mb-1">
                {message.role === 'user' ? 'User' : 'Assistant'}
              </div>
              <div>{message.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}