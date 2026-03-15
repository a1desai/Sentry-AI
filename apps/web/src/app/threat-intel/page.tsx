'use client';

import { useState } from 'react';
import { Search, Globe, Shield, Activity, Database, AlertCircle, CheckCircle2, Info, RefreshCw, Zap } from 'lucide-react';
import { ThreatIntelResult } from '@sentry/shared';
import { apiFetch } from '@/lib/api';
import { GlobalHeatmap } from '@/components/dashboard/GlobalHeatmap';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThreatIntelPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ip' | 'domain' | 'url' | 'file_hash'>('ip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatIntelResult | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<{ result: ThreatIntelResult }>('/api/cases/threat-intel/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type }),
      });
      setResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-10 max-w-7xl mx-auto w-full space-y-10"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.4em]">
            <Globe className="w-3 h-3" />
            <span>Global Threat Intelligence Center</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Threat <span className="text-blue-500 italic">Intel</span></h1>
          <p className="text-slate-500 font-bold text-sm">Cross-shard reputation analytics and infrastructure profiling</p>
        </div>
        
        <div className="flex items-center space-x-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
           <div className="p-2 border border-white/5 rounded-lg bg-white/5">DB_SYNC: OK</div>
           <div className="p-2 border border-white/5 rounded-lg bg-white/5 text-blue-400">UPTIME: 99.9%</div>
        </div>
      </div>

      <div className="mb-10">
        <GlobalHeatmap />
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left: Intelligence Controller */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            
            <h2 className="font-black text-white uppercase tracking-[0.2em] text-xs mb-8 flex items-center">
              <Zap className="w-4 h-4 mr-3 text-blue-400" /> Indicator Probe
            </h2>
            
            <form onSubmit={handleLookup} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Target Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  {['ip', 'domain', 'url', 'file_hash'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t as typeof type)}
                      className={`px-4 py-3 rounded-2xl text-[10px] font-black border transition-all duration-300 ${
                        type === t 
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_#3b82f622]' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      {t.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Indicator Telemetry</label>
                <div className="relative group">
                  <input 
                    type="text"
                    placeholder={type === 'ip' ? 'e.g. 185.220.x.x' : type === 'domain' ? 'e.g. suspicious.net' : 'Enter value...'}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border-glow"
                  />
                  <div className="absolute right-4 top-4 text-slate-700">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !query}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Execute Reputation Scan'}
              </motion.button>
            </form>
          </div>

          <div className="glass-card rounded-[2rem] p-8 border border-blue-500/10 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30" />
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-600/10 rounded-xl text-blue-400">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                Sentry Intelligence Bridge aggregates cross-vetted telemetry from VirusTotal, Moorcheh DB, and IPInfo to provide deterministic reputation scores.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Operations Center View */}
        <div className="col-span-12 lg:col-span-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Result Header HUD */}
                <div className={`glass-card p-10 rounded-[2.5rem] border relative overflow-hidden flex items-center justify-between ${
                  result.severity === 'MALICIOUS' ? 'border-red-500/20' : 'border-green-500/20'
                }`}>
                  {/* Neon Glow */}
                  <div className={`absolute -right-20 -top-20 w-64 h-64 blur-[100px] opacity-20 ${
                    result.severity === 'MALICIOUS' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  
                  <div className="flex items-center space-x-8 relative z-10">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 ${
                      result.severity === 'MALICIOUS' ? 'bg-red-600 shadow-red-900/40' : 'bg-green-600 shadow-green-900/40'
                    }`}>
                      {result.severity === 'MALICIOUS' ? <AlertCircle className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase">
                          {result.severity}
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">Confidence: {result.reputation}</span>
                      </div>
                      <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center capitalize">
                         <Database className="w-3.5 h-3.5 mr-2 text-blue-500" />
                         Engine: {result.provider} Intelligence Shard
                      </p>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observation Protocol</div>
                    <div className="text-xs font-black text-blue-400 uppercase tracking-tighter">LIVE_TELEMETRY_STREAM</div>
                  </div>
                </div>

                {/* Tactical Stats Grid */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-xl relative group">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                         <Globe className="w-3.5 h-3.5 mr-2 text-blue-400" /> Geographic Origin
                       </h4>
                       <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                    </div>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Region</span>
                        <span className="text-sm font-black text-white">{result.details.geo || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ASN Shard</span>
                        <span className="text-[10px] font-mono font-black text-blue-400 truncate ml-4">{result.details.asn || 'AS-DGO-14061'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-xl">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center">
                      <Shield className="w-3.5 h-3.5 mr-2 text-blue-400" /> Infrastructure Profile
                    </h4>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">VPN / Proxy</span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                          result.details.vpn ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'bg-green-600/20 text-green-400 border border-green-500/30'
                        }`}>
                          {result.details.vpn ? 'IDENTIFIED' : 'CLEAN'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Host Context</span>
                        <span className="text-[10px] font-black text-white">DATACENTER_PROVISIONED</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sentry AI Intelligence Summary */}
                <div className="glass-card rounded-[2.5rem] p-10 bg-slate-900 border border-blue-500/10 shadow-3xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Activity className="w-16 h-16 text-blue-400" />
                  </div>
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Autonomous Intelligence Summary</h4>
                  <p className="text-base leading-relaxed text-slate-200 font-bold italic tracking-tight">
                    &ldquo;{result.summary}&rdquo;
                  </p>
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                     </div>
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Sentry_Orchestrator_v4</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full min-h-[500px] glass-card rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-20 text-center relative overflow-hidden"
              >
                {/* HUD Elements */}
                <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-white/5 rounded-tl-3xl" />
                <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-white/5 rounded-br-3xl" />
                
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -inset-10 bg-blue-600/10 rounded-full blur-[40px]"
                  />
                  <Database className="w-24 h-24 text-slate-800 mb-8 relative z-10" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Intelligence <span className="text-blue-500">Standby</span></h3>
                <p className="text-sm text-slate-600 mt-4 max-w-sm font-bold leading-relaxed">
                  Initiate an indicator probe on the left to pull deterministic, cross-vetted security intelligence.
                </p>
                
                <div className="mt-12 flex space-x-12">
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Active Shards</span>
                     <span className="text-lg font-black text-slate-500">1,204</span>
                   </div>
                   <div className="w-px h-10 bg-white/5" />
                   <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Remediation Lag</span>
                     <span className="text-lg font-black text-slate-500">0.4ms</span>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
