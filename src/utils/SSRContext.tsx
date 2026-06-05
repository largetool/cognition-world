'use client';

import { createContext, useContext } from 'react';

// SSR 预取数据：getServerSideProps 注入到 UserPage
export interface SSRPageData {
  ssrUserId?: string;
  ssrProfile?: any;
  ssrLogs?: any[];
  ssrActiveBg?: { url: string } | null;
  ssrNotFound?: boolean;
}

export const SSRDataContext = createContext<SSRPageData>({});

export function useSSRData(): SSRPageData {
  return useContext(SSRDataContext);
}
