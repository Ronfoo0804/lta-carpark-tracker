import React, { useState } from 'react';
import { BackendConfig } from '../types/carpark';
import { testCustomBackendConnection } from '../services/carparkService';
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
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedSnippetTab, setSelectedSnippetTab] = useState<'node' | 'python' | 'curl'>('node');

  const handleTest = async () => {
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

  const nodeSnippet = `// Node.js + Express proxy server for Singapore Carpark Availability
// Fetch from LTA DataMall (CarParkAvailabilityv2) or Data.gov.sg
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// GET /api/carparks
app.get('/api/carparks', async (req, res) => {
  try {
    // Option 1: Data.gov.sg Public Carpark API
    const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
    const json = await response.json();
    
    // Returns real-time lot availability
    res.json({
      status: 'success',
      timestamp: json.items[0]?.timestamp,
      count: json.items[0]?.carpark_data?.length || 0,
      data: json.items[0]?.carpark_data || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log('Singapore Carpark API Server running on port 5000'));`;

  const pythonSnippet = `# Python FastAPI proxy server for Singapore Carpark API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="SG Carpark Proxy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/carparks")
async def get_carparks():
    url = "https://api.data.gov.sg/v1/transport/carpark-availability"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        data = resp.json()
        return {
            "status": "success",
            "timestamp": data.get("items", [{}])[0].get("timestamp"),
            "data": data.get("items", [{}])[0].get("carpark_data", [])
        }`;

  const curlSnippet = `# Direct curl test to Data.gov.sg API
curl -X GET "https://api.data.gov.sg/v1/transport/carpark-availability" \\
  -H "Accept: application/json"

# LTA DataMall v2 Carpark Availability (Requires AccountKey)
curl -X GET "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2" \\
  -H "AccountKey: YOUR_LTA_DATAMALL_KEY" \\
  -H "Accept: application/json"`;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Backend Connection & API Specifications</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              The front end is built with full TypeScript data models ready to plug directly into your backend service. You can toggle between the live simulation feed, direct Data.gov.sg API stream, or connect your custom Express/FastAPI proxy.
            </p>
          </div>
        </div>

        {/* Data Feed Mode Selector */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Active Data Stream Mode:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'demo_live' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'demo_live'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Real-Time Simulator
                </span>
                {config.mode === 'demo_live' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Continuous live car ingress/egress fluctuation every 3s across 28+ Singapore landmarks.
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'datagov_direct' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                Direct client-side fetch from Singapore Government open data (HDB & URA carparks).
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ ...config, mode: 'custom_endpoint' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                config.mode === 'custom_endpoint'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-600'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Custom Backend API
                </span>
                {config.mode === 'custom_endpoint' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Point to your own Node.js, Python, or Go server URL with health check verification.
              </p>
            </button>
          </div>
        </div>

        {/* Custom Endpoint Input and Test Button */}
        {config.mode === 'custom_endpoint' && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Backend API Endpoint URL:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:5000/api/carparks or https://api.yourdomain.com/carparks"
                className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <button
                onClick={handleTest}
                disabled={isTesting || !testUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold">
                    {testResult.success ? 'Backend Connection Successful!' : 'Connection Failed'}
                  </div>
                  <div className="mt-0.5 text-[11px]">
                    {testResult.success ? (
                      <span>HTTP {testResult.status} OK · Received {testResult.count} carpark records from backend.</span>
                    ) : (
                      <span>{testResult.error}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backend Implementation Code Templates */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ready-To-Run Backend Proxy Templates</span>
            </h4>
            <span className="text-xs text-slate-400">
              Copy-paste these snippets to set up your backend connection in minutes.
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSnippetTab('node')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'node'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Node.js
            </button>
            <button
              onClick={() => setSelectedSnippetTab('python')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'python'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Python FastAPI
            </button>
            <button
              onClick={() => setSelectedSnippetTab('curl')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedSnippetTab === 'curl'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              cURL / APIs
            </button>
          </div>
        </div>

        <div className="mt-4 relative">
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={() => {
                const code =
                  selectedSnippetTab === 'node'
                    ? nodeSnippet
                    : selectedSnippetTab === 'python'
                    ? pythonSnippet
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
            {selectedSnippetTab === 'node'
              ? nodeSnippet
              : selectedSnippetTab === 'python'
              ? pythonSnippet
              : curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
