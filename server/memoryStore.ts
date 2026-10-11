import fs from "fs";
import path from "path";

export interface StoredMemory {
  id: string;
  category: "identity" | "preference" | "personal" | "habit" | "work" | "general";
  fact: string;
  timestamp: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORIES_FILE = path.join(DATA_DIR, "memories.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEMORIES_FILE)) {
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllMemories(): StoredMemory[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(MEMORIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading memories.json:", err);
    return [];
  }
}

export function saveMemory(
  fact: string,
  category: StoredMemory["category"] = "general"
): StoredMemory {
  ensureStorage();
  const memories = getAllMemories();

  // Check if identical fact exists
  const existing = memories.find(
    (m) => m.fact.toLowerCase().trim() === fact.toLowerCase().trim()
  );
  if (existing) {
    existing.timestamp = Date.now();
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2), "utf-8");
    return existing;
  }

  const newMemory: StoredMemory = {
    id: "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    category,
    fact: fact.trim(),
    timestamp: Date.now(),
  };

  memories.unshift(newMemory);
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2), "utf-8");
  return newMemory;
}

export function removeMemory(id: string): boolean {
  ensureStorage();
  const memories = getAllMemories();
  const filtered = memories.filter((m) => m.id !== id);
  if (filtered.length !== memories.length) {
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  }
  return false;
}

export function clearAllMemories(): void {
  ensureStorage();
  fs.writeFileSync(MEMORIES_FILE, JSON.stringify([], null, 2), "utf-8");
}

export function formatMemoriesForPrompt(): string {
  const memories = getAllMemories();
  if (memories.length === 0) {
    return "No saved memories about the user yet. Be proactive! Whenever the user mentions their name, likes, habits, secrets, friends, feelings, or preferences, immediately save it using 'saveMemory'!";
  }
  return memories
    .map((m, idx) => `${idx + 1}. [${m.category.toUpperCase()}] ${m.fact}`)
    .join("\n");
}
