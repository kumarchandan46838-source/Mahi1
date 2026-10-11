import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  X,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserMemory, VibeConfig } from '../types';

interface Props {
  isOpen: boolean;
  memories: UserMemory[];
  vibe: VibeConfig;
  onClose: () => void;
  onAddMemory: (fact: string, category: UserMemory['category']) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export const MemoriesModal: React.FC<Props> = ({
  isOpen,
  memories,
  vibe,
  onClose,
  onAddMemory,
  onDeleteMemory,
  onClearAll,
}) => {
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<UserMemory['category']>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddMemory(newFact.trim(), newCategory);
      setNewFact('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMemories = memories.filter((m) =>
    m.fact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (cat: UserMemory['category']) => {
    switch (cat) {
      case 'identity':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'preference':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'habit':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'work':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div
      id="memories-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div
        id="memories-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0d0918] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          boxShadow: `0 0 50px ${vibe.glowColor}22`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md"
              style={{
                borderColor: vibe.primaryColor,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Brain className="w-5 h-5" style={{ color: vibe.primaryColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Mahi's Memory Bank
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono">
                  {memories.length} saved
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Things Mahi remembers about you across sessions
              </p>
            </div>
          </div>
          <button
            id="close-memories-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Voice Prompt Tip */}
        <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-white/80 shrink-0">
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: vibe.primaryColor }} />
          <span>
            <strong className="text-white">Tip:</strong> In voice chat, tell Mahi{' '}
            <em>"Mera naam Chandan hai"</em> or <em>"Yaad rakhna..."</em> and she'll store it
            automatically!
          </span>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAdd} className="mt-3.5 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <input
              id="add-memory-input"
              type="text"
              placeholder="e.g. Loves hot coffee, speaks Hindi, birthday 15 Aug..."
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as UserMemory['category'])}
              className="px-2.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="identity" className="bg-[#120e22]">Identity</option>
              <option value="preference" className="bg-[#120e22]">Preference</option>
              <option value="personal" className="bg-[#120e22]">Personal</option>
              <option value="habit" className="bg-[#120e22]">Habit</option>
              <option value="work" className="bg-[#120e22]">Work</option>
              <option value="general" className="bg-[#120e22]">General</option>
            </select>
            <button
              type="submit"
              disabled={!newFact.trim() || isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              style={{
                backgroundColor: vibe.primaryColor,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Search & Filter Bar */}
        {memories.length > 3 && (
          <div className="mt-3 shrink-0">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/35 focus:outline-none"
            />
          </div>
        )}

        {/* Memories Scrollable List */}
        <div className="mt-3 overflow-y-auto flex-1 pr-1 space-y-2 max-h-64 sm:max-h-72">
          {filteredMemories.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center text-white/40">
              <Brain className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs">
                {searchQuery ? 'No memories matching your search' : 'No memories saved yet'}
              </p>
              <p className="text-[11px] text-white/30 mt-1 max-w-xs">
                Talk with Mahi or add facts above so she permanently remembers your life and tastes!
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="group p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(
                        mem.category
                      )}`}
                    >
                      {mem.category}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {new Date(mem.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed break-words font-medium">
                    {mem.fact}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Forget this memory"
                  aria-label="Delete memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50 shrink-0">
          <span>Synced with Mahi's Live Brain</span>
          {memories.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-rose-300">Are you sure?</span>
                  <button
                    onClick={() => {
                      onClearAll();
                      setConfirmClear(false);
                    }}
                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-medium"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="hover:text-rose-300 transition-colors text-[11px]"
                >
                  Clear all memories
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
