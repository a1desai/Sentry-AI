'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, 
  RefreshCw, MessageSquare, Send, Activity,
  History, ShieldAlert, ExternalLink, ChevronRight, Zap, 
  Headphones, Database
} from 'lucide-react';
import Link from 'next/link';
import { CaseRecord, ChatMessage, ToolCall } from '@sentry/shared';
import { apiFetch, apiUrl } from '@/lib/api';
import { formatActionLabel, formatCaseAge, formatEventTypeLabel } from '@/components/cases/presenters';
import { motion, AnimatePresence } from 'framer-motion';
import { RelationshipGraph } from '@/components/cases/RelationshipGraph';
import { AgentAnalysis } from '@/components/cases/AgentAnalysis';

type CaseDetail = CaseRecord & {
  chatMessages?: ChatMessage[];
  toolCalls: ToolCall[];
};

type StorylineLink = {
  caseId: string;
  classification: string;
  eventType: string;
  timestamp: string;
};

type Storyline = {
  correlationReason: string;
  links: StorylineLink[];
};

type ChatEntry = Pick<ChatMessage, 'content' | 'createdAt' | 'role'>;

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [storyline, setStoryline] = useState<Storyline | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideAction, setOverrideAction] = useState<string>('');
  const [reflection, setReflection] = useState('');
  const [streamingReflection, setStreamingReflection] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handlePlayBrief = async () => {
    try {
      setBriefingLoading(true);
      const res = await fetch(apiUrl(`/api/cases/${id}/brief`), { method: 'POST' });
      if (!res.ok) throw new Error('Failed to fetch audio');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error(err);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadCase = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{ caseData?: CaseDetail }>(`/api/cases/${id}`);
        if (!cancelled && data.caseData) {
          setCaseData(data.caseData);
          setChatHistory(data.caseData.chatMessages || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const loadStoryline = async () => {
      try {
        const data = await apiFetch<{ chain?: Storyline }>(`/api/cases/${id}/storyline`);
        if (!cancelled) {
          setStoryline(data.chain || null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    void loadCase();
    void loadStoryline();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage || chatLoading) return;

    const userMsg: ChatEntry = { role: 'user', content: chatMessage, createdAt: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch(apiUrl(`/api/cases/${id}/chat`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, data.message as ChatEntry]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleVerdict = async (verdict: 'confirm' | 'override' | 'escalate', reason?: string, action?: string) => {
    try {
      setVerdictLoading(true);
      const res = await fetch(apiUrl(`/api/cases/${id}/verdict`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict, reason, overrideAction: action }),
      });
      const data = await res.json();
      if (data.success) {
        setCaseData((prev: CaseDetail | null) => prev ? { ...prev, verdict, verdictReason: reason, agentReflection: data.reflection } : null);
        if (data.reflection) {
          setReflection(data.reflection);
          startStreaming(data.reflection);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerdictLoading(false);
      setShowOverrideModal(false);
    }
  };

  const startStreaming = (text: string) => {
    setStreamingReflection('');
    let i = 0;
    const interval = setInterval(() => {
      setStreamingReflection(prev => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 20);
  };

  if (loading) return (
    <div className="p-8 text-blue-400 font-black uppercase tracking-[0.3em] flex flex-col items-center justify-center h-screen space-y-4">
      <RefreshCw className="animate-spin w-8 h-8" />
      <span>Orchestrating Telemetry...</span>
    </div>
  );
  
  if (!caseData) return <div className="p-8 text-red-500 font-black uppercase tracking-widest text-center h-screen flex items-center justify-center">CRITICAL: Operational data shard not found.</div>;

  const { toolCalls, guidance, ...c } = caseData;

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div className={`flex-1 overflow-y-auto transition-all duration-700 ease-in-out ${chatOpen ? 'mr-[450px]' : ''}`}>
        <div className="p-10 max-w-6xl mx-auto w-full space-y-12">
          <header className="flex justify-between items-start">
            <div className="space-y-6">
              <Link href="/investigations" className="inline-flex items-center text-[10px] font-black text-slate-500 hover:text-blue-400 transition-all uppercase tracking-[0.4em] group">
                <ArrowLeft className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                Return to Intelligence Vault
              </Link>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-6">
                  <h1 className="text-5xl font-black text-white tracking-tighter flex items-center">
                    Case <span className="text-blue-500 font-mono ml-4 text-4xl">#{id?.slice(0, 8)}</span>
                  </h1>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                    c.classification === 'HIGH' ? 'bg-red-600/20 border-red-500/30 text-red-400' : 'bg-amber-600/20 border-amber-500/30 text-amber-400'
                  }`}>
                    {c.classification} Risk Level
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-blue-500" />
                    {formatEventTypeLabel(c.eventType)} SIGNAL
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <div className="flex items-center">
                    <History className="w-4 h-4 mr-2 text-slate-600" />
                    Ingested {formatCaseAge(c.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="grid grid-cols-2 gap-3 mr-4">
                 <button 
                  onClick={handlePlayBrief}
                  disabled={briefingLoading}
                  className="flex items-center px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl hover:bg-indigo-600/20 transition-all disabled:opacity-30 group"
                >
                  {briefingLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-2.5 animate-spin" />
                  ) : (
                    <Headphones className="w-3.5 h-3.5 mr-2.5 group-hover:scale-110 transition-transform" />
                  )}
                  Audio Brief
                </button>
                <button 
                  onClick={() => setChatOpen(!chatOpen)}
                  className={`flex items-center px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl group ${
                    chatOpen 
                      ? 'bg-blue-600 border border-blue-400 text-white shadow-blue-600/20' 
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-blue-500/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-2.5 group-hover:rotate-12 transition-transform" />
                  AI Interrogator
                </button>
              </div>
              
              <div className="glass-card px-8 py-4 rounded-[1.5rem] border border-white/5 flex flex-col items-center">
                <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-600 mb-1">Threat Quotient</span>
                <span className={`text-3xl font-black tracking-tighter ${
                  c.riskScore > 70 ? 'text-red-500' : c.riskScore > 40 ? 'text-amber-500' : 'text-blue-500'
                }`}>{c.riskScore}</span>
              </div>
            </div>
          </header>

          {/* Attack Relationship Graph HUD */}
          {storyline && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center">
                  <Zap className="w-4 h-4 mr-3 text-blue-500 animate-pulse" /> Signal Propagation Graph
                </h3>
                <div className="text-[9px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">
                  CORE_LINK: {storyline.correlationReason}
                </div>
              </div>
              
              <div className="glass-card rounded-[2.5rem] p-1 border border-white/5 bg-slate-950/20 overflow-hidden">
                <RelationshipGraph 
                  nodes={storyline.links.map((l, i) => ({
                    id: l.caseId,
                    label: l.eventType.replace('_', ' '),
                    type: l.caseId === id ? 'current' : 'historical',
                    classification: l.classification as any,
                    x: 100 + (i * 150),
                    y: 150 + (Math.sin(i) * 50)
                  }))}
                  links={storyline.links.slice(0, -1).map((l, i) => ({
                    source: l.caseId,
                    target: storyline.links[i+1].caseId
                  }))}
                />
              </div>
            </motion.section>
          )}

          <div className="grid grid-cols-12 gap-10">
            {/* Left Wing: AI Analysis & Evidence */}
            <div className="col-span-12 lg:col-span-4 space-y-10">
              <AgentAnalysis />
              
              {/* Guidance Protocol Card */}
              <div className="glass-card rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden group border border-blue-500/10 bg-slate-900/40">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <ShieldAlert className="w-24 h-24 text-blue-400" />
                </div>
                
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8 flex items-center">
                   <ShieldCheck className="w-4 h-4 mr-3" /> Containment Protocol
                </h3>
                
                <div className="space-y-10 relative z-10">
                  <div>
                    <p className="text-base font-bold text-slate-100 leading-relaxed italic border-l-2 border-blue-600 pl-6 py-2">
                      &ldquo;{guidance?.summary || 'No guidance summary available.'}&rdquo;
                    </p>
                  </div>

                  {guidance?.containmentSteps && (
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Tactical Countermeasures</h4>
                      <ul className="space-y-3">
                        {guidance.containmentSteps.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start text-xs font-bold text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                            <div className="w-5 h-5 rounded-lg bg-blue-600/20 flex items-center justify-center mr-3 shrink-0">
                               <CheckCircle className="w-3 h-3 text-blue-400" />
                            </div>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Escalation Advice</h4>
                      <div className="text-xs font-black text-white uppercase tracking-tighter">{guidance?.escalationAdvice || 'Standard observation protocol.'}</div>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              </div>
              
              {/* Analyst Verdict Loop HUD */}
              {c.classification === 'HIGH' && !caseData.verdict && (
                <div className="glass-card rounded-[2.5rem] p-10 shadow-3xl border border-blue-500/30 bg-blue-600/5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10">
                    <ShieldCheck className="w-16 h-16 text-blue-400" />
                  </div>
                  
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-8">
                    Analyst Final Verdict Required
                  </h3>
                  
                  <div className="flex flex-col space-y-4 relative z-10">
                    <button 
                      onClick={() => handleVerdict('confirm')}
                      disabled={verdictLoading}
                      className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/40 hover:bg-green-500 transition-all flex items-center justify-center group"
                    >
                      <CheckCircle className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                      Confirm Verdict
                    </button>
                    
                    <button 
                      onClick={() => setShowOverrideModal(true)}
                      disabled={verdictLoading}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:border-blue-500/30 transition-all flex items-center justify-center group"
                    >
                      <AlertTriangle className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform text-amber-500" />
                      Override Record
                    </button>
                    
                    <button 
                      onClick={() => handleVerdict('escalate')}
                      disabled={verdictLoading}
                      className="w-full py-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black text-xs uppercase tracking-widest hover:bg-indigo-600/30 transition-all flex items-center justify-center group"
                    >
                      <ExternalLink className="w-4 h-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Escalate to SOC T2
                    </button>
                  </div>
                </div>
              )}

              {/* Verdict Status Indicator */}
              {caseData.verdict && (
                <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      caseData.verdict === 'confirm' ? 'bg-green-600' : caseData.verdict === 'override' ? 'bg-amber-600' : 'bg-indigo-600'
                    }`}>
                      {caseData.verdict === 'confirm' && <CheckCircle className="w-5 h-5 text-white" />}
                      {caseData.verdict === 'override' && <AlertTriangle className="w-5 h-5 text-white" />}
                      {caseData.verdict === 'escalate' && <ExternalLink className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Analyst Verdict</div>
                      <div className="text-sm font-black text-white uppercase tracking-tighter">{caseData.verdict.toUpperCase()}ED BY ANALYST</div>
                    </div>
                  </div>
                  {caseData.verdictReason && (
                    <div className="max-w-[50%] text-[10px] font-black italic text-slate-500 text-right">
                      &ldquo;{caseData.verdictReason}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Evidence Vault Evidence list */}
              {c.evidenceList && c.evidenceList.length > 0 && (
                <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center">
                    <Database className="w-3.5 h-3.5 mr-2" /> Evidence Bundle
                  </h3>
                  <div className="space-y-4">
                    {c.evidenceList.map((ev: string, idx: number) => (
                      <div key={idx} className="flex items-start p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-blue-500/20 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 mr-4 group-hover:bg-blue-500 transition-colors shadow-[0_0_8px_transparent] group-hover:shadow-[0_0_8px_#3b82f6]" />
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Wing: Timeline & Detailed Logs */}
            <div className="col-span-12 lg:col-span-8 space-y-10">
              <div className="glass-card rounded-[3rem] border border-white/5 p-12 shadow-3xl">
                <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/5">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tighter flex items-center">
                      <History className="w-6 h-6 mr-4 text-blue-500" />
                      Agent Reasoning Runtime
                    </h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Autonomous Logical Sequence Audit</p>
                  </div>
                  <div className="flex items-center space-x-8 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center text-blue-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-2 shadow-[0_0_10px_#3b82f6]" /> LOGICAL_NODE
                    </div>
                    <div className="flex items-center text-slate-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" /> TELEMETRY_LIT
                    </div>
                  </div>
                </div>

                <div className="space-y-16 relative">
                  <div className="absolute top-0 left-6 w-px h-full bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.02)]" />
                  
                  {toolCalls.map((tc: ToolCall, i: number) => (
                    <motion.div 
                      key={tc.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative pl-16 group z-10"
                    >
                      <div className={`absolute left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-slate-950 shadow-2xl transition-all group-hover:scale-125 duration-300 ${
                        tc.status === 'success' ? 'bg-blue-500 shadow-[0_0_12px_#3b82f6]' : 'bg-red-500 shadow-[0_0_12px_#ef4444]'
                      }`} />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-black text-blue-400/80 uppercase tracking-[0.3em] font-mono group-hover:text-blue-400 transition-colors">
                            {tc.tool.replace('_', ' ')}
                          </h4>
                          {tc.latencyMs && (
                            <span className="text-[10px] font-mono font-black text-slate-600 bg-white/5 px-3 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
                              Lat: {tc.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-inner group-hover:bg-white/[0.04] transition-all group-hover:border-blue-500/20 group-hover:translate-x-1 duration-500">
                          <p className="text-sm font-bold text-slate-300 leading-relaxed tracking-tight group-hover:text-white transition-colors">{tc.summary}</p>
                        </div>
                        {tc.rawRef && (
                           <details className="text-[10px] px-4">
                             <summary className="text-slate-600 font-black uppercase tracking-[0.3em] cursor-pointer hover:text-blue-400 transition-all focus:outline-none">Inspect RAW_JSON Shard</summary>
                             <motion.pre 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-6 p-6 bg-black border border-white/5 text-blue-400/90 rounded-[1.5rem] overflow-x-auto font-mono text-[9px] leading-relaxed shadow-3xl"
                             >
                               {JSON.stringify(JSON.parse(tc.rawRef), null, 2)}
                             </motion.pre>
                           </details>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Agent Reflection Panel */}
                {(streamingReflection || caseData.agentReflection) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 glass-card rounded-[3rem] border border-blue-500/20 p-12 bg-blue-600/5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                    <div className="flex items-center space-x-5 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tighter">Sentry <span className="text-blue-500 italic">Self-Reflection</span></h3>
                        <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.3em]">Autonomous Learning Sequence</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner">
                        <p className="text-sm font-bold text-slate-300 leading-relaxed font-mono">
                          {streamingReflection || caseData.agentReflection}
                          {streamingReflection && <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />}
                        </p>
                      </div>
                      
                      {reflection.includes('Adaptive Allowlist Rule') && (
                        <div className="flex items-center justify-between p-6 bg-green-600/10 border border-green-500/20 rounded-2xl">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-xl bg-green-600/20 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-green-400 uppercase tracking-widest">Policy Improvement Hint</div>
                              <div className="text-xs font-black text-white">Rule candidate detected. Apply to core?</div>
                            </div>
                          </div>
                          <button className="px-6 py-2.5 bg-green-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-500 transition-all">
                            Enable Policy
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Override Modal */}
        <AnimatePresence>
          {showOverrideModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOverrideModal(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg glass-card rounded-[3rem] p-12 border border-blue-500/20 shadow-[0_0_100px_rgba(37,99,235,0.2)] bg-slate-900"
              >
                <h3 className="text-2xl font-black text-white tracking-tighter mb-2">Override <span className="text-blue-500 italic">Intelligence</span></h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Manual Policy Adjustment</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corrective Action</label>
                    <select 
                      value={overrideAction}
                      onChange={(e) => setOverrideAction(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                    >
                      <option value="">Select manual action...</option>
                      <option value="allow">ALLOW - False Positive</option>
                      <option value="block_session">BLOCK_SESSION - Confirmed Threat</option>
                      <option value="require_mfa">REQUIRE_MFA - Suspicious Activity</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Analyst Justification</label>
                    <textarea 
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why the agent was incorrect..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <button 
                      onClick={() => setShowOverrideModal(false)}
                      className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleVerdict('override', overrideReason, overrideAction)}
                      disabled={!overrideAction || !overrideReason || verdictLoading}
                      className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 disabled:opacity-20 transition-all"
                    >
                      {verdictLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Commit Override'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Cracked Chat Sidebar */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside 
            initial={{ x: 450 }}
            animate={{ x: 0 }}
            exit={{ x: 450 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="fixed right-0 top-0 h-full w-[450px] bg-slate-900/60 backdrop-blur-[60px] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col z-[100]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
              <div className="flex items-center space-x-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 animate-pulse opacity-20" />
                  <ShieldCheck className="w-7 h-7 relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tighter">Sentry <span className="text-blue-500 italic">Interrogator</span></h3>
                  <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-[0.3em]">Neural Security Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="w-10 h-10 rounded-2xl text-slate-500 hover:bg-white/10 hover:text-white transition-all border border-white/5 shadow-xl flex items-center justify-center group"
              >
                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar" ref={chatScrollRef}>
              {chatHistory.length === 0 && (
                <div className="text-center py-20 opacity-30 select-none">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <MessageSquare className="w-16 h-16 mx-auto mb-6 text-blue-500" />
                  </motion.div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Awaiting Investigation Query...</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[88%] p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-2xl relative overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-blue-900/40 rounded-tr-sm' 
                      : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-sm backdrop-blur-md'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-3 px-2 flex items-center">
                    {msg.role === 'user' ? 'Investigator' : 'Sentry_AI'} <div className="w-1 h-1 bg-slate-800 rounded-full mx-2" /> {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {chatLoading && (
                <div className="flex items-center space-x-3 text-blue-500 opacity-80 pl-2">
                  <RefreshCw className="animate-spin w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Neural Processing...</span>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-slate-900/80 backdrop-blur-2xl">
              <form onSubmit={handleSendMessage} className="relative group">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Inquire about signal context..."
                  className="w-full bg-black/60 border border-white/5 rounded-[1.5rem] pl-6 pr-14 py-4 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-2xl transition-all border-glow"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage || chatLoading}
                  className="absolute right-2.5 top-2.5 w-11 h-11 bg-blue-600 text-white rounded-[1.2rem] shadow-xl shadow-blue-900/60 hover:bg-blue-500 transition-all disabled:opacity-20 flex items-center justify-center group-hover:scale-105 active:scale-95 translate-y-[-1px]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mt-4 text-center">Neural Link Encrypted_AES_256</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
