'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { time: '10:00', detected: 12, contained: 10 },
  { time: '11:00', detected: 18, contained: 15 },
  { time: '12:00', detected: 8, contained: 8 },
  { time: '13:00', detected: 25, contained: 22 },
  { time: '14:00', detected: 15, contained: 15 },
  { time: '15:00', detected: 30, contained: 28 },
  { time: '16:00', detected: 22, contained: 20 },
];

export function ThreatVelocityChart() {
  return (
    <div className="h-[300px] w-full bg-white/50 backdrop-blur-md rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Threat Velocity</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Real-time throughput analysis</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Detected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Contained</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorContained" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.8)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="detected" 
            stroke="#2563eb" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorDetected)" 
            animationDuration={1500}
          />
          <Area 
            type="monotone" 
            dataKey="contained" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorContained)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
