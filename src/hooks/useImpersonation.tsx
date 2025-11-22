import { useState, useEffect } from 'react';

interface ImpersonationData {
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
}

export const useImpersonation = () => {
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    const checkImpersonation = () => {
      const data = localStorage.getItem('impersonation');
      if (data) {
        setImpersonation(JSON.parse(data));
      } else {
        setImpersonation(null);
      }
    };

    checkImpersonation();
    
    // Listen for storage changes (in case user exits impersonation in another tab)
    window.addEventListener('storage', checkImpersonation);
    
    return () => window.removeEventListener('storage', checkImpersonation);
  }, []);

  const exitImpersonation = () => {
    localStorage.removeItem('impersonation');
    setImpersonation(null);
  };

  return {
    isImpersonating: !!impersonation,
    impersonationData: impersonation,
    exitImpersonation
  };
};
