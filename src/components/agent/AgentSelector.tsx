'use client';

import { useState } from 'react';
import { AgentType, AGENT_REGISTRY } from '@/lib/agents/core';
import { Button } from '@/components/ui/Components';

interface AgentSelectorProps {
  onDeploy: (selectedAgents: AgentType[]) => void;
  onCancel: () => void;
}

export function AgentSelector({ onDeploy, onCancel }: AgentSelectorProps) {
  const [selected, setSelected] = useState<Set<AgentType>>(new Set());

  const toggleAgent = (type: AgentType) => {
    const newSet = new Set(selected);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelected(newSet);
  };

  const handleDeploy = () => {
    onDeploy(Array.from(selected));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#1a0f0a] border border-[#D4AF37]/50 rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.2)]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#D4AF37]/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-mincho)] text-white flex items-center gap-3">
              <span className="text-3xl">🕵️‍♀️</span> Agent Mission Control
            </h2>
            <p className="text-xs text-[#D4AF37] tracking-widest mt-1">作戦に参加させるエージェントを選択してください</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white px-3 py-1">
             ✕ Close
          </button>
        </div>

        {/* Scrollable Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
          {(Object.entries(AGENT_REGISTRY) as [AgentType, typeof AGENT_REGISTRY[AgentType]][]).map(([type, meta]) => {
            const isSelected = selected.has(type);
            return (
              <div 
                key={type}
                onClick={() => toggleAgent(type)}
                className={`
                  relative cursor-pointer p-4 rounded-xl border transition-all duration-200 group
                  ${isSelected 
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl p-2 rounded-lg ${isSelected ? 'bg-[#D4AF37]/20' : 'bg-black/30'}`}>
                    {meta.emoji}
                  </div>
                  <div>
                     <h3 className={`font-bold mb-1 ${isSelected ? 'text-[#D4AF37]' : 'text-gray-200'}`}>
                        {meta.name}
                     </h3>
                     <p className="text-xs text-gray-400 leading-relaxed font-light">
                        {meta.description}
                     </p>
                  </div>
                </div>
                
                {/* Checkbox Indicator */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/30'}`}>
                    {isSelected && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#1a0f0a] flex justify-between items-center rounded-b-2xl">
           <div className="text-xs text-gray-500">
              Selected: <span className="text-[#D4AF37] font-bold text-lg">{selected.size}</span> agents
           </div>
           
           <div className="flex gap-4">
              <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white">
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleDeploy}
                disabled={selected.size === 0}
                className={`
                  font-bold tracking-widest px-8 py-3 shadow-lg transition-all
                  ${selected.size > 0 
                    ? 'bg-[#D4AF37] text-black hover:bg-[#FDB931] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                `}
              >
                {selected.size > 0 ? 'AGENT GO 🚀' : 'SELECT AGENTS'}
              </Button>
           </div>
        </div>

      </div>
    </div>
  );
}
