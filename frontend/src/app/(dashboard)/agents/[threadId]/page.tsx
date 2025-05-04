'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';


export const dynamic = 'force-dynamic';

export default function AgentThread({ params }: { params: { threadId: string } }) {
  const { threadId } = useParams<{ threadId: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!threadId) return;
    
    const initializeThread = async () => {
      try {
        setIsLoading(true);
        // Add your thread initialization logic here
      } catch (error) {
        console.error('Error initializing thread:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeThread();
  }, [threadId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 overflow-auto">
        {/* Add your thread content components here */}
      </div>
    </div>
  );
}