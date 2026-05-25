/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSiteData, SiteData } from '../services/siteService';

interface SiteContextType {
  siteData: SiteData | null;
  loading: boolean;
  error: string | null;
  refreshSiteData: () => Promise<void>;
}

export const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      const response = await getSiteData();
      if (response.success && response.data) {
        setSiteData(response.data);
        
        // Apply theme variables if present - Robust mapping from Admin to CSS
        if (response.data.uiTheme?.webMain) {
          const root = document.documentElement;
          const theme = response.data.uiTheme.webMain;
          
          const themeMapping: Record<string, string> = {
            // Admin Key: CSS Variable
            primaryColor: '--primary',
            accentColor: '--accent-red',
            backgroundColor: '--bg-main',
            panelColor: '--fin-surface',
            surfaceColor: '--brand-surface',
            textColor: '--text-gray',
            mutedTextColor: '--text-muted',
          };

          Object.entries(theme).forEach(([key, value]) => {
            if (value) {
              // 1. Check if it's a direct CSS variable (starts with --)
              if (key.startsWith('--')) {
                root.style.setProperty(key, value as string);
              } 
              // 2. Check mapping table
              else if (themeMapping[key]) {
                root.style.setProperty(themeMapping[key], value as string);
              }
              // 3. Fallback: convert camelCase to kebab-case
              else {
                const cssKey = `--${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
                root.style.setProperty(cssKey, value as string);
              }
            }
          });
        }
      } else {
        setError(response.message || 'Failed to load site settings');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching site data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, []);

  return (
    <SiteContext.Provider value={{ siteData, loading, error, refreshSiteData: fetchSiteData }}>
      {children}
    </SiteContext.Provider>
  );
};
