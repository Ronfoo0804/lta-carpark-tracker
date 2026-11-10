import React, { useState, useEffect } from 'react';
import { BackendConfig } from '../types/carpark';
import {
  testCustomBackendConnection,
  checkApiHealth,
  fetchLtaDataMallAvailability,
} from '../services/carparkService';
import {
  Database,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Server,
  Play,
  ExternalLink,
  Code2,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface BackendIntegrationModalProps {
  config: BackendConfig;
  onUpdateConfig: (newConfig: BackendConfig) => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [testUrl, setTestUrl] = useState(config.customEndpointUrl || 'http://localhost:5000/api/carparks');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    count?: number;
    error?: string;
    sampleData?: unknown;
  } | null>(null);

  // Serverless /api/health and /api/carparkavailability state
  const [healthInfo, setHealthInfo] = useState<{
    status: string;
    ltaDataMallKeyConfigured: boolean;
    timestamp?: string;
    message?: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [serverlessTestResult, setServerlessTestResult] = useState<{
    success: boolean;
    status: number;
    totalRecords?: number;
    error?: string;
    source?: string;
  } | null>(null);
  const [isTestingServerless, setIsTestingServerless] = useState(false);

  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'lta_serverless' | 'env' | 'curl'>('lta_serverless');

  // Load health check on mount
  useEffect(() => {
    refreshHealth();
  }, []);

  const refreshHealth = async () => {
    setIsCheckingHealth(true);
    const data = await checkApiHealth();
    setHealthInfo(data);
    setIsCheckingHealth(false);
  };

  const handleTestServerless = async () => {
    setIsTestingServerless(true);
    setServerlessTestResult(null);
    const res = await fetchLtaDataMallAvailability();
    setServerlessTestResult(res);
    setIsTestingServerless(false);

    if (res.success) {
      onUpdateConfig({
        ...config,
        mode: 'lta_datamall',
        connectionStatus: 'connected',
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleTestCustom = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testCustomBackendConnection(testUrl);
    setTestResult(res);
    setIsTesting(false);
    if (res.success) {
      onUpdateConfig({
        ...config,
        customEndpointUrl: testUrl,
        connectionStatus: 'connected',
        lastSyncTime: new Date().toLocaleTimeString(),
      });
    } else {
      onUpdateConfig({
        ...config,
        connectionStatus: 'error',
        errorMessage: res.error,
      });
    }
  };

  const copyCode = (code: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const serverlessSnippet = `// /api/carparkavailability.ts (Serverless Handler at Project Root)
// Pulls live carpark lots (HDB + LTA + URA) from LTA DataMall
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
// Header: AccountKey: <Your Key> (Read from process.env.LTA_DATAMALL_KEY)

import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const accountKey = process.env.LTA_DATAMALL_KEY || req.headers['accountkey'] || '';

  if (!accountKey) {
    return res.status(401).json({
      status: 'error',
      message: 'AccountKey missing. Please set LTA_DATAMALL_KEY in your environment.'
    });
  }

  const response = await fetch(
    'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    }
  );

  const json = await response.json();
  res.status(200).json({
    status: 'success',
    totalRecords: json.value?.length || 0,
    data: json.value || []
  });
}`;

  const envSnippet = `# Add this to your .env or server environment:
LTA_DATAMALL_KEY="YOUR_LTA_DATAMALL_ACCOUNT_KEY"

# Optional port config
PORT=3000`;

  const curlSnippet = `# 1. Test Serverless Health Check
curl -X GET "http://localhost:3000/api/health"

# 2. Test Serverless Carpark Availability (Proxies to LTA DataMall)
curl -X GET "http://localhost:3000/api/carparkavailability"

# 3. Direct curl with custom AccountKey header
curl -X GET "http://localhost:3000/api/carparkavailability" \\
  -H "AccountKey: YOUR_ACCOUNT_KEY"`;

  return (
    <div className="space-y-6">
      {/* Serverless Connection Status Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Serverless LTA DataMall Connection
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time serverless functions located at <code className="text-emerald-600 dark:text-emerald-400 font-mono">/api/health.ts</code> and <code className="text-emerald-600 dark:text-emerald-400 font-mono">/api/carparkavailability.ts</code>.
            </p>
          </div>

          <button
            onClick={refreshHealth}
            disabled={isCheckingHealth}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>
        </div>

        {/* Health State Card */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                LTA DataMall AccountKey Status
              </span>
              {healthInfo?.ltaDataMallKeyConfigured ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Key className="w-4 h-4" /> Pending Key
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {healthInfo?.ltaDataMallKeyConfigured
                ? 'AccountKey is detected in environment (LTA_DATAMALL_KEY). Calls to /api/carparkavailability are authorized.'
                : 'No key detected yet. You can add LTA_DATAMALL_KEY to your .env file or environment variables at any time.'}
            </p>

            <div className="pt-2">
              <button
                onClick={handleTestServerless}
                disabled={isTestingServerless}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingServerless ? 'Querying /api/carparkavailability...' : 'Test /api/carparkavailability'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Active Endpoints in /api
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span>
                <span className="text-slate-800 dark:text-slate-200">/api/health</span>
                <span className="text-slate-400 font-sans text-[10px]">Diagnostics</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">GET</span>
                <span className="text-slate-800 dark:text-slate-200">/api/carparkavailability</span>
                <span className="text-slate-400 font-sans text-[10px]">Live HDB+LTA+URA</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Supports <code className="font-mono text-slate-700 dark:text-slate-300">?fetchAll=true</code>, <code className="font-mono text-slate-700 dark:text-slate-300">?agency=HDB</code>, and <code className="font-mono text-slate-700 dark:text-slate-300">?skip=0</code>.
            </div>
          </div>
        </div>

        {/* Serverless Test Output */}
        {serverlessTestResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              serverlessTestResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            {serverlessTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-bold">
                {serverlessTestResult.success
                  ? 'Serverless Endpoint Returned Live LTA Data!'
                  : `Endpoint Response: HTTP ${serverlessTestResult.status}`}
              </div>
              <div className="mt-0.5 text-[11px]">
                {serverlessTestResult.success ? (
                  <span>
                    Successfully received {serverlessTestResult.totalRecords} records from LTA DataMall (CarParkAvailabilityv2).
                  </span>
                ) : (
                  <span>
                    {serverlessTestResult.error}
                    <br />
                    <em>(When you add your AccountKey to your environment, live records will stream directly here.)</em>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feed Mode Selector */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Switch Active Frontend Data Feed:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'lta_datamall' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'lta_datamall'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  LTA Serverless API
                </span>
                {config.mode === 'lta_datamall' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                /api/carparkavailability (HDB, LTA, URA via DataMall).
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'demo_live' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'demo_live'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Live Simulator
                </span>
                {config.mode === 'demo_live' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Real-time simulated lot movement across 28+ Singapore landmarks.
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'datagov_direct' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'datagov_direct'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Data.gov.sg Direct
                </span>
                {config.mode === 'datagov_direct' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Direct client-side fetch from Singapore Gov open data.
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'custom_endpoint' })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'custom_endpoint'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Custom Endpoint
                </span>
                {config.mode === 'custom_endpoint' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Point to external proxy URL.
              </p>
            </button>
          </div>
        </div>

        {/* Custom Endpoint URL field */}
        {config.mode === 'custom_endpoint' && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Custom Endpoint URL:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:5000/api/carparks"
                className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={handleTestCustom}
                disabled={isTesting || !testUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Code Snippets Viewer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Implementation & Reference Code</span>
            </h4>
            <span className="text-xs text-slate-400">
              Serverless handler implementation at /api/carparkavailability.ts
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSnippetTab('lta_serverless')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'lta_serverless'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              /api/carparkavailability.ts
            </button>
            <button
              onClick={() => setSelectedSnippetTab('env')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'env'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              .env Config
            </button>
            <button
              onClick={() => setSelectedSnippetTab('curl')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'curl'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              cURL Tests
            </button>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={() => {
                const code =
                  selectedSnippetTab === 'lta_serverless'
                    ? serverlessSnippet
                    : selectedSnippetTab === 'env'
                    ? envSnippet
                    : curlSnippet;
                copyCode(code, selectedSnippetTab);
              }}
              className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors flex items-center gap-1 shadow cursor-pointer"
            >
              {copiedSnippet === selectedSnippetTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 max-h-80 leading-relaxed">
            {selectedSnippetTab === 'lta_serverless'
              ? serverlessSnippet
              : selectedSnippetTab === 'env'
              ? envSnippet
              : curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
