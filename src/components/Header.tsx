import React from 'react';
import { RefreshCw, Radio, Database, Sun, Moon } from 'lucide-react';
import { BackendConfig } from '../types/carpark';

interface HeaderProps {
  activeTab: 'map' | 'directory' | 'nearby' | 'backend';
  setActiveTab: (tab: 'map' | 'directory' | 'nearby' | 'backend') => void;
  backendConfig: BackendConfig;
  onRefresh: () => void;
  isRefreshing: boolean;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  backendConfig,
  onRefresh,
  isRefreshing,
  isDark,
  setIsDark,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: 3 zones separated by gap-8 */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('map')}
              className="text-left group cursor-pointer focus-visible:outline-none"
            >
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                SG CarPark <span className="text-emerald-600 dark:text-emerald-400">Live</span>
              </span>
            </button>
          </div>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setActiveTab('map')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'map'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Live Map & Lots
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'directory'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Carpark Directory
            </button>
            <button
              onClick={() => setActiveTab('nearby')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'nearby'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nearby Finder
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'backend'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Backend API Spec</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle theme"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Updating...' : 'Refresh Lots'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2 py-1 ${activeTab === 'map' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Live Map
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-2 py-1 ${activeTab === 'directory' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`px-2 py-1 ${activeTab === 'nearby' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Nearby
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`px-2 py-1 ${activeTab === 'backend' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
          >
            Backend API
          </button>
        </div>
      </div>
    </header>
  );
};
