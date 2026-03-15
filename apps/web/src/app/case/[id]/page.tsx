'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, 
  RefreshCw, MessageSquare, Send, Activity,
  History, ShieldAlert, ExternalLink, ChevronRight, Zap, 
  Headphones
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

  if (loading) return <div className="p-8 text-slate-500 flex items-center justify-center h-screen"><RefreshCw className="animate-spin w-5 h-5 mr-2" /> Orchestrating evidence...</div>;
  if (!caseData) return <div className="p-8 text-red-500">Case not found.</div>;

  const { toolCalls, guidance, ...c } = caseData;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto transition-all ${chatOpen ? 'mr-[400px]' : ''}`}>
        <div className="p-8 max-w-6xl mx-auto w-full">
          <header className="flex justify-between items-start mb-8">
            <div className="space-y-4">
              <Link href="/investigations" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3 mr-1.5" /> Investigation Archive
              </Link>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Case <span className="text-slate-400 font-mono font-medium">{id?.slice(0, 8)}</span></h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    c.classification === 'HIGH' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-amber-100 border-amber-200 text-amber-700'
                  }`}>
                    {c.classification} Risk
                  </span>
                </div>
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <Activity className="w-4 h-4 mr-1.5 text-slate-400" />
                  {formatEventTypeLabel(c.eventType).toUpperCase()} &bull; {formatCaseAge(c.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={handlePlayBrief}
                disabled={briefingLoading}
                className="flex items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {briefingLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Headphones className="w-4 h-4 mr-2" />
                )}
                AI Brief
              </button>
              <button 
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
                  chatOpen ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Sentry AI
              </button>
              <div className="bg-slate-900 text-white px-6 py-2.5 rounded-xl shadow-lg border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] uppercase font-black tracking-tighter text-slate-500">Risk Score</span>
                <span className="text-xl font-black">{c.riskScore}</span>
              </div>
            </div>
          </header>

          {/* Attack Relationship Graph */}
          {storyline && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-amber-500" /> Threat Relationship Cloud
                </h3>
                <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                  {storyline.correlationReason}
                </div>
              </div>
              
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
            </motion.section>
          )}

          <div className="grid grid-cols-12 gap-8">
            {/* Left: Guidance & Evidence */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Agent Analysis - NEW */}
              <AgentAnalysis />
              
              {/* Guidance Card */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldAlert className="w-20 h-20 text-blue-500" />
                </div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Sentry AI Guidance</h3>
                
                <div className="space-y-6 relative z-10">
                  <div>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1">
                      &ldquo;{guidance?.summary || 'No guidance summary available.'}&rdquo;
                    </p>
                  </div>

                  {guidance?.containmentSteps && (
                    <div className="space-y-3">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recommended Containment</h4>
                      <ul className="space-y-2">
                        {guidance.containmentSteps.map((step: string, idx: number) => (
                          <li key={idx} className="flex items-start text-xs text-slate-300 font-medium bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Escalation Advice</h4>
                      <div className="text-xs font-bold text-slate-100 uppercase tracking-tight">{guidance?.escalationAdvice || 'Standard observation.'}</div>
                    </div>
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Result */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Response Policy</h3>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    c.actionStatus === 'executed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {c.actionStatus}
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    c.action === 'allow' ? 'bg-green-600 shadow-green-600/20' : 'bg-blue-600 shadow-blue-600/20'
                  }`}>
                    {c.action === 'allow' ? <ShieldCheck className="w-6 h-6 text-white" /> : <AlertTriangle className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 tracking-tight uppercase">{formatActionLabel(c.action)}</div>
                    <div className="text-xs text-slate-500 font-medium">Auto-enforced by Sentry Engine</div>
                  </div>
                </div>
              </div>

              {/* Evidence list */}
              {c.evidenceList && c.evidenceList.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Evidence Bundle</h3>
                  <div className="space-y-4">
                    {c.evidenceList.map((ev: string, idx: number) => (
                      <div key={idx} className="flex items-start p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 mr-3 group-hover:bg-blue-500 transition-colors" />
                        <span className="text-xs font-bold text-slate-600 leading-normal">{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Detailed Execution */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center">
                    <History className="w-5 h-5 mr-3 text-slate-400" />
                    Agent Reasoning Runtime
                  </h3>
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest space-x-4">
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" /> Logical Node</span>
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-100 mr-1.5 border border-slate-200" /> Latency Trace</span>
                  </div>
                </div>

                <div className="space-y-12 relative">
                  <div className="absolute top-0 left-5 w-0.5 h-full bg-slate-50 z-0" />
                  
                  {toolCalls.map((tc) => (
                    <div key={tc.id} className="relative pl-14 group z-10 transition-all hover:translate-x-1">
                      <div className={`absolute left-[5px] top-1 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all ${
                        tc.status === 'success' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{tc.tool.replace('_', ' ')}</h4>
                          {tc.latencyMs && (
                            <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {tc.latencyMs}ms
                            </span>
                          )}
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors group-hover:border-blue-100">
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{tc.summary}</p>
                        </div>
                        {tc.rawRef && (
                           <details className="text-[10px] px-2">
                             <summary className="text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-blue-500 transition-colors">Raw JSON Context</summary>
                             <pre className="mt-4 p-4 bg-slate-900 text-blue-300 rounded-2xl overflow-x-auto font-mono text-[9px] leading-tight">
                               {JSON.stringify(JSON.parse(tc.rawRef), null, 2)}
                             </pre>
                           </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed right-0 top-0 h-full w-[400px] bg-white/80 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col z-[100]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Ask Sentry AI</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case-aware Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={chatScrollRef}>
              {chatHistory.length === 0 && (
                <div className="text-center py-12 opacity-40">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">How can I help you investigate this case further?</p>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-blue-600/10' 
                      : 'bg-white border border-slate-100 text-slate-800'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 px-1">
                    {msg.role} &bull; {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {chatLoading && (
                <div className="flex items-center space-x-2 text-slate-400">
                  <RefreshCw className="animate-spin w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Assistant is thinking...</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask about evidence, risk, or actions..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage || chatLoading}
                  className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
