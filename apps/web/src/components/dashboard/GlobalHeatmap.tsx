'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PING_LOCATIONS = [
  { x: 220, y: 120, label: 'San Francisco', risk: 'high' },
  { x: 180, y: 140, label: 'New York', risk: 'medium' },
  { x: 480, y: 130, label: 'London', risk: 'low' },
  { x: 520, y: 110, label: 'Berlin', risk: 'medium' },
  { x: 740, y: 180, label: 'Tokyo', risk: 'high' },
  { x: 680, y: 220, label: 'Singapore', risk: 'medium' },
  { x: 300, y: 280, label: 'Sao Paulo', risk: 'low' },
  { x: 550, y: 320, label: 'Cape Town', risk: 'medium' },
];

export function GlobalHeatmap() {
  return (
    <div className="relative w-full aspect-[2/1] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      
      {/* World Map SVG (Simplified Path) */}
      <svg 
        viewBox="0 0 800 400" 
        className="w-full h-full opacity-40 fill-slate-700"
      >
        <path d="M150,100 Q180,80 220,100 T300,120 T350,150 T320,200 T250,220 T150,200 Z" opacity="0.5" /> {/* NA */}
        <path d="M450,100 Q480,80 520,100 T580,120 T550,180 T480,180 T450,150 Z" opacity="0.5" /> {/* Eurasia */}
        <path d="M480,200 Q520,220 500,280 T450,320 T400,280 T420,220 Z" opacity="0.5" /> {/* Africa */}
        <path d="M220,220 Q250,250 240,300 T200,350 T150,300 T180,250 Z" opacity="0.5" /> {/* SA */}
        <path d="M650,120 Q700,100 750,120 T780,180 T700,220 T650,180 Z" opacity="0.5" /> {/* Asia Far */}
        <path d="M680,280 Q720,300 750,350 T700,380 T650,350 Z" opacity="0.5" /> {/* Australia */}
      </svg>

      {/* Pings */}
      {PING_LOCATIONS.map((point, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 2, 1],
              opacity: [0.3, 0.1, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5
            }}
            style={{ left: point.x, top: point.y }}
            className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
              point.risk === 'high' ? 'border-red-500' : point.risk === 'medium' ? 'border-amber-500' : 'border-blue-500'
            }`}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
            style={{ left: point.x, top: point.y }}
            className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg ${
              point.risk === 'high' ? 'bg-red-500' : point.risk === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          />
        </React.Fragment>
      ))}

      {/* Stats Overlay */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Pulse</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white tracking-tighter">1,204</span>
            <span className="text-xs font-bold text-green-500">Live Indicators</span>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Attacks</div>
            <div className="text-sm font-black text-red-500">12 Critical</div>
          </div>
          <div className="w-px h-8 bg-slate-800 self-center" />
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reputation Score</div>
            <div className="text-sm font-black text-blue-500">94% Secure</div>
          </div>
        </div>
      </div>

      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-px bg-blue-500/20 shadow-[0_0_15px_blue] z-0"
      />
    </div>
  );
}
