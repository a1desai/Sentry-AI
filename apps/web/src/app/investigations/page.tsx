'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronRight, History, Activity } from 'lucide-react';
import { CaseRecord } from '@sentry/shared';
import Link from 'next/link';
import { EventIcon, RiskBadge, formatActionLabel, formatCaseAge, formatEventTypeLabel } from '@/components/cases/presenters';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvestigationsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ cases?: CaseRecord[] }>('/api/cases');
      if (data.cases) {
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Failed to fetch cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => 
    c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.classification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-10 max-w-7xl mx-auto w-full space-y-10"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.4em]">
            <History className="w-3 h-3" />
            <span>Historical Intelligence Archive</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Investigation <span className="text-blue-500 italic">Archive</span></h1>
          <p className="text-slate-500 font-bold text-sm">Full telemetry replay and autonomous remediation audit</p>
        </div>
        
        <button 
          onClick={fetchCases} 
          className="flex items-center px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 hover:border-blue-500/30 transition-all shadow-xl backdrop-blur-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          Sync Records
        </button>
      </div>

      {/* Intelligence Search Controller */}
      <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-2xl flex items-center space-x-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Search by Case ID, Classification, or Operation Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-12 py-3.5 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
          />
        </div>
        <button className="px-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center hover:bg-white/10 transition-all">
          <Filter className="w-4 h-4 mr-2" /> Advanced Filter
        </button>
      </div>

      {/* Audit Vault */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="px-10 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h2 className="font-black text-white uppercase tracking-widest text-[11px] flex items-center">
            <Activity className="w-4 h-4 mr-3 text-blue-500" /> Intelligence Vault
          </h2>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {filteredCases.length} Records Retrieved
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {filteredCases.length === 0 && !loading ? (
            <div className="p-24 text-center text-slate-600 font-black uppercase tracking-[0.3em] text-xs">No matching records in current shard.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-slate-600 font-black uppercase tracking-[0.3em] text-[9px] border-b border-white/5">
                <tr>
                  <th className="px-10 py-6">Operational Subject</th>
                  <th className="px-8 py-6">Telemetry Marker</th>
                  <th className="px-8 py-6">Risk Quotient</th>
                  <th className="px-8 py-6">Policy Enforcement</th>
                  <th className="px-10 py-6 text-right">Vault Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                <AnimatePresence>
                  {filteredCases.map((c, i) => (
                    <motion.tr 
                      key={c.caseId} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => window.location.href = `/case/${c.caseId}`}
                      className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                    >
                      <td className="px-10 py-7">
                        <div className="flex items-center space-x-5">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors shadow-lg">
                            <EventIcon type={c.eventType} />
                          </div>
                          <div>
                            <div className="font-mono text-[10px] font-black text-blue-500/80 mb-1 uppercase tracking-tighter">SEC-{c.caseId.split('-')[0]}...{c.caseId.split('-')[4]}</div>
                            <div className="font-black text-white text-base tracking-tight capitalize group-hover:text-blue-400 transition-colors">{formatEventTypeLabel(c.eventType)} Case</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-300 tracking-tight">{formatCaseAge(c.createdAt)}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">LOG_STREAM_08</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                          <RiskBadge classification={c.classification} tone="muted" />
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-[9px] font-mono font-black text-slate-600 uppercase">SCORE:</span>
                            <span className="text-[10px] font-black text-white tracking-tighter">{c.riskScore}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col space-y-1.5">
                          <span className="inline-flex items-center text-[10px] font-black pointer-events-none text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest w-fit">
                            {formatActionLabel(c.action)}
                          </span>
                          <div className="flex items-center text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${c.actionStatus === 'executed' ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                            Policy {c.actionStatus.replace('_', ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right text-slate-800">
                        <Link 
                          href={`/case/${c.caseId}`} 
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all shadow-xl backdrop-blur-md group-hover:scale-110 active:scale-95"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
