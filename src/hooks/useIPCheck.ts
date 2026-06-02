import { useState, useEffect } from 'react';
import { checkIPBlockedServerSide } from '../utils/ip';

interface IPCheckResult {
  isBlocked: boolean;
  isLoading: boolean;
  clientIP: string;
}

export function useIPCheck() {
  const [result, setResult] = useState<IPCheckResult>({
    isBlocked: false,
    isLoading: true,
    clientIP: '',
  });

  useEffect(() => {
    let mounted = true;

    const checkIP = async () => {
      try {
        const { blocked, ip } = await checkIPBlockedServerSide();

        if (!mounted) return;

        setResult({
          isBlocked: blocked,
          isLoading: false,
          clientIP: ip,
        });
      } catch {
        if (mounted) {
          setResult({
            isBlocked: false,
            isLoading: false,
            clientIP: '',
          });
        }
      }
    };

    checkIP();

    return () => {
      mounted = false;
    };
  }, []);

  return result;
}
