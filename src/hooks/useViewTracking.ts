import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or get session ID from localStorage
const getSessionId = () => {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const useViewTracking = (pageType: string, pageId?: string) => {
  useEffect(() => {
    const trackView = async () => {
      try {
        const sessionId = getSessionId();
        
        await supabase.functions.invoke('track-view', {
          body: {
            pageType,
            pageId,
            sessionId
          }
        });
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    // Track view after a short delay to avoid spam
    const timer = setTimeout(trackView, 1000);
    
    return () => clearTimeout(timer);
  }, [pageType, pageId]);
};