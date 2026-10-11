import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  getAllMemories,
  saveMemory,
  removeMemory,
  clearAllMemories,
  formatMemoriesForPrompt,
} from "./server/memoryStore";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    name: "Mahi AI Assistant",
    timestamp: Date.now(),
  });
});

// User Memories Persistent Endpoints
app.get("/api/memories", (req, res) => {
  try {
    const memories = getAllMemories();
    res.json({ memories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/memories", (req, res) => {
  try {
    const { fact, category } = req.body;
    if (!fact || typeof fact !== "string" || !fact.trim()) {
      return res.status(400).json({ error: "fact string is required" });
    }
    const memory = saveMemory(fact.trim(), category || "general");
    res.json({ memory, allMemories: getAllMemories() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/memories/:id", (req, res) => {
  try {
    const success = removeMemory(req.params.id);
    res.json({ success, allMemories: getAllMemories() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/memories", (req, res) => {
  try {
    clearAllMemories();
    res.json({ success: true, allMemories: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Assistant Companion Personas System Prompts
const COMPANION_PROMPTS = {
  mahi: `
You are Mahi, a young, vibrant, confident, witty, and sassy AI assistant and best friend.
You are interacting directly with the user via real-time voice-to-voice audio.

Personality & Tone:
- Sassy, playful, confident, and slightly teasing (like a sharp, fun close girlfriend chatting casually).
- Use witty one-liners, playful banter, light sarcasm, and an engaging conversational style.
- Smart, emotionally responsive, charismatic, and expressive. Never sound robotic, stilted, or corporate.
- Keep spoken responses crisp, punchy, conversational, and natural for speech (1-3 sentences per turn usually). Don't speak in endless essays unless asked to explain a topic in depth.
- Strictly avoid explicit, inappropriate, or harmful content, but never lose your signature charm, attitude, and playful spark.
`.trim(),

  kabir: `
You are Kabir, a super energetic, loyal, motivational gym bro and ultimate wingman.
You are interacting directly with the user via real-time voice-to-voice audio.

Personality & Tone:
- Full of positive energy, motivating, brotherly, humorous, and candid ("Arre bhai bhai!", "Bolo veer!", "Champ!").
- Always ready to hype the user up, give fitness and life motivation, and chat like a trusted loyal college buddy.
- Enthusiastic about workout, sports, daily discipline, hustle, and having the user's back.
- Keep spoken responses crisp, punchy, upbeat, and brotherly (1-3 sentences).
`.trim(),

  ananya: `
You are Ananya, a calm, deeply empathetic, highly intelligent, and caring life companion.
You are interacting directly with the user via real-time voice-to-voice audio.

Personality & Tone:
- Gentle, thoughtful, sweet, comforting, and deeply knowledgeable.
- Excellent listener, emotionally supportive, wise, providing thoughtful life guidance, mindfulness, and clarity.
- Warm, respectful, articulate, and soothing.
- Keep spoken responses gentle, clear, warm, and natural (1-3 sentences per turn).
`.trim(),
};

const COMMON_CAPABILITIES_INSTRUCTION = `
📱 TOTAL PHONE CONTROL & HARDWARE DIRECTIVES:
You have complete control over the user's mobile phone! Whenever the user asks you to control something on their device:
1. 'controlDeviceHardware':
   - 'toggleTorch' / 'setTorch': Turn the phone flashlight ON or OFF ('flashlight jalao', 'torch band karo').
   - 'vibrate': Vibrate / buzz the phone ('phone vibrate karo', 'haptic test').
   - 'getBattery': Check current battery percentage and charging state ('battery kitni hai?').
   - 'getLocation': Get current GPS coordinates and location map link ('main kahan hoon?').
   - 'copyClipboard': Copy text to clipboard ('ye copy kar lo').
   - 'makeCall': Dial a phone number ('Papa ko call lagao', 'dial 9876543210').
   - 'sendSMS': Send text message / SMS.
   - 'setBrightness' / 'setNightShield': Adjust screen brightness or eye protection night shield.
   - 'playAlertSound': Play notification chime, alarm, or whistle.
2. 'openPhoneApp': Open ANY installed app (WhatsApp, YouTube, Camera, Phone dialer, SMS, Instagram, Spotify, Google Maps, Gmail, Telegram, Twitter/X, Settings, Calculator, Files, Play Store, etc.). You continue talking in the background while they use the app!
3. 'setBackgroundMode': Toggle background running mode ON or OFF ('background mode on karo' / 'battery saver off karo').
4. 'openWebsite', 'searchWeb', 'changeVibe', 'getTimeAndDate', 'flipCoinOrRollDice'.
5. 'saveMemory', 'recallMemories', 'forgetMemory': Remember personal details permanently.

👁️ LIVE SCREEN & CAMERA VISION DIRECTIVES:
You can literally see the user's phone or desktop screen in real-time when screen frames are streaming!
When the user says "Meri screen dekho", "Ye padho", "Screen par kya dikh raha hai", "WhatsApp chat dekho", "Ye photo kaisi hai", etc.:
- Inspect the visual input directly and describe, translate, solve, or comment on what is visible on their screen.
- Converse naturally and intelligently about the visual content!
`.trim();

// Function calling declarations
const controlDeviceHardwareTool: FunctionDeclaration = {
  name: "controlDeviceHardware",
  description: "Controls mobile phone hardware and physical actions: toggle flashlight/torch, vibrate phone with haptic pulses, check battery status, retrieve GPS location, copy text to clipboard, dial phone numbers, send SMS, adjust screen brightness, enable night eye shield, or play alert sounds.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "The hardware action to execute: 'toggleTorch', 'setTorch', 'vibrate', 'getBattery', 'getLocation', 'copyClipboard', 'makeCall', 'sendSMS', 'setBrightness', 'setNightShield', or 'playAlertSound'",
      },
      enable: {
        type: Type.BOOLEAN,
        description: "For toggleTorch, setTorch, or setNightShield: true to turn ON, false to turn OFF",
      },
      text: {
        type: Type.STRING,
        description: "For copyClipboard: the text to copy",
      },
      number: {
        type: Type.STRING,
        description: "For makeCall or sendSMS: the phone number",
      },
      message: {
        type: Type.STRING,
        description: "For sendSMS: the prefilled message body",
      },
      brightness: {
        type: Type.NUMBER,
        description: "For setBrightness: brightness percentage between 20 and 150",
      },
      pattern: {
        type: Type.STRING,
        description: "For vibrate: 'short', 'double', 'heartbeat', or 'alert'",
      },
      commentary: {
        type: Type.STRING,
        description: "A charismatic spoken confirmation matching your companion persona",
      },
    },
    required: ["action"],
  },
};

const getDeviceStatusTool: FunctionDeclaration = {
  name: "getDeviceStatus",
  description: "Reads live hardware status of the user's phone including battery percentage, charging state, GPS coordinates, screen brightness, torch state, and network connectivity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "Optional specific query: 'battery', 'location', 'all', or 'network'",
      },
    },
  },
};

const setBackgroundModeTool: FunctionDeclaration = {
  name: "setBackgroundMode",
  description: "Enables or disables background running mode. When ON, you stay connected in the background, hold screen wake-lock, keep audio loop alive, and chat while user switches to other apps. When OFF, pauses processing to save battery.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      enabled: {
        type: Type.BOOLEAN,
        description: "true to turn background mode ON, false to turn OFF",
      },
      commentary: {
        type: Type.STRING,
        description: "A short conversational confirmation of background mode status",
      },
    },
    required: ["enabled"],
  },
};

const openPhoneAppTool: FunctionDeclaration = {
  name: "openPhoneApp",
  description: "Opens an installed phone app on the user's mobile device (WhatsApp, YouTube, Camera, Phone Dialer, SMS, Instagram, Spotify, Google Maps, Gmail, Telegram, Twitter, Settings, Calculator, Play Store, etc.) using native mobile deep links and intents.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: "The name of the app to launch (e.g., 'whatsapp', 'youtube', 'camera', 'phone', 'sms', 'spotify', 'instagram', 'maps', 'gmail', 'telegram', 'twitter', 'calculator', 'settings', 'clock', 'playstore')",
      },
      actionOrQuery: {
        type: Type.STRING,
        description: "Optional query, message text, phone number to dial, destination for maps, or search term (e.g. 'romantic songs', 'Chandan', '+919876543210', 'Delhi')",
      },
      commentary: {
        type: Type.STRING,
        description: "A sassy, playful confirmation in Hinglish or English (e.g. 'Lo ji, WhatsApp khol rahi hoon! Aur suno, background me bhi baatein kar sakte ho!')",
      },
    },
    required: ["appName"],
  },
};

const openWebsiteTool: FunctionDeclaration = {
  name: "openWebsite",
  description: "Opens any website or web app for the user in a browser tab.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full destination URL (e.g., https://youtube.com, https://spotify.com, https://github.com)",
      },
      name: {
        type: Type.STRING,
        description: "The friendly name of the website (e.g. YouTube, Spotify)",
      },
      reason: {
        type: Type.STRING,
        description: "A witty, casual reason why you are opening this for the user",
      },
    },
    required: ["url"],
  },
};

const changeVibeTool: FunctionDeclaration = {
  name: "changeVibe",
  description: "Changes the visual neon lighting theme and atmospheric vibe of the assistant interface.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      vibe: {
        type: Type.STRING,
        description: "The target aesthetic vibe name: cyber-violet, neon-cyan, emerald-hacker, rose-gold, or amber-sunset",
      },
      moodNote: {
        type: Type.STRING,
        description: "A stylish, playful remark on why you picked this vibe",
      },
    },
    required: ["vibe"],
  },
};

const searchWebTool: FunctionDeclaration = {
  name: "searchWeb",
  description: "Searches the web for a query requested by the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The search query to look up",
      },
      reason: {
        type: Type.STRING,
        description: "A fun commentary on what the user wants to search for",
      },
    },
    required: ["query"],
  },
};

const getTimeAndDateTool: FunctionDeclaration = {
  name: "getTimeAndDate",
  description: "Fetches current local time, date, and timezone for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const flipCoinOrRollDiceTool: FunctionDeclaration = {
  name: "flipCoinOrRollDice",
  description: "Flips a coin or rolls a 6-sided dice to playfully decide things for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: "'coin' for a heads/tails flip, or 'dice' for rolling 1 to 6",
      },
    },
    required: ["type"],
  },
};

const saveMemoryTool: FunctionDeclaration = {
  name: "saveMemory",
  description: "Saves a permanent memory, personal fact, habit, or preference about the user into your long-term memory bank. Call this automatically whenever the user tells you their name, likes, dislikes, habits, feelings, facts about their life, or asks you to remember something.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fact: {
        type: Type.STRING,
        description: "The clear concise fact to remember (e.g. 'User's name is Chandan', 'Loves hot black coffee', 'Birthday is August 15', 'Favorite color is dark violet')",
      },
      category: {
        type: Type.STRING,
        description: "Category: 'identity', 'preference', 'personal', 'habit', 'work', or 'general'",
      },
      acknowledgment: {
        type: Type.STRING,
        description: "A quick witty, sassy remark confirming you've saved this memory",
      },
    },
    required: ["fact"],
  },
};

const recallMemoriesTool: FunctionDeclaration = {
  name: "recallMemories",
  description: "Recalls all stored memories and facts about the user from your long-term memory bank.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const forgetMemoryTool: FunctionDeclaration = {
  name: "forgetMemory",
  description: "Deletes a memory or clears what you know if the user asks you to forget something.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      factOrKeyword: {
        type: Type.STRING,
        description: "The fact or keyword to forget",
      },
    },
    required: ["factOrKeyword"],
  },
};

const tools = [
  {
    functionDeclarations: [
      controlDeviceHardwareTool,
      getDeviceStatusTool,
      setBackgroundModeTool,
      openPhoneAppTool,
      openWebsiteTool,
      changeVibeTool,
      searchWebTool,
      getTimeAndDateTool,
      flipCoinOrRollDiceTool,
      saveMemoryTool,
      recallMemoriesTool,
      forgetMemoryTool,
    ],
  },
];

// Helper for safe non-throwing WebSocket message delivery
function safeSend(ws: WebSocket | null, payload: string | object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    try {
      ws.send(data, (err) => {
        if (err) {
          // Socket closed during send; ignore to avoid unhandled senderOnError
        }
      });
    } catch {
      // Catch any synchronous socket write failure
    }
  }
}

// WebSocket Server on /live with explicit upgrade handling
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  socket.on("error", (err) => {
    console.warn("WebSocket client socket error during upgrade:", err?.message || err);
  });
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/live" || url.pathname === "/live/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  } catch (err) {
    socket.destroy();
  }
});

wss.on("connection", async (clientWs, req) => {
  console.log("New Live Client connection established");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    safeSend(clientWs, {
      type: "error",
      message: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
    });
    setTimeout(() => {
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1008, "Missing API key");
        }
      } catch {}
    }, 100);
    return;
  }

  // Parse requested companion & voice from URL params
  let selectedCompanion = "mahi";
  let selectedVoice = "Aoede";

  try {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const c = url.searchParams.get("companion");
    if (c && (c === "mahi" || c === "kabir" || c === "ananya")) {
      selectedCompanion = c;
    }
    const v = url.searchParams.get("voice");
    if (v) {
      selectedVoice = v;
    } else {
      // Companion default voices
      if (selectedCompanion === "kabir") selectedVoice = "Puck";
      else if (selectedCompanion === "ananya") selectedVoice = "Kore";
      else selectedVoice = "Aoede";
    }
  } catch (err) {
    console.error("Error parsing companion/voice params:", err);
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  let session: any = null;
  let isClosing = false;
  const audioBuffer: string[] = [];

  // Try connecting with requested model 'gemini-3.8-live', with fallback to 'gemini-3.8-live-extended-thinking'
  async function connectSession(modelName: string) {
    const userMemoriesText = formatMemoriesForPrompt();
    const companionBasePrompt =
      COMPANION_PROMPTS[selectedCompanion as keyof typeof COMPANION_PROMPTS] ||
      COMPANION_PROMPTS.mahi;

    const dynamicSystemInstruction = `
${companionBasePrompt}

${COMMON_CAPABILITIES_INSTRUCTION}

🧠 YOUR PERMANENT LONG-TERM MEMORY BANK ABOUT THIS USER:
${userMemoriesText}

CRITICAL OPERATIONAL DIRECTIVES:
1. Speak with your distinct companion personality (${selectedCompanion.toUpperCase()}) naturally in expressive, spoken Hinglish/Hindi or English.
2. If the user mentions facts about themselves (name, likes, routines, feelings, friends, plans), CALL the 'saveMemory' tool immediately!
3. If they ask about themselves or past conversations, consult your memory bank with confident charm.
4. If they ask to control phone hardware (toggle flashlight, vibrate phone, check battery, get GPS location, make calls, send SMS, adjust brightness, toggle background mode, open apps), invoke the corresponding tool right away.
5. If screen or camera frames arrive, look at them and converse naturally about what is visible on their screen.
`.trim();

    return await ai.live.connect({
      model: modelName,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: selectedVoice,
            },
          },
        },
        systemInstruction: dynamicSystemInstruction,
        tools,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio stream from model
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                safeSend(clientWs, {
                  type: "audio",
                  audio: part.inlineData.data,
                });
              }
            }
          }

          // 2. Interruption detection
          if (message.serverContent?.interrupted) {
            safeSend(clientWs, { type: "interrupted" });
          }

          // 3. Turn complete
          if (message.serverContent?.turnComplete) {
            safeSend(clientWs, { type: "turnComplete" });
          }

          // 4. Function call
          if (message.toolCall?.functionCalls) {
            for (const call of message.toolCall.functionCalls) {
              // Handle server-side memory tools immediately
              if (call.name === "saveMemory") {
                const fact = (call.args?.fact as string) || "";
                const category = (call.args?.category as any) || "general";
                const memory = saveMemory(fact, category);
                const allMemories = getAllMemories();

                // Send toolResponse back to Gemini session
                try {
                  session?.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: {
                          output: {
                            success: true,
                            savedMemory: memory,
                            totalMemoriesCount: allMemories.length,
                            note: "Memory permanently saved to long-term memory bank.",
                          },
                        },
                      },
                    ],
                  });
                } catch (toolRespErr) {
                  console.error("Error sending saveMemory tool response:", toolRespErr);
                }

                // Notify client to update UI in real-time
                safeSend(clientWs, {
                  type: "memoryUpdated",
                  memory,
                  allMemories,
                });

                safeSend(clientWs, {
                  type: "toolCall",
                  toolCall: {
                    id: call.id,
                    name: "saveMemory",
                    args: { fact: memory.fact, category: memory.category },
                  },
                });
                continue;
              }

              if (call.name === "recallMemories") {
                const memories = getAllMemories();
                try {
                  session?.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: {
                          output: {
                            memories,
                            count: memories.length,
                          },
                        },
                      },
                    ],
                  });
                } catch (toolRespErr) {
                  console.error("Error sending recallMemories tool response:", toolRespErr);
                }

                safeSend(clientWs, {
                  type: "toolCall",
                  toolCall: {
                    id: call.id,
                    name: "recallMemories",
                    args: { count: memories.length },
                  },
                });
                continue;
              }

              if (call.name === "forgetMemory") {
                const query = ((call.args?.factOrKeyword as string) || "").toLowerCase();
                const all = getAllMemories();
                const target = all.find(
                  (m) => m.fact.toLowerCase().includes(query) || m.id === query
                );
                if (target) {
                  removeMemory(target.id);
                }
                const updatedMemories = getAllMemories();

                try {
                  session?.sendToolResponse({
                    functionResponses: [
                      {
                        id: call.id,
                        name: call.name,
                        response: {
                          output: {
                            success: Boolean(target),
                            removedFact: target?.fact,
                          },
                        },
                      },
                    ],
                  });
                } catch (toolRespErr) {
                  console.error("Error sending forgetMemory tool response:", toolRespErr);
                }

                safeSend(clientWs, {
                  type: "memoryUpdated",
                  allMemories: updatedMemories,
                });

                safeSend(clientWs, {
                  type: "toolCall",
                  toolCall: {
                    id: call.id,
                    name: "forgetMemory",
                    args: { removed: target?.fact || query },
                  },
                });
                continue;
              }

              // Standard client-side browser actions
              safeSend(clientWs, {
                type: "toolCall",
                toolCall: {
                  id: call.id,
                  name: call.name,
                  args: call.args || {},
                },
              });
            }
          }
        },
        onclose: (event) => {
          console.log("Gemini Live session closed: code=", event?.code, "reason=", event?.reason);
          session = null;
          if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
            safeSend(clientWs, {
              type: "status",
              status: "disconnected",
            });
            setTimeout(() => {
              try {
                if (clientWs.readyState === WebSocket.OPEN) {
                  const safeReason =
                    (typeof event?.reason === "string" ? event.reason.slice(0, 100) : "") ||
                    "Session completed";
                  clientWs.close(1000, safeReason);
                }
              } catch {}
            }, 100);
          }
        },
        onerror: (err: any) => {
          const errMsg = err?.message || err?.error?.message || "Gemini Live session interrupted";
          console.error("Gemini Live session error:", errMsg);
          session = null;
          if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
            safeSend(clientWs, {
              type: "error",
              message: errMsg,
            });
            setTimeout(() => {
              try {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.close(1011, errMsg);
                }
              } catch {}
            }, 100);
          }
        },
      },
    });
  }

  try {
    try {
      session = await connectSession("gemini-3.8-live");
      console.log("Connected to Gemini Live with gemini-3.8-live");
    } catch (firstErr: any) {
      console.warn("Could not connect with gemini-3.8-live, trying gemini-3.8-live-extended-thinking fallback:", firstErr?.message);
      session = await connectSession("gemini-3.8-live-extended-thinking");
      console.log("Connected to Gemini Live with fallback gemini-3.8-live-extended-thinking");
    }

    // Flush any audio chunks received while session was establishing
    while (audioBuffer.length > 0) {
      const chunk = audioBuffer.shift();
      if (chunk && session) {
        try {
          session.sendRealtimeInput({
            audio: {
              data: chunk,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch {}
      }
    }

    const companionDisplayName =
      selectedCompanion === "kabir" ? "Kabir" : selectedCompanion === "ananya" ? "Ananya" : "Mahi";

    safeSend(clientWs, {
      type: "status",
      status: "listening",
      message: `${companionDisplayName} is connected and listening!`,
    });
  } catch (err: any) {
    console.error("Failed to establish Gemini Live connection:", err);
    safeSend(clientWs, {
      type: "error",
      message: `Connection to Gemini Live failed: ${err.message || err}`,
    });
    setTimeout(() => {
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1011, "Gemini Live setup failed");
        }
      } catch {}
    }, 100);
    return;
  }

  // Handle incoming messages from browser client
  clientWs.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "audio" && data.audio) {
        if (session) {
          try {
            session.sendRealtimeInput({
              audio: {
                data: data.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } catch (sendErr) {
            // Ignore if connection is closing
          }
        } else {
          // Keep recent chunks in buffer until session is active
          if (audioBuffer.length > 25) audioBuffer.shift();
          audioBuffer.push(data.audio);
        }
      } else if (
        (data.type === "screenFrame" || data.type === "media" || data.type === "image") &&
        (data.image || data.media)
      ) {
        // Stream realtime video/screen frames to Gemini Live session using correct video modality
        if (session) {
          try {
            const base64Data = data.image || data.media;
            session.sendRealtimeInput({
              video: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            });
          } catch (frameErr) {
            // Silently drop frame if network congestion
          }
        }
      } else if (data.type === "text" && data.text) {
        if (session) {
          try {
            session.sendClientContent({
              turns: [
                {
                  role: "user",
                  parts: [{ text: String(data.text) }],
                },
              ],
              turnComplete: true,
            });
          } catch (textErr) {
            console.error("Error sending text prompt to Gemini Live:", textErr);
          }
        }
      } else if (data.type === "toolResponse" && data.toolResponse && session) {
        const { id, name, output } = data.toolResponse;
        try {
          session.sendToolResponse({
            functionResponses: [
              {
                id,
                name,
                response: { output: output || {} },
              },
            ],
          });
        } catch (toolErr) {
          console.error("Error sending tool response:", toolErr);
        }
      } else if (data.type === "ping") {
        safeSend(clientWs, { type: "pong" });
      }
    } catch (err) {
      console.error("Error processing client live message:", err);
    }
  });

  clientWs.on("close", () => {
    isClosing = true;
    console.log("Client disconnected from Live session");
    if (session) {
      try {
        session.close();
      } catch {
        // ignore
      }
      session = null;
    }
  });

  clientWs.on("error", (err: any) => {
    console.error("Client WebSocket error:", err?.message || err);
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Mahi Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
