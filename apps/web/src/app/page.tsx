'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Activity, Cpu, History } from 'lucide-react';
import { CaseRecord } from '@sentry/shared';
import Link from 'next/link';
import { EventIcon, RiskBadge, formatActionLabel, formatCaseAge, formatEventTypeLabel } from '@/components/cases/presenters';
import { apiFetch, apiUrl } from '@/lib/api';

import { motion } from 'framer-motion';
import { ThreatVelocityChart } from '@/components/dashboard/ThreatChart';

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ cases?: CaseRecord[] }>('/api/cases/recent');
      if (data.cases) {
        setCases(data.cases.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    // Auto-sync every 30 seconds for autonomous demo
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, []);

  const simulateScenario = async (scenario: string) => {
    try {
      setSimulating(scenario);
      await fetch(apiUrl(`/api/scenarios/${scenario}/replay`), { method: 'POST' });
      await fetchCases();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(null);
    }
  };

  const highRiskCount = cases.filter(c => c.classification === 'HIGH').length;
  const metrics = [
    { label: 'Total Events', value: cases.length, color: 'text-slate-900' },
    { label: 'High Risk', value: highRiskCount, color: 'text-red-600' },
    { label: 'Auto-Contained', value: cases.filter(c => c.actionStatus === 'executed' && c.action !== 'allow').length, color: 'text-blue-600' },
    { label: 'Safe Allowed', value: cases.filter(c => c.action === 'allow').length, color: 'text-green-600' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-10 max-w-7xl mx-auto w-full space-y-12"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.4em]"
          >
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Tactical Operations Hub</span>
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Command <span className="text-blue-500">Center</span></h1>
          <p className="text-slate-500 font-bold text-sm">Autonomous threat orchestration & real-time remediation</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end mr-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway Status</span>
            <span className="text-xs font-black text-green-500 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_#10b981]" />
              ENCRYPTED_LINK_ACTIVE
            </span>
          </div>
          <button 
            onClick={fetchCases} 
            className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 hover:border-blue-500/30 transition-all shadow-xl backdrop-blur-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            Resync Data
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-4 gap-8">
        {metrics.map((m, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-[2rem] p-8 group relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-40 ${
              m.color.includes('red') ? 'bg-red-500' : m.color.includes('blue') ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            
            <div className="relative z-10 flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  m.color.includes('red') ? 'bg-red-500' : m.color.includes('blue') ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                {m.label}
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-black text-white tracking-tighter">
                  {m.value}
                </span>
                <span className="text-[10px] font-black text-slate-600">UNIT/S</span>
              </div>
              <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70.5%' }}
                  className={`h-full opacity-60 ${
                    m.color.includes('red') ? 'bg-red-500' : m.color.includes('blue') ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-10">
          {/* Main Visual: Velocity Chart */}
          <div className="glass-card rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Threat Velocity Agent</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Correlation Analysis</p>
                  </div>
                </div>
                <div className="flex space-x-6 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center text-blue-400">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 shadow-[0_0_8px_#3b82f6]" /> ACTIVE_THREATS
                  </div>
                  <div className="flex items-center text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" /> BASELINE_HIST
                  </div>
                </div>
             </div>
             
             <div className="h-[300px] w-full">
               <ThreatVelocityChart />
             </div>
          </div>

          {/* Active Queue Table */}
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h2 className="font-black text-white uppercase tracking-widest text-[11px] flex items-center">
                <History className="w-4 h-4 mr-3 text-blue-500" /> Recent Operations Log
              </h2>
              <span className="text-[9px] font-black text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full tracking-widest">
                LIVE_FEED_v6
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {cases.length === 0 && !loading ? (
                <div className="p-20 text-center text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Awaiting operational data...</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-slate-600 font-black uppercase tracking-[0.3em] text-[9px] border-b border-white/5">
                    <tr>
                      <th className="px-10 py-6">Operation / ID</th>
                      <th className="px-10 py-6">Timestamp</th>
                      <th className="px-10 py-6 text-center">Threat Class</th>
                      <th className="px-10 py-6 text-right">Autonomous Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {cases.map((c) => (
                      <tr 
                        key={c.caseId} 
                        onClick={() => window.location.href = `/case/${c.caseId}`}
                        className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors shadow-lg shadow-black/20 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <EventIcon type={c.eventType} />
                            </div>
                            <div>
                               <div className="font-black text-white text-base tracking-tight transition-colors group-hover:text-blue-400 capitalize">{formatEventTypeLabel(c.eventType)}</div>
                               <div className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-widest flex items-center mt-1">
                                 <div className="w-1 h-1 bg-slate-600 rounded-full mr-2" />
                                 SEC-{c.caseId.slice(0, 8)}
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-300 tracking-tight">{formatCaseAge(c.createdAt)}</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">UTC_RES_01</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col items-center">
                            <RiskBadge classification={c.classification} />
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest">SCORE</span>
                              <span className="text-[10px] font-black text-white tracking-tighter">{c.riskScore}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end space-x-6">
                            <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                c.action === 'allow' ? 'text-green-500' : 'text-blue-400'
                              }`}>
                                {formatActionLabel(c.action)}
                              </span>
                              <span className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em] mt-1 italic">ENFORCED_BY_SENTRY</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-10 py-4 bg-white/5 border-t border-white/5 flex justify-center">
               <Link href="/investigations" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] hover:text-blue-300 transition-colors">
                 View Full Archives &rarr;
               </Link>
            </div>
          </div>
        </div>

        {/* Tactical HUD Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-black text-white uppercase tracking-[0.2em] text-xs">
                  Scenario <span className="text-blue-500 italic">HUD</span>
                </h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Event Injection</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            
            <div className="space-y-4 relative z-10">
              <ScenarioButton 
                label="Safe Login" desc="Standard office session" 
                onClick={() => simulateScenario('safe_login')}
                loading={simulating === 'safe_login'}
              />
              <ScenarioButton 
                label="Malicious Login" desc="VPN based ATO attempt" 
                onClick={() => simulateScenario('malicious_login')}
                loading={simulating === 'malicious_login'}
                variant="danger"
              />
              <ScenarioButton 
                label="Data Exfil" desc="RCLONE sensitive transfer" 
                onClick={() => simulateScenario('data_exfiltration')}
                loading={simulating === 'data_exfiltration'}
                variant="danger"
              />
              <ScenarioButton 
                label="Fin Fraud" desc="Unauthorized transfer (TD Track)" 
                onClick={() => simulateScenario('financial_fraud')}
                loading={simulating === 'financial_fraud'}
                variant="danger"
              />
              <ScenarioButton 
                label="Targeted Phishing" desc="Email auth failure" 
                onClick={() => simulateScenario('phishing_email')}
                loading={simulating === 'phishing_email'}
                variant="warning"
              />
              
              <div className="pt-6 mt-6 border-t border-white/10">
                <ScenarioButton 
                  label="🔥 Complex Breach" desc="Phish -> ATO -> Data Exfil" 
                  onClick={() => simulateScenario('complex_breach')}
                  loading={simulating === 'complex_breach'}
                  variant="danger"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
             <div className="flex items-center space-x-3 mb-6">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Core Status</span>
             </div>
             <div className="space-y-5">
                {[
                  { label: 'Ingestion Rate', value: '4.2k eps', sub: 'OPTIMAL' },
                  { label: 'ML Inference', value: '184ms', sub: 'STABLE' },
                  { label: 'Containment', value: 'AUTOMATED', sub: 'ACTIVE' },
                ].map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-end border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                      <div className="text-xl font-black text-white tracking-tighter mt-1">{stat.value}</div>
                    </div>
                    <div className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest italic">{stat.sub}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ScenarioButton({
  label,
  desc,
  onClick,
  loading,
  variant = 'default',
}: {
  label: string;
  desc: string;
  onClick: () => void;
  loading: boolean;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const baseColors = variant === 'danger' 
    ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 shadow-red-500/5' 
    : variant === 'warning'
      ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-400 shadow-amber-500/5'
      : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 text-blue-400 shadow-blue-500/5';

  return (
    <motion.button 
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      disabled={loading}
      className={`w-full text-left p-4 rounded-2xl border ${baseColors} transition-all duration-300 group flex justify-between items-center shadow-lg`}
    >
      <div>
        <div className="font-black text-xs uppercase tracking-widest">{label}</div>
        <div className="text-[10px] opacity-60 mt-1 font-bold">{desc}</div>
      </div>
      {loading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Play className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      )}
    </motion.button>
  );
}
