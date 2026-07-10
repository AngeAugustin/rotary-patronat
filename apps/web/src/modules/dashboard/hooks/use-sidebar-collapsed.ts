import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore storage errors (private browsing, quota, etc.)
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((value) => !value);

  return { collapsed, setCollapsed, toggle };
}
