'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Database, Cpu, Zap, Search } from 'lucide-react';

type Memory = {
  id: string;
  content: string;
  similarity: number;
  tags: string[];
};

const MOCK_MEMORIES: Memory[] = [
  { id: 'mem-1', content: 'Observed similar RCLONE pattern in APT-41 campaign involving infrastructure 185.x.x.x', similarity: 0.94, tags: ['Exfiltration', 'APT-41'] },
  { id: 'mem-2', content: 'User "j.doe" typically accesses system from DE-Berlin between 08:00 and 17:00 CET', similarity: 0.88, tags: ['UBA', 'Baseline'] },
  { id: 'mem-3', content: 'Corporate policy mandates immediate isolation for any RDP attempt from non-VPN ranges', similarity: 0.92, tags: ['Policy', 'RDP'] },
];

export function AgentAnalysis() {
  return (
    <div className="space-y-6">
      {/* Neuro-Reasoning Visualization */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain className="w-24 h-24 text-blue-500" />
        </div>
        
        <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center">
          <Cpu className="w-4 h-4 mr-2" /> Neuro-Reasoning Engine
        </h3>

        <div className="relative h-40 flex items-center justify-center">
          {/* Animated Neural Web */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-blue-500/10 rounded-full"
                style={{ margin: `${i * 10}px` }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <div className="mt-4 text-center">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Inference</div>
              <div className="text-lg font-black text-white tracking-tighter">PHASE_4: CORRELATION</div>
            </div>
          </div>

          {/* Reasoning Pings */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className="absolute w-1 h-1 bg-blue-400 rounded-full"
                style={{ 
                  left: `${20 + Math.random() * 60}%`, 
                  top: `${20 + Math.random() * 60}%` 
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Logic Stream */}
        <div className="mt-4 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 mb-2 uppercase">
            <Activity className="w-3 h-3 text-blue-500" /> <span>Logic Trace</span>
          </div>
          <div className="font-mono text-[10px] text-blue-300 space-y-1">
            <div className="flex items-center"><span className="text-slate-500 mr-2 text-[8px]">[0ms]</span> Initializing semantic lookup...</div>
            <div className="flex items-center"><span className="text-slate-500 mr-2 text-[8px]">[142ms]</span> Found 3 related memories in Moorcheh DB.</div>
            <div className="flex items-center"><span className="text-slate-500 mr-2 text-[8px]">[284ms]</span> Correlating IP 185.x with historical C2 registry.</div>
            <div className="flex items-center text-white"><span className="text-blue-500 mr-2 animate-pulse">●</span> Recommending isolation based on high-vol exfil detected.</div>
          </div>
        </div>
      </div>

      {/* Moorcheh Memory Retrieval */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Database className="w-20 h-20 text-indigo-600" />
        </div>
        
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center">
          <Database className="w-4 h-4 mr-2" /> Moorcheh Semantic Memories
        </h3>

        <div className="space-y-4">
          {MOCK_MEMORIES.map((mem) => (
            <motion.div 
              key={mem.id}
              whileHover={{ x: 5 }}
              className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-indigo-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-1">
                  {mem.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{tag}</span>
                  ))}
                </div>
                <div className="text-[9px] font-mono font-bold text-slate-400">{(mem.similarity * 100).toFixed(1)}% MATCH</div>
              </div>
              <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                &ldquo;{mem.content}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>

        <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center">
          <Search className="w-3 h-3 mr-2" /> Audit Full Memory Graph
        </button>
      </div>
    </div>
  );
}

// Minimal placeholder for Activity icon used in logic trace
function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
