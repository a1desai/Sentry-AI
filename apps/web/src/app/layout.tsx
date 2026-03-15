'use client';

import './globals.css';
import { Shield, LayoutDashboard, History, Search, Activity, Cpu, Wifi } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Investigations', icon: History, href: '/investigations' },
    { label: 'Threat Intel', icon: Search, href: '/threat-intel' },
  ];

  return (
    <html lang="en">
      <body className="bg-sentry-slate flex h-screen overflow-hidden font-sans antialiased text-slate-300">
        {/* Sidebar */}
        <aside className="w-72 bg-sentry-blue/60 backdrop-blur-2xl text-slate-400 flex flex-col border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)] z-20">
          <div className="p-8 pb-10">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-500 transform group-hover:rotate-6">
                <Shield className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black tracking-tighter text-2xl group-hover:text-blue-400 transition-colors">SENTRY<span className="text-blue-500">AI</span></span>
                <span className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase -mt-1 flex items-center">
                  <span className="w-1 h-1 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                  CRACKED_CORE_v3
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <div className="px-4 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Main Operations</div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? 'bg-blue-600/10 text-white border border-blue-500/20'
                      : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-blue-600/5 blur-xl pointer-events-none"
                    />
                  )}
                  <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className={`text-sm tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* System Status Metrics */}
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>Neural Engine Load</span>
                <span className="text-blue-400">42%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                <Cpu className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-[9px] font-black text-white">1.2ms</span>
                <span className="text-[7px] font-bold text-slate-600 uppercase">Latency</span>
              </div>
              <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex flex-col items-center">
                <Wifi className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-[9px] font-black text-green-500">OPTIMAL</span>
                <span className="text-[7px] font-bold text-slate-600 uppercase">Uplink</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 rounded-2xl p-4 flex items-center space-x-3 border border-indigo-500/20 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white border border-white/10">
                  AI
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] font-black text-white uppercase tracking-tighter">Sentry Assistant</div>
                <div className="text-[8px] font-bold text-blue-500/60 uppercase tracking-widest">System Liaison</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth relative bg-slate-950">
           {/* Background HUD Grid */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
           
           <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
           
           <div className="relative z-10 min-h-full">
             {children}
           </div>
           
           {/* Tactical Scanning Beam */}
           <div className="fixed top-0 left-72 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent shadow-[0_0_20px_#3b82f6] animate-[scan_8s_linear_infinity] pointer-events-none z-50" />
           
           {/* Grainy Texture */}
           <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </main>
      </body>
    </html>
  );
}
