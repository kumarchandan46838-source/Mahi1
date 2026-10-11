import { VibeConfig, VoiceOption } from '../types';

export const VIBES: Record<string, VibeConfig> = {
  'cyber-violet': {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    primaryColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    accentColor: '#ec4899',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #1e1035 0%, #0c0716 55%, #05030a 100%)',
    description: 'Electric neon violet with a sassy cyberpunk edge',
  },
  'neon-cyan': {
    id: 'neon-cyan',
    name: 'Neon Cyan',
    primaryColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    accentColor: '#3b82f6',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #082736 0%, #04121a 55%, #02060a 100%)',
    description: 'Crisp holographic cyan with cool, hyper-smart clarity',
  },
  'emerald-hacker': {
    id: 'emerald-hacker',
    name: 'Matrix Emerald',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accentColor: '#84cc16',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #062b1b 0%, #03150d 55%, #010805 100%)',
    description: 'Futuristic matrix green with a daring, tech-savvy attitude',
  },
  'rose-gold': {
    id: 'rose-gold',
    name: 'Luxe Rose',
    primaryColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    accentColor: '#fb7185',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #2f0d19 0%, #16060c 55%, #0a0205 100%)',
    description: 'Glamorous, cheeky rose neon with playful radiance',
  },
  'amber-sunset': {
    id: 'amber-sunset',
    name: 'Solar Amber',
    primaryColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    accentColor: '#ef4444',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #2e1a05 0%, #170c02 55%, #0a0501 100%)',
    description: 'Warm, magnetic golden amber with fiery confidence',
  },
};

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'Aoede', name: 'Aoede', gender: 'female', description: 'Bright, lively, playful female tone (Default for Mahi)' },
  { id: 'Kore', name: 'Kore', gender: 'female', description: 'Warm, energetic, and smooth female voice' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'female', description: 'Crisp, modern, and confident tone' },
  { id: 'Puck', name: 'Puck', gender: 'male', description: 'Cheeky, dynamic alternative voice' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male', description: 'Deep, assertive presence' },
];
