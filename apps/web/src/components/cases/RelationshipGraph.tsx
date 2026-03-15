'use client';

import { motion } from 'framer-motion';

type GraphNode = {
  id: string;
  label: string;
  type: string;
  classification: 'HIGH' | 'MEDIUM' | 'LOW';
  x: number;
  y: number;
};

type GraphLink = {
  source: string;
  target: string;
};

interface RelationshipGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function RelationshipGraph({ nodes, links }: RelationshipGraphProps) {
  return (
    <div className="relative w-full h-[400px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900 to-slate-900" />
      
      <svg className="w-full h-full relative z-10" viewBox="0 0 800 400">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
          </marker>
        </defs>

        {/* Links */}
        {links.map((link, i) => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          if (!sourceNode || !targetNode) return null;

          return (
            <motion.line
              key={`link-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="#3b82f6"
              strokeWidth="1"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const colors = {
            HIGH: 'fill-red-500 stroke-red-500/20',
            MEDIUM: 'fill-amber-500 stroke-amber-500/20',
            LOW: 'fill-emerald-500 stroke-emerald-500/20'
          };

          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.1 }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r="12"
                className={`${colors[node.classification]} ${node.type === 'current' ? 'ring-4 ring-blue-400' : ''}`}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r="18"
                className={`${colors[node.classification]} opacity-10 animate-pulse`}
              />
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-black uppercase tracking-widest"
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>
      
      <div className="absolute bottom-4 left-6 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase">High Risk</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase">Current Case</span>
          </div>
        </div>
      </div>
    </div>
  );
}
