/**
 * Core type definitions for Mahi AI Assistant
 */

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'processing';

export type AssistantVibe = 
  | 'cyber-violet' 
  | 'neon-cyan' 
  | 'emerald-hacker' 
  | 'rose-gold' 
  | 'amber-sunset';

export interface VibeConfig {
  id: AssistantVibe;
  name: string;
  primaryColor: string;
  glowColor: string;
  accentColor: string;
  bgGradient: string;
  description: string;
}

export interface ToolActionRecord {
  id: string;
  name: string;
  timestamp: number;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  message?: string;
  url?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description: string;
}

export type CompanionId = 'mahi' | 'kabir' | 'ananya';

export interface UserMemory {
  id: string;
  category: 'identity' | 'preference' | 'personal' | 'habit' | 'work' | 'general';
  fact: string;
  timestamp: number;
  updatedAt?: number;
}

export interface ClientLiveMessage {
  type: 'audio' | 'text' | 'toolResponse' | 'clientInterrupt' | 'ping' | 'screenFrame' | 'media';
  audio?: string; // base64 pcm16 16khz
  text?: string;
  image?: string; // base64 jpeg
  toolResponse?: {
    id: string;
    name: string;
    output: Record<string, unknown>;
  };
}

export interface ServerLiveMessage {
  type: 'audio' | 'interrupted' | 'toolCall' | 'status' | 'error' | 'turnComplete';
  audio?: string; // base64 pcm16 24khz
  status?: SessionState;
  message?: string;
  toolCall?: {
    id: string;
    name: string;
    args: Record<string, unknown>;
  };
}
