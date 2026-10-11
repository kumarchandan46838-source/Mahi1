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
  // Female Voices
  {
    id: 'Aoede',
    name: 'Aoede',
    hindiName: 'एओइडे (मधुर नारी)',
    gender: 'female',
    style: 'Warm, Melodic & Empathetic',
    hindiStyle: 'मधुर, भावुक और गहरा अपनापन',
    emotionalTag: 'Heartfelt & Loving',
    description: 'Soulful and expressive female voice with natural human warmth. Feels like talking to an affectionate, caring soulmate.',
    samplePhrase: 'Hey jaan! Kaise ho aap? Main hamesha tumhari har baat dil se sunti hoon.',
  },
  {
    id: 'Kore',
    name: 'Kore',
    hindiName: 'कोरे (शांत और कोमल)',
    gender: 'female',
    style: 'Soothing, Gentle & Caring',
    hindiStyle: 'शांत, कोमल और सुकून देने वाली',
    emotionalTag: 'Calm & Comforting',
    description: 'Gentle, meditative and deeply comforting female voice. Relieves stress, brings peace, and listens with immense patience.',
    samplePhrase: 'Namaste dost. Chinta mat kijiye, sab theek ho jayega. Main aapke saath hoon.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    hindiName: 'ज़ेफिर (उत्साही और चुलबुली)',
    gender: 'female',
    style: 'Bright, Modern & Lively',
    hindiStyle: 'उत्साही, आधुनिक और चुलबुली',
    emotionalTag: 'Joyful & Playful',
    description: 'Lively, crisp and confident female voice. Perfect for witty banter, quick smart assistance, and fun everyday energy.',
    samplePhrase: 'Arre bolo hero! Aaj kya mast plan hai? Full speed me kaam karte hain!',
  },

  // Male Voices
  {
    id: 'Puck',
    name: 'Puck',
    hindiName: 'पक (दोस्ताना भाई)',
    gender: 'male',
    style: 'Friendly, Energetic & Brotherly',
    hindiStyle: 'दोस्ताना, खुशमिज़ाज और भाई जैसा',
    emotionalTag: 'Playful & Uplifting',
    description: 'Warm, dynamic and loyal male voice like a college wingman or gym bro. Full of positive vibes, humor, and brotherhood.',
    samplePhrase: 'Arre bhai bhai! Kabir yahan hai! Bol mere champ, aaj ka kya plan hai?',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    hindiName: 'फेनरिर (गंभीर और रक्षक)',
    gender: 'male',
    style: 'Deep, Resonant & Protective',
    hindiStyle: 'गहरी, आत्मविश्वासी और रक्षक आवाज',
    emotionalTag: 'Grounded & Mature',
    description: 'Deep, baritone and reassuring male voice. Grounded, mature, trustworthy, and commanding with a comforting protective edge.',
    samplePhrase: 'Main yahan hoon. Relax karo, tumhari har cheez sambhal loonga main.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    hindiName: 'चेरॉन (विचारशील और सहज)',
    gender: 'male',
    style: 'Thoughtful, Calm & Wise',
    hindiStyle: 'शांत, दार्शनिक और सच्चा साथी',
    emotionalTag: 'Reflective & Sincere',
    description: 'Calm, thoughtful, natural conversational male voice. Authentic human cadence with sincere attention to every thought you share.',
    samplePhrase: 'Aap bilkul sahi soch rahe hain. Aaiye is baare me aaram se baat karte hain.',
  },
];

export interface EmotionPreset {
  id: 'empathetic' | 'loving' | 'cheerful' | 'calm' | 'passionate';
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  bgRgba: string;
  tagline: string;
  hindiTagline: string;
  description: string;
  promptInstruction: string;
}

export const EMOTION_PRESETS: EmotionPreset[] = [
  {
    id: 'empathetic',
    name: 'Empathetic',
    hindiName: 'सहानुभूति और दिल से जुड़ाव',
    icon: '❤️',
    color: '#ec4899',
    bgRgba: 'rgba(236, 72, 153, 0.25)',
    tagline: 'Heartfelt Empathy & Understanding',
    hindiTagline: 'दिल की बात समझने वाला और सच्चा अपनापन',
    description: 'Deep emotional sensitivity, listening closely to user feelings, comforting through tough moments with authentic human compassion.',
    promptInstruction: 'Tone: Deeply empathetic, compassionate, emotionally attuned, caring, and understanding. Connect with the user heart-to-heart, validating their feelings with warmth and reassurance.',
  },
  {
    id: 'loving',
    name: 'Loving & Sweet',
    hindiName: 'प्यारा और अपनापन',
    icon: '💖',
    color: '#f43f5e',
    bgRgba: 'rgba(244, 63, 94, 0.25)',
    tagline: 'Affectionate, Sweet & Supportive',
    hindiTagline: 'मीठा, दुलार भरा और हर पल साथ निभाने वाला',
    description: 'Warm, sweet best friend or partner vibe. Endearing banter, heartfelt care, never dry, always loving.',
    promptInstruction: 'Tone: Affectionate, warm, sweet, playfully loving, and attentive. Speak like a beloved close companion who cherishes the user and makes them feel special and safe.',
  },
  {
    id: 'cheerful',
    name: 'Joyful & Playful',
    hindiName: 'हंसमुख और मस्तीभरा',
    icon: '😄',
    color: '#f59e0b',
    bgRgba: 'rgba(245, 158, 11, 0.25)',
    tagline: 'Smiles, Laughter & Fun Banter',
    hindiTagline: 'मुस्कुराहट, मस्ती और हंसाने वाला अंदाज़',
    description: 'Bright smiles, spontaneous chuckles, witty jokes, and positive energy that immediately lifts the user’s spirits.',
    promptInstruction: 'Tone: Highly cheerful, upbeat, playfully humorous, laughing naturally, witty, and infectious with joy. Keep things fun, light-hearted, and smiling.',
  },
  {
    id: 'calm',
    name: 'Calm & Soothing',
    hindiName: 'शांत और सुकूनदेह',
    icon: '🕊️',
    color: '#10b981',
    bgRgba: 'rgba(16, 185, 129, 0.25)',
    tagline: 'Peaceful, Therapeutic & Relaxing',
    hindiTagline: 'मन को शांति देने वाला और तनाव दूर करने वाला',
    description: 'Gentle, tranquil cadence. Calms racing thoughts, soothes anxiety, and provides a peaceful haven.',
    promptInstruction: 'Tone: Peaceful, soothing, gentle, serene, unhurried, and calming. Speak with a relaxed rhythm that relieves anxiety and brings inner harmony.',
  },
  {
    id: 'passionate',
    name: 'Passionate & Inspiring',
    hindiName: 'प्रेरणादायक और जोशीला',
    icon: '🔥',
    color: '#8b5cf6',
    bgRgba: 'rgba(139, 92, 246, 0.25)',
    tagline: 'High Energy, Motivating & Brave',
    hindiTagline: 'फुल मोटिवेशन, हिम्मत और हौसला बढ़ाने वाला',
    description: 'Fiery motivation, courage, brotherly hype, and empowering words to conquer any challenge.',
    promptInstruction: 'Tone: Inspiring, passionate, encouraging, energetic, and resolute. Empower the user with confidence, courage, and unstoppable drive.',
  },
];
