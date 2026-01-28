import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TIMEOUT_DURATION = 30 * 1000; // 30 seconds in milliseconds
const WARNING_BEFORE = 10 * 1000; // Warn 10 seconds before timeout

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const logout = async () => {
    await supabase.auth.signOut();
    toast.error('Session expired due to inactivity');
    navigate('/auth');
  };

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      toast.warning('Your session will expire in 2 minutes due to inactivity');
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    // Set logout timer
    timeoutRef.current = setTimeout(logout, TIMEOUT_DURATION);
  };

  useEffect(() => {
    // Only set up timeout if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        resetTimer();

        // Reset timer on user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
          window.addEventListener(event, resetTimer);
        });

        return () => {
          events.forEach(event => {
            window.removeEventListener(event, resetTimer);
          });
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (warningRef.current) clearTimeout(warningRef.current);
        };
      }
    };

    checkAuth();
  }, []);

  return { resetTimer };
};