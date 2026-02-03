'use client';

import { AgentResponse, AgentType } from '@/lib/agents/core';
import { useRef, useEffect } from 'react';

interface AgentResultsProps {
  results: AgentResponse[];
  pendingAgents: AgentType[]; // Agents currently running
}

export function AgentResults({ results, pendingAgents }: AgentResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of results if needed (optional)
  
  return (
    <div className="mt-8 space-y-6" ref={containerRef}>
      <h3 className="text-xl font-bold text-[#D4AF37] border-b border-[#D4AF37]/30 pb-2 mb-6 flex items-center gap-2 font-[family-name:var(--font-mincho)]">
        <span>📑</span> Mission Reports
        <span className="text-xs font-sans font-normal text-gray-500 ml-auto">
           {results.length} completed / {results.length + pendingAgents.length} total
        </span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Render Completed Results */}
        {results.map((result, idx) => (
          <div 
             key={`${result.agentType}-${idx}`}
             className="bg-[#1a0f0a] border border-white/10 rounded-xl overflow-hidden animate-in zoom-in-95 duration-500 hover:border-[#D4AF37]/50 transition-all group"
          >
             {/* Card Header */}
             <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                   <span className="text-3xl bg-black/20 p-1 rounded backdrop-blur">{result.icon}</span>
                   <div>
                      <h4 className="font-bold text-white text-sm md:text-base">{result.agentName}</h4>
                      {/* Risk Badge */}
                      {result.riskLevel && (
                        <span className={`
                          text-[10px] px-2 py-0.5 rounded-full border mt-1 inline-block uppercase tracking-wider font-bold
                          ${result.riskLevel === 'safe' ? 'text-green-400 border-green-500/30 bg-green-500/10' : ''}
                          ${result.riskLevel === 'caution' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : ''}
                          ${result.riskLevel === 'danger' ? 'text-red-400 border-red-500/30 bg-red-500/10' : ''}
                        `}>
                          {result.riskLevel === 'safe' ? 'SAFTEY CLEAR' : result.riskLevel}
                        </span>
                      )}
                      {result.score !== undefined && result.score > -1 && (
                         <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] ml-2 font-bold">
                            SCORE: {result.score}
                         </span>
                      )}
                   </div>
                </div>
             </div>

             {/* Card Body */}
             <div className="p-5 space-y-4">
                <div className="text-sm font-bold text-[#f0f0f0] border-l-2 border-[#D4AF37] pl-3 italic leading-relaxed">
                   "{result.summary}"
                </div>
                
                {result.details && result.details.length > 0 && (
                   <ul className="space-y-2">
                      {result.details.map((detail, i) => (
                         <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                            <span className="text-[#D4AF37]/50 mt-0.5">●</span>
                            <span>{detail}</span>
                         </li>
                      ))}
                   </ul>
                )}
             </div>
          </div>
        ))}
        
        {/* Render Pending Skeletons / Loading States */}
        {pendingAgents.map((agentType) => (
           <div 
             key={`pending-${agentType}`}
             className="bg-black/20 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] animate-pulse relative overflow-hidden"
           >
              {/* Scanning Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent -translate-y-full animate-[shimmer_2s_infinite]"></div>
              
              <div className="w-12 h-12 rounded-full bg-white/10 mb-4 animate-spin-slow flex items-center justify-center text-xl opacity-50">
                 🔄
              </div>
              <p className="text-xs text-[#D4AF37] tracking-widest font-mono">
                 AGENT DEPLOYED...
              </p>
              <p className="text-[10px] text-gray-600 mt-1 uppercase">
                 Connecting to {agentType}
              </p>
           </div>
        ))}
      </div>
    </div>
  );
}
