import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  ArrowLeft,
  Bell,
  Bookmark,
  CircleEllipsis,
  Copy,
  Cpu,
  Download,
  Edit3,
  FileText,
  Folder,
  FolderPlus,
  Hash,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  Repeat2,
  RotateCcw,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  WandSparkles,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChangeEvent, CSSProperties, DragEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

interface LocalImage {
  id: string;
  name: string;
  dataUrl: string;
}

interface ProjectFile {
  id: string;
  name: string;
  type: "image" | "text";
  mimeType: string;
  content: string;
}

interface WebSource {
  title: string;
  url: string;
  content?: string;
  engine?: string | null;
  score?: number | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: LocalImage[];
  sources?: WebSource[];
}

interface ThemeConfig {
  id: string;
  label: string;
  appBg: string;
  sidebarBg: string;
  panelBg: string;
  textColor: string;
  mutedText: string;
  accent: string;
  accentTo: string;
  assistantBubble: string;
  assistantText: string;
  actionButtonBg: string;
  actionButtonText: string;
  userBubble: string;
  userText: string;
  radius: number;
  fontScale: number;
  inputWidth: number;
  ambientEffect: "none" | "snow" | "rain" | "stars";
  buttonIconStyle: "icons" | "emoji";
  buttonEmojis: Record<string, string>;
}

interface SavedChat {
  id: string;
  projectId?: string | null;
  title: string;
  messages: Message[];
  updatedAt: number;
  pinned?: boolean;
}

interface Project {
  id: string;
  name: string;
  assistantName: string;
  prompt: string;
  images: LocalImage[];
  files?: ProjectFile[];
  updatedAt: number;
}

interface XComment {
  author: string;
  text: string;
  likes: number;
}

interface XPost {
  id: string;
  author: string;
  handle: string;
  bio: string;
  followers: number;
  following: number;
  text: string;
  likes: number;
  commentsCount: number;
  reposts: number;
  views: number;
  comments: XComment[];
}

interface XMessage {
  id: string;
  role: "user" | "author";
  text: string;
}

type XScreen = "feed" | "profile" | "messages";

const formatXMetric = (value: number) => {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1))}M`;
  if (value >= 1_000) return `${Number((value / 1_000).toFixed(value >= 10_000 ? 0 : 1))}K`;
  return String(value);
};

const normalizeHandle = (value: string) => {
  const clean = value.trim().replace(/^@/, "").replace(/[^\w]/g, "").slice(0, 18);
  return clean ? `@${clean}` : "";
};

const getSourceHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const getShortStatusQuery = (value: string) => {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 58 ? `${clean.slice(0, 58).trim()}...` : clean;
};

const MODEL_OPTIONS = [
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (Fast & Clever)" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Design Expert)" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Efficient)" },
  { value: "deepseek/deepseek-chat", label: "DeepSeek V3 (Economic)" },
];

const DEFAULT_BUTTON_EMOJIS = {
  newChat: "✚",
  newProject: "📁",
  search: "🔎",
  aiX: "#",
  settings: "⚙️",
  addFiles: "🖼️",
  modifier: "✨",
  webSearch: "🌐",
  projects: "📂",
  send: "↑",
  assistant: "✦"
};

const THEME_OPTIONS: ThemeConfig[] = [
  { id: "aether", label: "Aether", appBg: "#000000", sidebarBg: "#0A0A0A", panelBg: "#121212", textColor: "#F5F5F5", mutedText: "#A1A1AA", accent: "#A855F7", accentTo: "#3B82F6", assistantBubble: "#121212", assistantText: "#F5F5F5", actionButtonBg: "#1F2937", actionButtonText: "#F9FAFB", userBubble: "#2F2F2F", userText: "#F5F5F5", radius: 32, fontScale: 1, inputWidth: 896, ambientEffect: "none", buttonIconStyle: "icons", buttonEmojis: DEFAULT_BUTTON_EMOJIS },
  { id: "graphite", label: "Graphite", appBg: "#09090B", sidebarBg: "#111113", panelBg: "#18181B", textColor: "#F4F4F5", mutedText: "#A1A1AA", accent: "#A1A1AA", accentTo: "#52525B", assistantBubble: "#18181B", assistantText: "#F4F4F5", actionButtonBg: "#27272A", actionButtonText: "#F4F4F5", userBubble: "#E4E4E7", userText: "#09090B", radius: 26, fontScale: 1, inputWidth: 896, ambientEffect: "none", buttonIconStyle: "icons", buttonEmojis: DEFAULT_BUTTON_EMOJIS },
  { id: "ember", label: "Ember", appBg: "#0E0705", sidebarBg: "#160D0A", panelBg: "#1F130F", textColor: "#FFF7ED", mutedText: "#FDBA74", accent: "#F97316", accentTo: "#EF4444", assistantBubble: "#1F130F", assistantText: "#FFF7ED", actionButtonBg: "#431407", actionButtonText: "#FFF7ED", userBubble: "#FFF7ED", userText: "#1C0A03", radius: 28, fontScale: 1, inputWidth: 896, ambientEffect: "none", buttonIconStyle: "icons", buttonEmojis: DEFAULT_BUTTON_EMOJIS },
  { id: "aurora", label: "Aurora", appBg: "#020617", sidebarBg: "#07111F", panelBg: "#0B1627", textColor: "#ECFEFF", mutedText: "#99F6E4", accent: "#14B8A6", accentTo: "#8B5CF6", assistantBubble: "#0B1627", assistantText: "#ECFEFF", actionButtonBg: "#134E4A", actionButtonText: "#ECFEFF", userBubble: "#CCFBF1", userText: "#042F2E", radius: 30, fontScale: 1, inputWidth: 896, ambientEffect: "none", buttonIconStyle: "icons", buttonEmojis: DEFAULT_BUTTON_EMOJIS },
];
const DEFAULT_CUSTOM_THEME: ThemeConfig = { ...THEME_OPTIONS[0], id: "custom", label: "Custom" };

const DEFAULT_PROMPT = "You are Aether, a helpful local AI assistant. Answer clearly, adapt to the user's task, and respond in the user's language.";
const PROJECT_FALLBACK_PROMPT = "Use the active project's name, instructions, files, and chat history as context. If project files are attached, use them only when relevant.";
const IMPORTABLE_TEXT_EXTENSIONS = [".txt", ".md", ".json", ".csv", ".ts", ".tsx"];
const LOCAL_SEARCH_CHAT_URL = "http://localhost:8000/chat";
const PROMPT_TEMPLATES = [
  {
    title: "Код-ревью",
    prompt: "Act as a senior code reviewer. Find bugs, regressions, security risks, unclear logic, and missing tests. Start with findings ordered by severity, then give concise fixes. Respond in the user's language."
  },
  {
    title: "Переводчик",
    prompt: "Act as a precise translator. Preserve meaning, tone, formatting, names, code, and markdown. If the target language is not specified, ask one short clarifying question."
  },
  {
    title: "Учитель",
    prompt: "Act as a patient teacher. Explain step by step, use examples, check assumptions, and adapt difficulty to the user. Keep explanations practical and clear."
  },
  {
    title: "Генератор постов",
    prompt: "Act as a social media post generator. Create punchy posts with hooks, variants, platform-specific tone, and optional hashtags. Avoid generic filler."
  },
  {
    title: "Помощник по проекту",
    prompt: "Act as a project assistant. Use project instructions, files, and chat history to plan work, track decisions, summarize context, and propose next actions."
  },
  {
    title: "Дизайнер сайта",
    prompt: "Act as a UI theme designer for this app. When the user asks to change the site's look, return a short explanation and a JSON object in a fenced ```json block with a theme object. Allowed keys: appBg, sidebarBg, panelBg, textColor, mutedText, accent, accentTo, assistantBubble, assistantText, actionButtonBg, actionButtonText, userBubble, userText, radius, fontScale, inputWidth, ambientEffect, buttonIconStyle, buttonEmojis. Use valid #RRGGBB hex colors only. White/light backgrounds are allowed, but all readable text must stay high contrast: assistantText on assistantBubble, userText on userBubble, actionButtonText on actionButtonBg, main textColor on appBg/panelBg, sidebar text on sidebarBg, muted labels on their backgrounds, and button text/icons on button backgrounds. Never use the same or almost the same color for any text/icon and its background; buttons and action icons must not blend into appBg, panelBg, assistantBubble, userBubble, cards, or the page. Do not use one flat color for the whole interface. ambientEffect can be none, snow, rain, or stars. buttonIconStyle can be icons or emoji. buttonEmojis can include newChat, newProject, search, aiX, settings, addFiles, modifier, webSearch, projects, send, assistant. Keep radius 10-42, fontScale 0.9-1.15, inputWidth 640-1120. Avoid chaotic layouts or low contrast. Do not include code changes."
  }
];

const createProject = (name = "New Project"): Project => ({
  id: crypto.randomUUID(),
  name,
  assistantName: "Aether",
  prompt: "",
  images: [],
  files: [],
  updatedAt: Date.now()
});

const readImageFile = (file: File) => new Promise<LocalImage>((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve({
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    name: file.name,
    dataUrl: String(reader.result)
  });
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const readProjectFile = (file: File) => new Promise<ProjectFile>((resolve, reject) => {
  const reader = new FileReader();
  const isImage = file.type.startsWith("image/");

  reader.onload = () => resolve({
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    name: file.name,
    type: isImage ? "image" : "text",
    mimeType: file.type || "text/plain",
    content: String(reader.result)
  });
  reader.onerror = () => reject(reader.error);

  if (isImage) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
});

const isSupportedProjectFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return file.type.startsWith("image/") || IMPORTABLE_TEXT_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
};

const isEmptyDefaultProject = (project: Project) => (
  project.name === "Custom Project" &&
  !project.prompt &&
  !project.images?.length &&
  (!project.assistantName || project.assistantName === "Aether" || project.assistantName === "My Character")
);

const loadProjects = () => {
  try {
    const projects = JSON.parse(localStorage.getItem("aether_projects") || "[]") as Array<Project & { characterName?: string }>;
    const normalizedProjects = projects.map((project) => ({
      ...project,
      assistantName: project.assistantName || project.characterName || "Aether",
      files: project.files || []
    })).filter((project) => !isEmptyDefaultProject(project));
    return normalizedProjects;
  } catch {
    return [];
  }
};

const loadSavedChats = () => {
  try {
    return JSON.parse(localStorage.getItem("aether_saved_chats") || "[]") as SavedChat[];
  } catch {
    return [];
  }
};

const getChatTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content.trim());
  return firstUserMessage?.content.trim().slice(0, 42) || "New chat";
};

const normalizeAssistantMarkdown = (content: string) => (
  content.replace(/<br\s*\/?>/gi, "  \n")
);

const stripInlineSources = (content: string) => {
  const withoutSourceSection = content
    .replace(/\n{0,2}(?:#{1,6}\s*)?(?:источники?|sources?|source)\s*:?\s*[\s\S]*$/i, "")
    .replace(/\n{0,2}(?:[-*_]\s*){3,}\s*\n\s*(?:источники?|sources?|source)\s*:?\s*[\s\S]*$/i, "");

  return withoutSourceSection
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, "$1")
    .replace(/\[\d+\]/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const isHexColor = (value: unknown) => (
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value.trim())
);

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
};

const isThemeEffect = (value: unknown): value is ThemeConfig["ambientEffect"] => (
  value === "none" || value === "snow" || value === "rain" || value === "stars"
);

const isIconStyle = (value: unknown): value is ThemeConfig["buttonIconStyle"] => (
  value === "icons" || value === "emoji"
);

const sanitizeEmojiMap = (value: unknown, fallback: Record<string, string>) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  return Object.entries({ ...fallback, ...(value as Record<string, unknown>) }).reduce<Record<string, string>>((acc, [key, raw]) => {
    const emoji = typeof raw === "string" ? raw.trim().slice(0, 4) : fallback[key];
    acc[key] = emoji || fallback[key] || "•";
    return acc;
  }, {});
};

const relativeLuminance = (hex: string) => {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (first: string, second: string) => {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));

  return (lighter + 0.05) / (darker + 0.05);
};

const readableTextFor = (background: string) => (
  contrastRatio(background, "#111827") >= 4.5 ? "#111827" : "#F9FAFB"
);

const sanitizeTheme = (theme: Partial<ThemeConfig>, base: ThemeConfig = DEFAULT_CUSTOM_THEME): ThemeConfig => {
  const next: ThemeConfig = {
    ...base,
    id: "custom",
    label: "Custom",
    appBg: isHexColor(theme.appBg) ? String(theme.appBg).trim() : base.appBg,
    sidebarBg: isHexColor(theme.sidebarBg) ? String(theme.sidebarBg).trim() : base.sidebarBg,
    panelBg: isHexColor(theme.panelBg) ? String(theme.panelBg).trim() : base.panelBg,
    textColor: isHexColor(theme.textColor) ? String(theme.textColor).trim() : base.textColor,
    mutedText: isHexColor(theme.mutedText) ? String(theme.mutedText).trim() : base.mutedText,
    accent: isHexColor(theme.accent) ? String(theme.accent).trim() : base.accent,
    accentTo: isHexColor(theme.accentTo) ? String(theme.accentTo).trim() : base.accentTo,
    assistantBubble: isHexColor(theme.assistantBubble) ? String(theme.assistantBubble).trim() : (base.assistantBubble || base.panelBg),
    assistantText: isHexColor(theme.assistantText) ? String(theme.assistantText).trim() : (base.assistantText || base.textColor),
    actionButtonBg: isHexColor(theme.actionButtonBg) ? String(theme.actionButtonBg).trim() : (base.actionButtonBg || base.panelBg),
    actionButtonText: isHexColor(theme.actionButtonText) ? String(theme.actionButtonText).trim() : (base.actionButtonText || base.textColor),
    userBubble: isHexColor(theme.userBubble) ? String(theme.userBubble).trim() : base.userBubble,
    userText: isHexColor(theme.userText) ? String(theme.userText).trim() : base.userText,
    radius: clampNumber(theme.radius, base.radius, 10, 42),
    fontScale: clampNumber(theme.fontScale, base.fontScale, 0.9, 1.15),
    inputWidth: clampNumber(theme.inputWidth, base.inputWidth, 640, 1120),
    ambientEffect: isThemeEffect(theme.ambientEffect) ? theme.ambientEffect : base.ambientEffect,
    buttonIconStyle: isIconStyle(theme.buttonIconStyle) ? theme.buttonIconStyle : base.buttonIconStyle,
    buttonEmojis: sanitizeEmojiMap(theme.buttonEmojis, base.buttonEmojis || DEFAULT_BUTTON_EMOJIS)
  };

  if (contrastRatio(next.userBubble, next.userText) < 4.5) {
    next.userText = readableTextFor(next.userBubble);
  }

  if (contrastRatio(next.assistantBubble, next.assistantText) < 4.5) {
    next.assistantText = readableTextFor(next.assistantBubble);
  }

  if (contrastRatio(next.actionButtonBg, next.actionButtonText) < 4.5) {
    next.actionButtonText = readableTextFor(next.actionButtonBg);
  }

  if (contrastRatio(next.appBg, next.actionButtonBg) < 1.25 && contrastRatio(next.panelBg, next.actionButtonBg) < 1.25) {
    next.actionButtonBg = contrastRatio(next.appBg, "#111827") >= 1.25 ? "#111827" : "#E5E7EB";
    next.actionButtonText = readableTextFor(next.actionButtonBg);
  }

  if (contrastRatio(next.appBg, next.textColor) < 4.5) {
    next.textColor = readableTextFor(next.appBg);
  }

  if (contrastRatio(next.appBg, next.mutedText) < 3) {
    next.mutedText = contrastRatio(next.appBg, "#6B7280") >= 3 ? "#6B7280" : "#A1A1AA";
  }

  if (contrastRatio(next.sidebarBg, next.textColor) < 3) {
    next.sidebarBg = next.appBg;
  }

  if (contrastRatio(next.panelBg, next.textColor) < 3) {
    next.panelBg = next.appBg;
  }

  return next;
};

const loadCustomTheme = () => {
  try {
    return sanitizeTheme(JSON.parse(localStorage.getItem("aether_custom_theme") || "{}"));
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
};

const extractDesignTheme = (content: string): Partial<ThemeConfig> | null => {
  const jsonText = content.match(/```json\s*([\s\S]*?)```/)?.[1] || content.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText);
    const theme = parsed.theme || parsed;

    return typeof theme === "object" && theme ? theme : null;
  } catch {
    return null;
  }
};

const fallbackXPosts: XPost[] = [
  {
    id: crypto.randomUUID(),
    author: "Aether Lab",
    handle: "@aether_lab",
    bio: "Local AI studio building strange social simulations.",
    followers: 12840,
    following: 128,
    text: "Лента не смогла распарсить JSON от модели. Попробуй обновить AI X еще раз или выбери другую модель.",
    likes: 128,
    commentsCount: 2,
    reposts: 9,
    views: 4200,
    comments: [
      { author: "Local User", text: "Нужен чистый JSON без Markdown.", likes: 12 },
      { author: "Model Watch", text: "Некоторые модели любят добавлять пояснения вокруг JSON.", likes: 8 }
    ]
  }
];

export const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [input, setInput] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>(() => loadSavedChats());
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem("aether_active_project_id") || "");
  const [activeChatId, setActiveChatId] = useState(() => localStorage.getItem("aether_active_chat_id") || crypto.randomUUID());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isPromptMenuOpen, setIsPromptMenuOpen] = useState(false);
  const [sourcePanel, setSourcePanel] = useState<{ title: string; sources: WebSource[] } | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "x">("chat");
  const [xPosts, setXPosts] = useState<XPost[]>([]);
  const [isXLoading, setIsXLoading] = useState(false);
  const [xError, setXError] = useState("");
  const [xScreen, setXScreen] = useState<XScreen>("feed");
  const [selectedXHandle, setSelectedXHandle] = useState("");
  const [xMessageInput, setXMessageInput] = useState("");
  const [xThreads, setXThreads] = useState<Record<string, XMessage[]>>({});
  const [isXMessageLoading, setIsXMessageLoading] = useState(false);
  const [xUserName, setXUserName] = useState(() => localStorage.getItem("ai_x_user_name") || "");
  const [xUserHandle, setXUserHandle] = useState(() => localStorage.getItem("ai_x_user_handle") || "");
  const [xDraft, setXDraft] = useState("");
  const [xSearch, setXSearch] = useState("");
  const [isXComposerOpen, setIsXComposerOpen] = useState(false);
  const [followedHandles, setFollowedHandles] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_x_followed_handles") || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [isXPremium, setIsXPremium] = useState(() => localStorage.getItem("ai_x_premium") === "true");

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openrouter_api_key") || "");
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("openrouter_model") || "google/gemini-2.0-flash-001");
  const [customModel, setCustomModel] = useState(() => localStorage.getItem("openrouter_custom_model") || "");
  const [useCustomModel, setUseCustomModel] = useState(() => localStorage.getItem("openrouter_use_custom_model") === "true");
  const [themeId, setThemeId] = useState(() => localStorage.getItem("aether_theme") || "aether");
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(() => loadCustomTheme());
  const [globalPrompt, setGlobalPrompt] = useState(() => localStorage.getItem("aether_global_prompt") || DEFAULT_PROMPT);
  const [activePromptModifierTitle, setActivePromptModifierTitle] = useState(() => localStorage.getItem("aether_prompt_modifier") || "");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(() => localStorage.getItem("aether_web_search_enabled") === "true");
  const [assistantMemory, setAssistantMemory] = useState(() => localStorage.getItem("aether_memory") || "");
  const [chatSearch, setChatSearch] = useState("");
  const [xTopic, setXTopic] = useState(() => localStorage.getItem("ai_x_topic") || "");
  const [likedXPostIds, setLikedXPostIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_x_liked_posts") || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [bookmarkedXPostIds, setBookmarkedXPostIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_x_bookmarked_posts") || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [repostedXPostIds, setRepostedXPostIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("ai_x_reposted_posts") || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [xReplyDrafts, setXReplyDrafts] = useState<Record<string, string>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptMenuRef = useRef<HTMLDivElement>(null);
  const skipNextChatSaveRef = useRef(false);
  const activeChatIdRef = useRef(activeChatId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const routeSyncRef = useRef(false);

  activeChatIdRef.current = activeChatId;

  const activeProject = useMemo(() => {
    return projects.find((project) => project.id === activeProjectId);
  }, [activeProjectId, projects]);
  const isEmptyChat = activeView === "chat" && !messages.length;
  const projectChats = useMemo(
    () => savedChats
      .filter((chat) => activeProject ? chat.projectId === activeProject.id : !chat.projectId)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [activeProject, savedChats]
  );
  const filteredProjectChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return projectChats;

    return projectChats.filter((chat) => {
      const projectName = projects.find((project) => project.id === chat.projectId)?.name || "No Project";
      return (
        chat.title.toLowerCase().includes(query) ||
        projectName.toLowerCase().includes(query) ||
        chat.messages.some((message) => message.content.toLowerCase().includes(query))
      );
    });
  }, [chatSearch, projectChats, projects]);
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt),
    [projects]
  );
  const selectedXPost = useMemo(() => {
    return xPosts.find((post) => post.handle === selectedXHandle) || xPosts[0];
  }, [selectedXHandle, xPosts]);
  const selectedAuthorPosts = useMemo(() => {
    if (!selectedXPost) return [];
    return xPosts.filter((post) => post.handle === selectedXPost.handle);
  }, [selectedXPost, xPosts]);
  const filteredXPosts = useMemo(() => {
    const query = xSearch.trim().toLowerCase();
    if (!query) return xPosts;

    return xPosts.filter((post) => (
      post.author.toLowerCase().includes(query) ||
      post.handle.toLowerCase().includes(query) ||
      post.text.toLowerCase().includes(query)
    ));
  }, [xPosts, xSearch]);
  const isXProfileReady = Boolean(xUserName.trim() && normalizeHandle(xUserHandle));
  const effectiveModel = useCustomModel && customModel.trim() ? customModel.trim() : selectedModel;
  const activeName = activeProject?.assistantName?.trim() || "Aether";
  const activePromptModifier = useMemo(
    () => PROMPT_TEMPLATES.find((template) => template.title === activePromptModifierTitle),
    [activePromptModifierTitle]
  );
  const lastMessage = messages[messages.length - 1];
  const isWaitingForFirstToken = isLoading && loadingChatId === activeChatId && (
    lastMessage?.role !== "assistant" || !lastMessage.content.trim()
  );
  const themeOptions = useMemo(() => [...THEME_OPTIONS, customTheme], [customTheme]);
  const activeTheme = themeId === "custom" ? customTheme : THEME_OPTIONS.find((theme) => theme.id === themeId) || THEME_OPTIONS[0];
  const isLightTheme = relativeLuminance(activeTheme.appBg) > 0.65;
  const themeStyle = {
    "--app-bg": activeTheme.appBg,
    "--sidebar-bg": activeTheme.sidebarBg,
    "--panel-bg": activeTheme.panelBg,
    "--text-color": activeTheme.textColor,
    "--muted-text": activeTheme.mutedText,
    "--accent": activeTheme.accent,
    "--accent-to": activeTheme.accentTo,
    "--assistant-bubble": activeTheme.assistantBubble,
    "--assistant-text": activeTheme.assistantText,
    "--action-button-bg": activeTheme.actionButtonBg,
    "--action-button-text": activeTheme.actionButtonText,
    "--user-bubble": activeTheme.userBubble,
    "--user-text": activeTheme.userText,
    "--ui-radius": `${activeTheme.radius}px`,
    "--font-scale": String(activeTheme.fontScale),
    "--input-width": `${activeTheme.inputWidth}px`
  } as CSSProperties;

  const themedIcon = (key: keyof typeof DEFAULT_BUTTON_EMOJIS, fallback: ReactNode, className = "h-5 w-5") => (
    activeTheme.buttonIconStyle === "emoji"
      ? <span className={`${className} inline-flex items-center justify-center text-base leading-none`}>{activeTheme.buttonEmojis?.[key] || DEFAULT_BUTTON_EMOJIS[key]}</span>
      : fallback
  );

  const chatPath = (chat: Pick<SavedChat, "id" | "projectId">) => (
    chat.projectId ? `/project/${chat.projectId}/chat/${chat.id}` : `/chat/${chat.id}`
  );

  const goToPath = (path: string, replace = false) => {
    if (location.pathname !== path) {
      navigate(path, { replace });
    }
  };

  const parseXPosts = (content: string): XPost[] => {
    const jsonText = content.match(/```json\s*([\s\S]*?)```/)?.[1] || content.match(/\[[\s\S]*\]/)?.[0] || content;
    const parsed = JSON.parse(jsonText) as Array<Omit<XPost, "id"> & { id?: string }>;

    return parsed.slice(0, 8).map((post) => ({
      id: post.id || crypto.randomUUID(),
      author: String(post.author || "AI X User"),
      handle: String(post.handle || "@ai_user"),
      bio: String(post.bio || "AI-generated X profile."),
      followers: Number(post.followers || 0),
      following: Number(post.following || 0),
      text: String(post.text || ""),
      likes: Number(post.likes || 0),
      commentsCount: Number(post.commentsCount || post.comments?.length || 0),
      reposts: Number(post.reposts || 0),
      views: Number(post.views || 0),
      comments: Array.isArray(post.comments)
        ? post.comments.slice(0, 4).map((comment) => ({
          author: String(comment.author || "User"),
          text: String(comment.text || ""),
          likes: Number(comment.likes || 0)
        }))
        : []
    }));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setCustomTheme((current) => sanitizeTheme(current));
  }, []);

  useEffect(() => {
    routeSyncRef.current = true;
    const normalizedPath = location.pathname.toLowerCase();
    const routeChatId = params.chatId;
    const routeProjectId = params.projectId;

    if (normalizedPath === "/x") {
      setActiveView("x");
      setXScreen("feed");
      routeSyncRef.current = false;
      return;
    }

    setActiveView("chat");

    if (routeChatId) {
      const chat = savedChats.find((item) => item.id === routeChatId);
      if (chat) {
        skipNextChatSaveRef.current = true;
        activeChatIdRef.current = chat.id;
        setActiveProjectId(chat.projectId || "");
        setActiveChatId(chat.id);
        setMessages(chat.messages);
        setInput("");
      }
      routeSyncRef.current = false;
      return;
    }

    if (routeProjectId) {
      const project = projects.find((item) => item.id === routeProjectId);
      if (project) {
        const nextChatId = crypto.randomUUID();
        setActiveProjectId(project.id);
        activeChatIdRef.current = nextChatId;
        setActiveChatId(nextChatId);
        setMessages([]);
        setInput("");
      }
      routeSyncRef.current = false;
      return;
    }

    if (normalizedPath === "/" || normalizedPath === "/chat") {
      if (activeView === "chat" && !activeProjectId && !messages.length) {
        routeSyncRef.current = false;
        return;
      }
      const nextChatId = crypto.randomUUID();
      setActiveProjectId("");
      activeChatIdRef.current = nextChatId;
      setActiveChatId(nextChatId);
      setMessages([]);
      setInput("");
    }

    routeSyncRef.current = false;
  }, [location.pathname, params.chatId, params.projectId, projects, savedChats, activeView, activeProjectId, messages.length]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "44px";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 220)}px`;
  }, [input]);

  useEffect(() => {
    if (!isPromptMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!promptMenuRef.current?.contains(event.target as Node)) {
        setIsPromptMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isPromptMenuOpen]);

  useEffect(() => {
    localStorage.setItem("aether_saved_chats", JSON.stringify(savedChats));
  }, [savedChats]);

  useEffect(() => {
    const projectIds = new Set(projects.map((project) => project.id));
    setSavedChats((current) => current.map((chat) => (
      chat.projectId && !projectIds.has(chat.projectId)
        ? { ...chat, projectId: null }
        : chat
    )));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("aether_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("aether_active_chat_id", activeChatId);
    localStorage.setItem("aether_active_project_id", activeProject?.id || "");
  }, [activeChatId, activeProject?.id]);

  useEffect(() => {
    if (!messages.length) return;
    if (skipNextChatSaveRef.current) {
      skipNextChatSaveRef.current = false;
      return;
    }

    setSavedChats((current) => {
      const nextChat = {
        id: activeChatId,
        projectId: activeProject?.id || null,
        title: getChatTitle(messages),
        messages,
        updatedAt: Date.now()
      };
      const existing = current.find((chat) => chat.id === activeChatId);
      if (!existing) return [nextChat, ...current];

      return current.map((chat) => chat.id === activeChatId ? nextChat : chat);
    });
    if (activeProject?.id) {
      setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, updatedAt: Date.now() } : project));
    }
  }, [activeChatId, activeProject?.id, messages]);

  useEffect(() => {
    localStorage.setItem("openrouter_api_key", apiKey);
    localStorage.setItem("openrouter_model", selectedModel);
    localStorage.setItem("openrouter_custom_model", customModel);
    localStorage.setItem("openrouter_use_custom_model", String(useCustomModel));
    localStorage.setItem("aether_theme", themeId);
    localStorage.setItem("aether_custom_theme", JSON.stringify(customTheme));
    localStorage.setItem("aether_global_prompt", globalPrompt);
    localStorage.setItem("aether_prompt_modifier", activePromptModifierTitle);
    localStorage.setItem("aether_web_search_enabled", String(isWebSearchEnabled));
    localStorage.setItem("aether_memory", assistantMemory);
  }, [apiKey, selectedModel, customModel, useCustomModel, themeId, customTheme, globalPrompt, activePromptModifierTitle, isWebSearchEnabled, assistantMemory]);

  useEffect(() => {
    localStorage.setItem("ai_x_user_name", xUserName);
    localStorage.setItem("ai_x_user_handle", normalizeHandle(xUserHandle));
    localStorage.setItem("ai_x_followed_handles", JSON.stringify(followedHandles));
    localStorage.setItem("ai_x_premium", String(isXPremium));
    localStorage.setItem("ai_x_topic", xTopic);
    localStorage.setItem("ai_x_liked_posts", JSON.stringify(likedXPostIds));
    localStorage.setItem("ai_x_bookmarked_posts", JSON.stringify(bookmarkedXPostIds));
    localStorage.setItem("ai_x_reposted_posts", JSON.stringify(repostedXPostIds));
  }, [xUserName, xUserHandle, followedHandles, isXPremium, xTopic, likedXPostIds, bookmarkedXPostIds, repostedXPostIds]);

  const updateActiveProject = (patch: Partial<Project>) => {
    if (!activeProject) return;

    setProjects((current) => current.map((project) => (
      project.id === activeProject.id ? { ...project, ...patch, updatedAt: Date.now() } : project
    )));
  };

  const getSystemPrompt = () => {
    const memoryBlock = assistantMemory.trim()
      ? `Memory about the user and preferences:\n${assistantMemory.trim()}`
      : "";
    const promptModifierBlock = activePromptModifier
      ? `Active mode / prompt modifier (${activePromptModifier.title}):\n${activePromptModifier.prompt}`
      : "";

    if (!activeProject) {
      return [globalPrompt.trim() || DEFAULT_PROMPT, memoryBlock, promptModifierBlock].filter(Boolean).join("\n\n");
    }

    return [
      globalPrompt.trim() || DEFAULT_PROMPT,
      memoryBlock,
      promptModifierBlock,
      `Project: ${activeProject.name.trim() || "Custom Project"}`,
      `Assistant name in this project: ${activeProject.assistantName?.trim() || "Aether"}`,
      activeProject.prompt.trim() ? `Project instructions:\n${activeProject.prompt.trim()}` : PROJECT_FALLBACK_PROMPT,
      activeProject.images.length ? "The user has attached local reference images to this project. Use them only when they are relevant to the answer." : "",
      activeProject.files?.filter((file) => file.type === "text").length
        ? `Project text files:\n${activeProject.files
          ?.filter((file) => file.type === "text")
          .map((file) => `--- ${file.name} ---\n${file.content.slice(0, 12000)}`)
          .join("\n\n")}`
        : ""
    ].filter(Boolean).join("\n\n");
  };

  const addProjectFiles = async (files: FileList | File[]) => {
    if (!activeProject) return;

    const supportedFiles = Array.from(files).filter(isSupportedProjectFile);
    if (!supportedFiles.length) return;

    const loadedFiles = await Promise.all(supportedFiles.map(readProjectFile));
    const loadedImages = loadedFiles
      .filter((file) => file.type === "image")
      .map((file) => ({ id: file.id, name: file.name, dataUrl: file.content }));

    updateActiveProject({
      images: [...activeProject.images, ...loadedImages],
      files: [...(activeProject.files || []), ...loadedFiles]
    });
  };

  const handleProjectDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImages(false);
    await addProjectFiles(event.dataTransfer.files);
  };

  const handleProjectFilePick = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await addProjectFiles(event.target.files);
      event.target.value = "";
    }
  };

  const resetChat = () => {
    const nextChatId = crypto.randomUUID();

    setActiveView("chat");
    setActiveProjectId("");
    activeChatIdRef.current = nextChatId;
    setActiveChatId(nextChatId);
    setMessages([]);
    setInput("");
    goToPath("/");
  };

  const createNewProject = () => {
    const nextChatId = crypto.randomUUID();

    setActiveView("chat");
    const project = createProject(`Project ${projects.length + 1}`);
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    activeChatIdRef.current = nextChatId;
    setActiveChatId(nextChatId);
    setMessages([]);
    setInput("");
    setIsProjectOpen(true);
    goToPath(`/project/${project.id}`);
  };

  const selectProject = (projectId: string) => {
    const nextChatId = crypto.randomUUID();

    setActiveView("chat");
    setActiveProjectId(projectId);
    activeChatIdRef.current = nextChatId;
    setActiveChatId(nextChatId);
    setMessages([]);
    setInput("");
    goToPath(`/project/${projectId}`);
  };

  const selectNoProject = () => {
    const nextChatId = crypto.randomUUID();

    setActiveView("chat");
    setActiveProjectId("");
    activeChatIdRef.current = nextChatId;
    setActiveChatId(nextChatId);
    setMessages([]);
    setInput("");
    goToPath("/");
  };

  const deleteProject = (projectId: string) => {
    const nextProjects = projects.filter((project) => project.id !== projectId);

    setProjects(nextProjects);
    setSavedChats((current) => current.filter((chat) => chat.projectId !== projectId));

    if (activeProject?.id === projectId) {
      const nextChatId = crypto.randomUUID();

      setActiveProjectId("");
      activeChatIdRef.current = nextChatId;
      setActiveChatId(nextChatId);
      setMessages([]);
      setInput("");
    }
  };

  const openSavedChat = (chat: SavedChat) => {
    setActiveView("chat");
    skipNextChatSaveRef.current = true;
    activeChatIdRef.current = chat.id;
    setActiveProjectId(chat.projectId || "");
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setInput("");
    goToPath(chatPath(chat));
  };

  const deleteSavedChat = (chatId: string) => {
    setSavedChats((current) => current.filter((chat) => chat.id !== chatId));
    if (activeChatId === chatId) resetChat();
  };

  const renameSavedChat = (chat: SavedChat) => {
    const nextTitle = window.prompt("Название чата", chat.title)?.trim();
    if (!nextTitle) return;

    setSavedChats((current) => current.map((item) => item.id === chat.id ? { ...item, title: nextTitle } : item));
  };

  const togglePinnedChat = (chatId: string) => {
    setSavedChats((current) => current.map((chat) => chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat));
  };

  const removeProjectImage = (imageId: string) => {
    if (!activeProject) return;

    updateActiveProject({
      images: activeProject.images.filter((image) => image.id !== imageId),
      files: (activeProject.files || []).filter((file) => file.id !== imageId)
    });
  };

  const removeProjectFile = (fileId: string) => {
    if (!activeProject) return;

    updateActiveProject({
      images: activeProject.images.filter((image) => image.id !== fileId),
      files: (activeProject.files || []).filter((file) => file.id !== fileId)
    });
  };

  const exportWorkspace = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
      savedChats,
      settings: {
        apiKey,
        selectedModel,
        customModel,
        useCustomModel,
        themeId,
        customTheme,
        globalPrompt,
        activePromptModifierTitle,
        isWebSearchEnabled,
        assistantMemory
      },
      aiX: {
        xUserName,
        xUserHandle: normalizeHandle(xUserHandle),
        xTopic,
        followedHandles,
        isXPremium,
        likedXPostIds,
        bookmarkedXPostIds,
        repostedXPostIds
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `aether-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importWorkspace = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());

      setProjects(Array.isArray(payload.projects) ? payload.projects : []);
      setSavedChats(Array.isArray(payload.savedChats) ? payload.savedChats : []);

      if (payload.settings) {
        setSelectedModel(payload.settings.selectedModel || selectedModel);
        setApiKey(payload.settings.apiKey || "");
        setCustomModel(payload.settings.customModel || "");
        setUseCustomModel(Boolean(payload.settings.useCustomModel));
        setThemeId(payload.settings.themeId || "aether");
        setCustomTheme(sanitizeTheme(payload.settings.customTheme || {}));
        setGlobalPrompt(payload.settings.globalPrompt || DEFAULT_PROMPT);
        setActivePromptModifierTitle(payload.settings.activePromptModifierTitle || "");
        setIsWebSearchEnabled(Boolean(payload.settings.isWebSearchEnabled));
        setAssistantMemory(payload.settings.assistantMemory || "");
      }

      if (payload.aiX) {
        setXUserName(payload.aiX.xUserName || "");
        setXUserHandle(payload.aiX.xUserHandle || "");
        setXTopic(payload.aiX.xTopic || "");
        setFollowedHandles(Array.isArray(payload.aiX.followedHandles) ? payload.aiX.followedHandles : []);
        setIsXPremium(Boolean(payload.aiX.isXPremium));
        setLikedXPostIds(Array.isArray(payload.aiX.likedXPostIds) ? payload.aiX.likedXPostIds : []);
        setBookmarkedXPostIds(Array.isArray(payload.aiX.bookmarkedXPostIds) ? payload.aiX.bookmarkedXPostIds : []);
        setRepostedXPostIds(Array.isArray(payload.aiX.repostedXPostIds) ? payload.aiX.repostedXPostIds : []);
      }

      resetChat();
    } catch (error) {
      console.error("Import workspace failed:", error);
      window.alert("Не удалось импортировать workspace JSON.");
    } finally {
      event.target.value = "";
    }
  };

  const generateXFeed = async () => {
    setActiveView("x");
    goToPath("/x");

    if (!isXProfileReady) {
      return;
    }

    if (!apiKey && !isWebSearchEnabled) {
      setIsSettingsOpen(true);
      return;
    }

    setXScreen("feed");
    setIsXLoading(true);
    setXError("");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Aether Local AI X",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: [
            {
              role: "system",
              content: "Generate fictional social feed posts for an AI-powered X/Twitter-like screen. Return only valid JSON, no markdown."
            },
            {
              role: "user",
              content: `Create a JSON object with a posts array containing 8 diverse fictional X posts in Russian. Topic: ${xTopic.trim() || "mixed real-time social feed"}. Make it feel like the real X/Twitter home feed. Each post must have author, handle, bio, followers, following, text, likes, commentsCount, reposts, views, and comments. comments must be 2-4 objects with author, text, likes. Invent realistic random engagement numbers.`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error?.metadata?.raw || "OpenRouter request failed");
      }

      const content = data.choices?.[0]?.message?.content || "[]";
      const parsed = JSON.parse(content);
      const posts = Array.isArray(parsed) ? parsed : parsed.posts;

      if (!Array.isArray(posts)) {
        setXPosts(parseXPosts(content));
      } else {
        setXPosts(parseXPosts(JSON.stringify(posts)));
      }
    } catch (error: any) {
      console.error("Error generating AI X feed:", error);
      setXError(error.message || "Не удалось сгенерировать ленту AI X.");
      setXPosts(fallbackXPosts);
    } finally {
      setIsXLoading(false);
    }
  };

  const exitX = () => {
    setActiveView("chat");
    setXScreen("feed");
    goToPath("/");
  };

  const openXProfile = (post: XPost) => {
    setSelectedXHandle(post.handle);
    setXScreen("profile");
  };

  const openXMessages = (post: XPost) => {
    setSelectedXHandle(post.handle);
    setXScreen("messages");
    setXThreads((current) => {
      if (current[post.handle]?.length) return current;

      return {
        ...current,
        [post.handle]: [{
          id: crypto.randomUUID(),
          role: "author",
          text: `Привет, я ${post.author}. Пиши, если хочешь обсудить мой пост.`
        }]
      };
    });
  };

  const publishXPost = () => {
    if (!xDraft.trim() || !isXProfileReady) return;

    const userPost: XPost = {
      id: crypto.randomUUID(),
      author: xUserName.trim(),
      handle: normalizeHandle(xUserHandle),
      bio: "Local AI X user.",
      followers: followedHandles.length,
      following: followedHandles.length,
      text: xDraft.trim(),
      likes: Math.floor(Math.random() * 900) + 12,
      commentsCount: Math.floor(Math.random() * 80),
      reposts: Math.floor(Math.random() * 120),
      views: Math.floor(Math.random() * 50_000) + 500,
      comments: []
    };

    setXPosts((current) => [userPost, ...current]);
    setXDraft("");
    setIsXComposerOpen(false);
    setXScreen("feed");
  };

  const toggleFollow = (handle: string) => {
    setFollowedHandles((current) => (
      current.includes(handle)
        ? current.filter((item) => item !== handle)
        : [...current, handle]
    ));
  };

  const toggleXPostReaction = (postId: string, type: "like" | "repost" | "bookmark") => {
    if (type === "like") {
      setLikedXPostIds((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
      setXPosts((current) => current.map((post) => post.id === postId ? { ...post, likes: Math.max(0, post.likes + (likedXPostIds.includes(postId) ? -1 : 1)) } : post));
    }

    if (type === "repost") {
      setRepostedXPostIds((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
      setXPosts((current) => current.map((post) => post.id === postId ? { ...post, reposts: Math.max(0, post.reposts + (repostedXPostIds.includes(postId) ? -1 : 1)) } : post));
    }

    if (type === "bookmark") {
      setBookmarkedXPostIds((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
    }
  };

  const replyToXPost = (postId: string) => {
    const reply = xReplyDrafts[postId]?.trim();
    if (!reply) return;

    setXPosts((current) => current.map((post) => post.id === postId ? {
      ...post,
      commentsCount: post.commentsCount + 1,
      comments: [
        { author: xUserName.trim() || "Local User", text: reply, likes: 0 },
        ...post.comments
      ]
    } : post));
    setXReplyDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const sendXMessage = async () => {
    if (!selectedXPost || !xMessageInput.trim() || isXMessageLoading) return;

    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userText = xMessageInput.trim();
    const authorPostsForPrompt = selectedAuthorPosts
      .slice(0, 5)
      .map((post, index) => `Post ${index + 1}: ${post.text}\nEngagement: ${formatXMetric(post.likes)} likes, ${formatXMetric(post.reposts)} reposts, ${formatXMetric(post.views)} views.\nComments: ${post.comments.map((comment) => `${comment.author}: ${comment.text}`).join(" | ") || "none"}`)
      .join("\n\n");
    const previousThread = (xThreads[selectedXPost.handle] || [])
      .slice(-8)
      .map((message) => `${message.role === "user" ? "User" : selectedXPost.author}: ${message.text}`)
      .join("\n");

    setXMessageInput("");
    setIsXMessageLoading(true);
    setXError("");
    setXThreads((current) => ({
      ...current,
      [selectedXPost.handle]: [
        ...(current[selectedXPost.handle] || []),
        { id: crypto.randomUUID(), role: "user", text: userText }
      ]
    }));

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Aether Local AI X DM",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: [
            {
              role: "system",
              content: [
                `You are ${selectedXPost.author} (${selectedXPost.handle}) from a fictional AI X social network.`,
                `Bio: ${selectedXPost.bio}`,
                `Followers: ${formatXMetric(selectedXPost.followers)}. Following: ${formatXMetric(selectedXPost.following)}.`,
                "Stay in character. Answer like this exact person would answer in a private X DM.",
                "Use the user's language. Keep replies natural, short to medium, and conversational.",
                "Do not mention that you are an AI unless the character would naturally say it.",
                authorPostsForPrompt ? `Recent posts and context:\n${authorPostsForPrompt}` : "",
                previousThread ? `Previous DM thread:\n${previousThread}` : ""
              ].filter(Boolean).join("\n\n")
            },
            {
              role: "user",
              content: userText
            }
          ]
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error?.metadata?.raw || "OpenRouter request failed");
      }

      const reply = data.choices?.[0]?.message?.content || "Не смог ответить сейчас.";
      setXThreads((current) => ({
        ...current,
        [selectedXPost.handle]: [
          ...(current[selectedXPost.handle] || []),
          { id: crypto.randomUUID(), role: "author", text: reply }
        ]
      }));
    } catch (error: any) {
      setXThreads((current) => ({
        ...current,
        [selectedXPost.handle]: [
          ...(current[selectedXPost.handle] || []),
          { id: crypto.randomUUID(), role: "author", text: "Сейчас не смог ответить через OpenRouter. Попробуй еще раз или смени модель в настройках." }
        ]
      }));
      setXError(error.message || "Не удалось отправить сообщение.");
    } finally {
      setIsXMessageLoading(false);
    }
  };

  const toOpenRouterMessage = (message: Message, includeImages = false) => {
    if (message.role === "assistant" || !includeImages || !message.images?.length) {
      return { role: message.role, content: message.content };
    }

    return {
      role: message.role,
      content: [
        { type: "text", text: message.content },
        ...message.images.map((image) => ({
          type: "image_url",
          image_url: { url: image.dataUrl }
        }))
      ]
    };
  };

  const buildApiMessages = (history: Message[]) => {
    const lastUserIndex = history.map((message) => message.role).lastIndexOf("user");

    return [
      { role: "system", content: getSystemPrompt() },
      ...history.map((message, index) => toOpenRouterMessage(message, index === lastUserIndex))
    ];
  };

  const buildBackendHistory = (apiMessages: ReturnType<typeof buildApiMessages>) => (
    apiMessages
      .filter((message) => typeof message.content === "string")
      .map((message) => ({
        role: message.role as "system" | "user" | "assistant",
        content: message.content as string
      }))
  );

  const saveChatById = (chatId: string, projectId: string | null, nextMessages: Message[]) => {
    setSavedChats((current) => {
      const nextChat = {
        id: chatId,
        projectId,
        title: getChatTitle(nextMessages),
        messages: nextMessages,
        updatedAt: Date.now()
      };
      const existing = current.find((chat) => chat.id === chatId);

      if (!existing) return [nextChat, ...current];

      return current.map((chat) => chat.id === chatId ? nextChat : chat);
    });

    if (projectId) {
      setProjects((current) => current.map((project) => project.id === projectId ? { ...project, updatedAt: Date.now() } : project));
    }
  };

  const streamAssistantReply = async (
    apiMessages: ReturnType<typeof buildApiMessages>,
    targetChatId: string,
    targetProjectId: string | null,
    baseMessages: Message[],
    useWebSearch = false
  ) => {
    const controller = new AbortController();

    abortControllerRef.current = controller;
    setIsLoading(true);
    setLoadingChatId(targetChatId);
    const lastUserMessage = [...baseMessages].reverse().find((message) => message.role === "user");
    setGenerationStatus(useWebSearch
      ? `Ищу в сети: ${getShortStatusQuery(lastUserMessage?.content || "")}`
      : "Думаю..."
    );
    let streamedMessages: Message[] = [...baseMessages];

    const syncTargetChat = (nextMessages: Message[]) => {
      streamedMessages = nextMessages;
      saveChatById(targetChatId, targetProjectId, nextMessages);

      if (activeChatIdRef.current === targetChatId) {
        setMessages(nextMessages);
      }
    };

    try {
      if (useWebSearch) {
        syncTargetChat([...streamedMessages, { role: "assistant", content: "" }]);

        const response = await fetch(LOCAL_SEARCH_CHAT_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: lastUserMessage?.content || "",
            history: buildBackendHistory(apiMessages).slice(0, -1),
            force_search: true,
            search_limit: 5
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || errorData.error?.message || errorText || "Local web search failed");
          } catch {
            throw new Error(errorText || "Local web search failed");
          }
        }

        const data = await response.json();
        const sources = Array.isArray(data.sources) ? data.sources as WebSource[] : [];
        const answer = stripInlineSources(data.answer || "");
        const nextMessages = [...streamedMessages];
        const lastMessage = nextMessages[nextMessages.length - 1];

        if (lastMessage?.role === "assistant") {
          nextMessages[nextMessages.length - 1] = { ...lastMessage, content: answer, sources };
          syncTargetChat(nextMessages);
        }
        setGenerationStatus("");
        return;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Aether Local",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: effectiveModel,
          messages: apiMessages,
          stream: true,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error?.message || errorData.error?.metadata?.raw || errorText || "OpenRouter request failed");
        } catch {
          throw new Error(errorText || "OpenRouter request failed");
        }
      }

      if (!response.body) {
        throw new Error("Streaming is not available in this browser.");
      }

      syncTargetChat([...streamedMessages, { role: "assistant", content: "" }]);
      setGenerationStatus("Пишу ответ...");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          const payload = trimmedLine.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          const data = JSON.parse(payload);
          if (data.error) {
            throw new Error(data.error?.message || data.error?.metadata?.raw || "Provider returned error");
          }

          const delta = data.choices?.[0]?.delta?.content;
          const nextText = Array.isArray(delta)
            ? delta.map((part) => part?.text || "").join("")
            : delta || "";

          if (nextText) {
            setGenerationStatus("");
            const nextMessages = [...streamedMessages];
            const lastMessage = nextMessages[nextMessages.length - 1];

            if (lastMessage?.role === "assistant") {
              nextMessages[nextMessages.length - 1] = {
                ...lastMessage,
                content: `${lastMessage.content}${nextText}`
              };
            }

            syncTargetChat(nextMessages);
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setGenerationStatus("");
        syncTargetChat(streamedMessages.filter((message) => message.content.trim() || message.role !== "assistant"));
        return;
      }

      console.error("Error calling OpenRouter:", error);
      const nextMessages = [...streamedMessages];
      const lastMessage = nextMessages[nextMessages.length - 1];
      const errorMessage = `Ошибка: ${error.message || "Не удалось подключиться к OpenRouter. Проверь ключ, модель и поддержку изображений у выбранной модели."}`;

      if (lastMessage?.role === "assistant" && !lastMessage.content) {
        nextMessages[nextMessages.length - 1] = { ...lastMessage, content: errorMessage };
        syncTargetChat(nextMessages);
        return;
      }

      syncTargetChat([...nextMessages, { role: "assistant", content: errorMessage }]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setGenerationStatus("");
      setIsLoading(false);
      setLoadingChatId((current) => current === targetChatId ? null : current);
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      images: activeProject?.images.length ? activeProject.images : undefined
    };
    const currentMessages = [...messages, userMessage];
    const targetChatId = activeChatId;
    const targetProjectId = activeProject?.id || null;

    setMessages(currentMessages);
    setInput("");
    goToPath(targetProjectId ? `/project/${targetProjectId}/chat/${targetChatId}` : `/chat/${targetChatId}`, true);
    await streamAssistantReply(buildApiMessages(currentMessages), targetChatId, targetProjectId, currentMessages, isWebSearchEnabled);
  };

  const copyMessageText = async (text: string) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const applyPromptTemplate = (title: string) => {
    setActivePromptModifierTitle(title);
    setIsPromptMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const updateCustomTheme = (patch: Partial<ThemeConfig>) => {
    setCustomTheme((current) => sanitizeTheme(patch, current));
    setThemeId("custom");
  };

  const applyDesignFromMessage = (content: string) => {
    const nextTheme = extractDesignTheme(content);
    if (!nextTheme) return;

    updateCustomTheme(nextTheme);
  };

  const editUserMessage = (index: number) => {
    const message = messages[index];
    if (!message || message.role !== "user" || isLoading) return;

    setEditingMessageIndex(index);
    setEditingDraft(message.content);
  };

  const cancelEditUserMessage = () => {
    setEditingMessageIndex(null);
    setEditingDraft("");
  };

  const submitEditedUserMessage = async () => {
    if (editingMessageIndex === null || isLoading) return;

    const message = messages[editingMessageIndex];
    const content = editingDraft.trim();
    if (!message || message.role !== "user" || !content) return;

    if (!apiKey && !isWebSearchEnabled) {
      setIsSettingsOpen(true);
      return;
    }

    const editedMessage: Message = {
      ...message,
      content
    };
    const nextMessages = [...messages.slice(0, editingMessageIndex), editedMessage];
    const targetChatId = activeChatId;
    const targetProjectId = activeProject?.id || null;

    setEditingMessageIndex(null);
    setEditingDraft("");
    setMessages(nextMessages);
    goToPath(targetProjectId ? `/project/${targetProjectId}/chat/${targetChatId}` : `/chat/${targetChatId}`, true);
    await streamAssistantReply(buildApiMessages(nextMessages), targetChatId, targetProjectId, nextMessages, isWebSearchEnabled);
  };

  const regenerateAssistantMessage = async (index: number) => {
    if (isLoading) return;

    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const message = messages[index];
    if (!message || message.role !== "assistant") return;

    const history = messages.slice(0, index);
    if (!history.some((item) => item.role === "user")) return;
    const targetChatId = activeChatId;
    const targetProjectId = activeProject?.id || null;

    setMessages(history);
    await streamAssistantReply(buildApiMessages(history), targetChatId, targetProjectId, history);
  };

  return (
    <div style={themeStyle} className={`aether-root ${isLightTheme ? "aether-light" : ""} flex h-screen bg-[var(--app-bg)] text-[var(--text-color)] font-sans overflow-hidden selection:bg-[var(--accent)]/30 selection:text-white text-[calc(1rem*var(--font-scale))]`}>
      {activeTheme.ambientEffect !== "none" && (
        <div className={`ambient-effect ambient-${activeTheme.ambientEffect}`} aria-hidden="true">
          {Array.from({ length: activeTheme.ambientEffect === "rain" ? 42 : 28 }).map((_, index) => (
            <span key={index} style={{
              left: `${(index * 37) % 100}%`,
              animationDelay: `${(index % 11) * 0.37}s`,
              animationDuration: `${activeTheme.ambientEffect === "rain" ? 0.9 + (index % 5) * 0.08 : 5 + (index % 7) * 0.45}s`
            }} />
          ))}
        </div>
      )}
      {activeView === "chat" && <aside className="hidden md:flex w-80 flex-col border-r border-white/5 bg-[var(--sidebar-bg)] p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)] flex items-center justify-center">
            {themedIcon("assistant", <Sparkles className="w-5 h-5 text-white" />)}
          </div>
          <span className="font-semibold text-lg tracking-tight">Aether Chat</span>
        </div>

        <button onClick={resetChat} className="flex items-center gap-3 w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 mb-3 group">
          {themedIcon("newChat", <Plus className="w-5 h-5 text-white/60 group-hover:text-white" />, "w-5 h-5")}
          <span className="text-sm font-medium">New Chat</span>
        </button>

        <button onClick={createNewProject} className="flex items-center gap-3 w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group">
          {themedIcon("newProject", <FolderPlus className="w-5 h-5 text-white/60 group-hover:text-white" />, "w-5 h-5")}
          <span className="text-sm font-medium">New Project</span>
        </button>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          {themedIcon("search", <Search className="h-4 w-4 text-white/35" />, "h-4 w-4")}
          <input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
        </div>

        <button onClick={generateXFeed} className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all border border-white/10 mt-3 group ${activeView === "x" ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}>
          {themedIcon("aiX", <Hash className="w-5 h-5 text-white/60 group-hover:text-white" />, "w-5 h-5")}
          <span className="text-sm font-medium">AI X</span>
        </button>

        <div className="flex-1 mt-8 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Projects</p>
            <button onClick={createNewProject} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="New project">
              {themedIcon("newProject", <FolderPlus className="w-4 h-4" />, "w-4 h-4")}
            </button>
          </div>

          <div className="max-h-[32%] overflow-y-auto custom-scrollbar space-y-2 pr-1">
            <div className={`group flex items-start gap-2 rounded-2xl border p-3 transition-colors ${!activeProject ? "border-white/20 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
              <button onClick={selectNoProject} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <p className="text-sm text-white/80 truncate">No Project</p>
                </div>
                <p className="text-[10px] text-white/30 mt-1">{savedChats.filter((chat) => !chat.projectId).length} chats</p>
              </button>
            </div>

            {sortedProjects.map((project) => (
              <div key={project.id} className={`group flex items-start gap-2 rounded-2xl border p-3 transition-colors ${project.id === activeProject?.id ? "border-white/20 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                <button onClick={() => selectProject(project.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <p className="text-sm text-white/80 truncate">{project.name || "Project"}</p>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">{savedChats.filter((chat) => chat.projectId === project.id).length} chats · {(project.files?.length || project.images.length)} files</p>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setActiveProjectId(project.id); setIsProjectOpen(true); }} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Edit project">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteProject(project.id)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Delete project">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 mb-2 px-3">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{activeProject ? "Chats in Project" : "Chats"}</p>
            <span className="text-[10px] text-white/30">{filteredProjectChats.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {!filteredProjectChats.length && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/40 leading-relaxed">
                {chatSearch.trim() ? "Ничего не найдено." : activeProject ? "Чаты появятся здесь после первого сообщения в выбранном проекте." : "Обычные чаты без проекта появятся здесь после первого сообщения."}
              </div>
            )}
            {filteredProjectChats.map((chat) => (
              <div key={chat.id} className={`group flex items-start gap-2 rounded-2xl border p-3 transition-colors ${chat.id === activeChatId ? "border-white/20 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                <button onClick={() => openSavedChat(chat)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0" />
                    <p className="text-sm text-white/80 truncate">{chat.pinned ? "● " : ""}{chat.title}</p>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">{new Date(chat.updatedAt).toLocaleString()}</p>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePinnedChat(chat.id)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors" title={chat.pinned ? "Unpin chat" : "Pin chat"}>
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button onClick={() => renameSavedChat(chat)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Rename chat">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteSavedChat(chat.id)} className="p-2 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Delete chat">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors group">
            <Settings className="w-4 h-4 text-white/40 group-hover:text-white" />
            <span className="text-sm text-white/60 group-hover:text-white">Settings</span>
          </button>
          <div className="flex items-center gap-3 w-full p-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-700 to-gray-900 border border-white/10" />
            <div className="flex-1">
              <p className="text-xs font-medium">Local User</p>
              <p className="text-[10px] text-white/30 tracking-tight">Developer Mode</p>
            </div>
            <MoreVertical className="w-4 h-4 text-white/20" />
          </div>
        </div>
      </aside>}

      <main className={`flex-1 relative bg-[var(--app-bg)] min-w-0 ${activeView === "chat" ? (isEmptyChat ? "flex flex-col overflow-hidden" : "overflow-y-auto custom-scrollbar") : "flex flex-col overflow-hidden"}`}>
        {activeView === "chat" && <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md bg-[var(--app-bg)]/50 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-white/80 truncate">{activeView === "x" ? "AI X" : activeProject?.name || "No Project"}</span>
            <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-[var(--accent)] font-bold uppercase tracking-wider max-w-[180px] truncate">
              {effectiveModel.split("/").pop()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!apiKey && <span className="text-[10px] text-amber-400 animate-pulse font-bold uppercase tracking-wider">No API Key</span>}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-white/40 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>}

        <div className={`${activeView === "x" ? "p-0" : isEmptyChat ? "flex flex-1 items-start justify-center p-4 pt-[31vh] md:p-8 md:pt-[31vh] max-w-4xl mx-auto" : "min-h-[calc(100vh-12rem)] p-4 md:p-8 max-w-4xl mx-auto pb-36"} space-y-8 w-full ${activeView === "x" ? "flex-1 overflow-y-auto custom-scrollbar" : ""}`}>
          {activeView === "x" ? (
            <div className="mx-auto w-full max-w-[1260px]">
              {!isXProfileReady && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] p-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold">X</p>
                        <h2 className="mt-4 text-2xl font-bold">Создай профиль AI X</h2>
                        <p className="mt-2 text-sm text-white/45">Выбери ник и handle. Это хранится только локально.</p>
                      </div>
                      <button onClick={exitX} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-6 space-y-3">
                      <input value={xUserName} onChange={(event) => setXUserName(event.target.value)} placeholder="Ник, например Marat Akhmetov" className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none focus:border-[#1d9bf0]" />
                      <input value={xUserHandle} onChange={(event) => setXUserHandle(event.target.value)} onBlur={() => setXUserHandle(normalizeHandle(xUserHandle))} placeholder="@username" className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none focus:border-[#1d9bf0]" />
                      <button disabled={!xUserName.trim() || !normalizeHandle(xUserHandle)} onClick={() => setXUserHandle(normalizeHandle(xUserHandle))} className="w-full rounded-full bg-white py-3 font-bold text-black disabled:opacity-40">Войти в AI X</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[275px_minmax(0,600px)_380px]">
                <nav className="hidden lg:flex flex-col border-r border-white/10 px-6 py-3">
                  <button onClick={exitX} className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-3xl text-white hover:bg-white/10" title="Back to Aether">
                    X
                  </button>
                  {[
                    { label: "Главная", icon: Hash, screen: "feed" as XScreen },
                    { label: "Обзор", icon: Search, screen: "feed" as XScreen },
                    { label: "Уведомления", icon: Bell, screen: "feed" as XScreen },
                    { label: "Читать", icon: User, screen: "profile" as XScreen },
                    { label: "Чат", icon: MessageCircle, screen: "messages" as XScreen },
                    { label: "Grok", icon: Sparkles, screen: "feed" as XScreen },
                    { label: "Закладки", icon: Bookmark, screen: "feed" as XScreen },
                    { label: "Творческая студия", icon: Rocket, screen: "feed" as XScreen },
                    { label: "Premium", icon: X, screen: "feed" as XScreen },
                    { label: "Профиль", icon: User, screen: "profile" as XScreen },
                    { label: "Ещё", icon: CircleEllipsis, screen: "feed" as XScreen },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isDisabled = (item.screen === "profile" || item.screen === "messages") && !selectedXPost;
                    const isActive = xScreen === item.screen && ["Главная", "Чат", "Профиль"].includes(item.label);

                    return (
                      <button key={item.label} disabled={isDisabled} onClick={() => setXScreen(item.screen)} className={`flex items-center gap-5 rounded-full px-3 py-3 text-xl disabled:opacity-40 ${isActive ? "font-bold text-white" : "text-white/80 hover:bg-white/10"}`}>
                        <Icon className="h-6 w-6" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => setIsXComposerOpen(true)} className="mt-4 rounded-full bg-white px-5 py-4 font-bold text-black hover:bg-white/90">
                    Опубликовать пост
                  </button>
                  <button onClick={exitX} className="mt-auto flex items-center gap-3 rounded-full p-3 text-left hover:bg-white/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff4b25] font-semibold">{(xUserName.trim()[0] || "U").toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{xUserName.trim() || "AI X User"}</p>
                      <p className="truncate text-sm text-white/40">{normalizeHandle(xUserHandle) || "@user"}</p>
                    </div>
                    <MoreVertical className="h-4 w-4 text-white/50" />
                  </button>
                </nav>

                <section className="min-w-0 border-r border-white/10">
                  <div className="sticky top-0 z-10 border-b border-white/10 bg-[var(--app-bg)]/80 backdrop-blur-md">
                    <div className="flex items-center justify-between px-4 py-3 lg:hidden">
                      <div className="flex items-center gap-3">
                        <button onClick={exitX} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white lg:hidden">
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                        <h1 className="text-xl font-bold">{xScreen === "profile" ? selectedXPost?.author || "Profile" : xScreen === "messages" ? "Messages" : "Home"}</h1>
                        <p className="text-xs text-white/35">{xScreen === "feed" ? "AI X generated by OpenRouter" : selectedXPost?.handle}</p>
                        </div>
                      </div>
                      <button onClick={generateXFeed} disabled={isXLoading} className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-50">
                        {isXLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                      </button>
                    </div>
                    {xScreen === "feed" && (
                      <div className="hidden grid-cols-2 text-center font-semibold text-white/70 lg:grid">
                        <button className="relative py-4 hover:bg-white/[0.03]">
                          Для вас
                          <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
                        </button>
                        <button className="py-4 hover:bg-white/[0.03]">Читаю</button>
                      </div>
                    )}
                  </div>

                  {xScreen === "feed" && (
                    <div className="hidden border-b border-white/10 p-4 lg:flex gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ff4b25] font-semibold">{(xUserName.trim()[0] || "U").toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <textarea value={xDraft} onChange={(event) => setXDraft(event.target.value)} rows={2} placeholder="Что происходит?" className="w-full resize-none bg-transparent py-2 text-xl text-white outline-none placeholder:text-white/40" />
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex gap-4 text-[#1d9bf0]">
                            <ImagePlus className="h-5 w-5" />
                            <Hash className="h-5 w-5" />
                            <Sparkles className="h-5 w-5" />
                            <CircleEllipsis className="h-5 w-5" />
                          </div>
                          <button onClick={publishXPost} disabled={!xDraft.trim()} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-50">Опубликовать пост</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {xScreen === "feed" && (
                    <div className="border-b border-white/10 p-4">
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                        <Hash className="h-4 w-4 text-[#1d9bf0]" />
                        <input value={xTopic} onChange={(event) => setXTopic(event.target.value)} placeholder="Тема ленты: стартапы, игры, IT, крипта..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
                        <button onClick={generateXFeed} disabled={isXLoading} className="rounded-full bg-[#1d9bf0] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                          {isXLoading ? "Генерация" : "Сгенерировать"}
                        </button>
                      </div>
                    </div>
                  )}

                  {isXLoading && (
                    <div className="border-b border-white/10 p-10 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--accent)]" />
                      <p className="mt-4 text-sm text-white/60">AI X загружает свежую ленту...</p>
                    </div>
                  )}

                  {!!xError && (
                    <div className="border-b border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                      {xError}
                    </div>
                  )}

                  {!isXLoading && !xPosts.length && (
                    <button onClick={generateXFeed} className="w-full border-b border-white/10 p-10 text-center hover:bg-white/5 transition-colors">
                      <Hash className="w-8 h-8 mx-auto text-[var(--accent)]" />
                      <p className="mt-4 font-medium">Войти в AI X</p>
                      <p className="mt-2 text-sm text-white/40">Лента появится после генерации через OpenRouter.</p>
                    </button>
                  )}

                  {xScreen === "feed" && filteredXPosts.map((post) => (
                    <article key={post.id} className="border-b border-white/10 p-4 hover:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <button onClick={() => openXProfile(post)} className="w-10 h-10 rounded-full bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <button onClick={() => openXProfile(post)} className="font-semibold text-white/90 hover:underline">{post.author}</button>
                        <p className="text-sm text-white/35">{post.handle}</p>
                      </div>
                      <p className="mt-3 text-sm md:text-base leading-relaxed text-white/85 whitespace-pre-wrap break-words">{post.text}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-white/45">
                        <button onClick={() => setXReplyDrafts((current) => ({ ...current, [post.id]: current[post.id] || "" }))} className="flex items-center gap-1 hover:text-[#1d9bf0]"><MessageCircle className="w-4 h-4" />{formatXMetric(post.commentsCount)}</button>
                        <button onClick={() => toggleXPostReaction(post.id, "repost")} className={`flex items-center gap-1 hover:text-emerald-400 ${repostedXPostIds.includes(post.id) ? "text-emerald-400" : ""}`}><Repeat2 className="w-4 h-4" />{formatXMetric(post.reposts)}</button>
                        <button onClick={() => toggleXPostReaction(post.id, "like")} className={`flex items-center gap-1 hover:text-rose-400 ${likedXPostIds.includes(post.id) ? "text-rose-400" : ""}`}><Heart className="w-4 h-4" />{formatXMetric(post.likes)}</button>
                        <span>{formatXMetric(post.views)}</span>
                        <button onClick={() => toggleXPostReaction(post.id, "bookmark")} className={bookmarkedXPostIds.includes(post.id) ? "text-[#1d9bf0]" : "hover:text-[#1d9bf0]"}>
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                      {xReplyDrafts[post.id] !== undefined && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
                          <input value={xReplyDrafts[post.id] || ""} onChange={(event) => setXReplyDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Ответить на пост" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/35" />
                          <button onClick={() => replyToXPost(post.id)} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black">Ответить</button>
                        </div>
                      )}
                      {!!post.comments.length && (
                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                          {post.comments.map((comment, index) => (
                            <div key={`${post.id}-${index}`} className="rounded-2xl bg-white/5 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-white/70">{comment.author}</p>
                                <p className="text-[10px] text-white/30">{formatXMetric(comment.likes)} likes</p>
                              </div>
                              <p className="mt-1 text-sm text-white/60">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => openXMessages(post)} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10">Message {post.author}</button>
                    </div>
                  </div>
                </article>
                  ))}

                  {xScreen === "profile" && selectedXPost && (
                    <div>
                      <div className="h-32 bg-linear-to-r from-[var(--accent)]/30 to-[var(--accent-to)]/30" />
                      <div className="px-4 pb-4">
                        <div className="-mt-10 flex items-end justify-between">
                          <div className="w-20 h-20 rounded-full border-4 border-[var(--app-bg)] bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)] flex items-center justify-center">
                            <User className="w-9 h-9 text-white" />
                          </div>
                          <button onClick={() => openXMessages(selectedXPost)} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Message</button>
                        </div>
                        <h2 className="mt-3 text-xl font-bold">{selectedXPost.author}</h2>
                        <p className="text-sm text-white/35">{selectedXPost.handle}</p>
                        <p className="mt-3 text-sm text-white/75">{selectedXPost.bio}</p>
                        <div className="mt-3 flex gap-4 text-sm text-white/40">
                          <span><b className="text-white/80">{selectedXPost.following}</b> Following</span>
                          <span><b className="text-white/80">{selectedXPost.followers}</b> Followers</span>
                        </div>
                      </div>
                      {selectedAuthorPosts.map((post) => (
                        <article key={post.id} className="border-t border-white/10 p-4">
                          <p className="text-sm text-white/85 whitespace-pre-wrap break-words">{post.text}</p>
                          <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-white/45">
                            <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{formatXMetric(post.commentsCount)}</span>
                            <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" />{formatXMetric(post.reposts)}</span>
                            <span className="flex items-center gap-1"><Heart className="w-4 h-4" />{formatXMetric(post.likes)}</span>
                            <span>{formatXMetric(post.views)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {xScreen === "messages" && selectedXPost && (
                    <div className="flex min-h-[calc(100vh-58px)] flex-col">
                      <div className="border-b border-white/10 p-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setXScreen("feed")} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                          <button onClick={() => setXScreen("profile")} className="flex min-w-0 items-center gap-3 text-left">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)]">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{selectedXPost.author}</p>
                              <p className="truncate text-sm text-white/35">{selectedXPost.handle}</p>
                            </div>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
                        <div className="mx-auto mb-6 max-w-sm text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)]">
                            <User className="h-8 w-8" />
                          </div>
                          <button onClick={() => setXScreen("profile")} className="mt-3 font-bold hover:underline">{selectedXPost.author}</button>
                          <p className="text-sm text-white/35">{selectedXPost.handle}</p>
                          <p className="mt-2 text-sm text-white/55">{selectedXPost.bio}</p>
                        </div>
                        {(xThreads[selectedXPost.handle] || []).map((message) => (
                          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[76%] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${message.role === "user" ? "bg-[#1d9bf0] text-white" : "bg-[#202327] text-white/90"}`}>
                              {message.text}
                            </div>
                          </div>
                        ))}
                        {isXMessageLoading && (
                          <div className="flex justify-start">
                            <div className="rounded-3xl bg-[#202327] px-4 py-3">
                              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/10 p-4">
                        <div className="flex items-end gap-2 rounded-3xl border border-white/10 bg-[#202327] p-2">
                          <textarea value={xMessageInput} onChange={(event) => setXMessageInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && (event.preventDefault(), sendXMessage())} rows={1} placeholder={`Написать ${selectedXPost.author}`} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 custom-scrollbar" />
                          <button onClick={sendXMessage} disabled={!xMessageInput.trim() || isXMessageLoading} className="rounded-full bg-[#1d9bf0] p-2 text-white disabled:opacity-40">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <aside className="hidden lg:block space-y-4 px-7 py-3">
                  <div className="sticky top-0 z-10 bg-[var(--app-bg)] pb-3">
                    <div className="flex items-center gap-3 rounded-full border border-white/15 px-4 py-3 text-white/40">
                      <Search className="h-4 w-4" />
                      <input value={xSearch} onChange={(event) => setXSearch(event.target.value)} placeholder="Поиск" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/15 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xl font-extrabold leading-tight">Подпишитесь на Premium</p>
                      <span className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-300">{isXPremium ? "Активно" : "Скидка 50%"}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">Уберите рекламу, смотрите аналитику, поднимите просмотры ваших ответов и разблокируйте более 20 функций.</p>
                    <button onClick={() => setIsXPremium((current) => !current)} className="mt-4 rounded-full bg-[#1d9bf0] px-5 py-2 text-sm font-bold text-white">{isXPremium ? "Premium включен" : "Подписаться"}</button>
                  </div>
                  <div className="rounded-2xl border border-white/15 p-5">
                    <p className="text-xl font-extrabold">Что происходит</p>
                    <div className="mt-4 space-y-4">
                      {["Father's Day", "GuMo", "Verteidigungsminister", "Gipfel"].map((trend) => (
                        <button key={trend} onClick={() => setXSearch(trend)} className="block w-full text-left">
                          <p className="text-xs text-white/40">Актуально · Германия</p>
                          <p className="font-bold">{trend}</p>
                        </button>
                      ))}
                    </div>
                    <button className="mt-4 text-sm text-[#1d9bf0]">Показать ещё</button>
                  </div>
                  <div className="rounded-2xl border border-white/15 p-5">
                    <p className="text-xl font-extrabold">Кого читать</p>
                    <div className="mt-4 space-y-3">
                      {filteredXPosts.slice(0, 4).map((post) => (
                        <div key={`${post.id}-follow`} className="flex w-full items-center gap-3">
                          <button onClick={() => openXProfile(post)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <div className="h-9 w-9 rounded-full bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{post.author}</p>
                            <p className="truncate text-xs text-white/35">{post.handle}</p>
                          </div>
                          </button>
                          <button onClick={() => toggleFollow(post.handle)} className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">{followedHandles.includes(post.handle) ? "Читаю" : "Читать"}</button>
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 text-sm text-[#1d9bf0]">Показать ещё</button>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <>
          {!messages.length && (
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">С чего начнем?</h1>
            </div>
          )}

          {messages.map((message, index) => {
            if (message.role === "assistant" && !message.content.trim() && !message.images?.length) return null;
            const isEditingThisMessage = editingMessageIndex === index && message.role === "user";

            return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={index} className={`flex gap-4 md:gap-6 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)] flex-shrink-0 flex items-center justify-center mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`min-w-0 space-y-3 ${message.role === "user" ? "order-1 max-w-[92%] md:max-w-[78%]" : "w-full max-w-[min(1180px,calc(100vw-7rem))]"}`}>
                {!!message.images?.length && (
                  <div className="grid grid-cols-2 gap-2">
                    {message.images.slice(0, 4).map((image) => (
                      <img key={image.id} src={image.dataUrl} alt={image.name} className="h-28 w-full rounded-2xl object-cover border border-white/10" />
                    ))}
                  </div>
                )}
                {isEditingThisMessage ? (
                  <div className="w-full max-w-[min(780px,calc(100vw-7rem))] rounded-[2rem] border border-white/10 bg-[#2f2f2f] p-5 shadow-2xl">
                    <textarea
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditUserMessage();
                        }
                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                          event.preventDefault();
                          submitEditedUserMessage();
                        }
                      }}
                      autoFocus
                      rows={Math.min(8, Math.max(3, editingDraft.split("\n").length))}
                      className="min-h-24 w-full resize-none bg-transparent text-base leading-relaxed text-white outline-none placeholder:text-white/30 custom-scrollbar"
                      placeholder="Измени сообщение..."
                    />
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${editingDraft.trim() ? "bg-[var(--accent)] text-white" : "bg-white/10 text-white/35"}`}>
                        {editingDraft.trim().length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={cancelEditUserMessage} className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/80">
                          Отменить
                        </button>
                        <button type="button" onClick={submitEditedUserMessage} disabled={!editingDraft.trim() || isLoading} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45">
                          Отправить
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`message-bubble p-4 md:p-5 rounded-[2rem] text-sm md:text-base leading-relaxed break-words [overflow-wrap:anywhere] ${message.role === "user" ? "max-h-[46vh] overflow-y-auto custom-scrollbar whitespace-pre-wrap pr-5" : "assistant-markdown"}`}
                    style={message.role === "user"
                      ? { background: "var(--user-bubble)", color: "var(--user-text)", borderTopRightRadius: 0 }
                      : { background: "var(--assistant-bubble)", color: "var(--assistant-text)", border: "1px solid rgba(127,127,127,0.16)", borderTopLeftRadius: 0 }}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ children }) => <span>{children}</span>,
                          table: ({ children }) => (
                            <div className="markdown-table-wrap">
                              <table>{children}</table>
                            </div>
                          )
                        }}
                      >
                        {normalizeAssistantMarkdown(message.sources?.length ? stripInlineSources(message.content) : message.content)}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                )}
                {message.role === "assistant" && !!message.sources?.length && (
                  <button
                    type="button"
                    onClick={() => setSourcePanel({ title: getChatTitle(messages.slice(0, index + 1)), sources: message.sources || [] })}
                    className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition-colors hover:border-[var(--accent)]/45 hover:bg-white/[0.075]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-[var(--accent)]" />
                        <span className="text-sm font-semibold text-white">Источники</span>
                      </div>
                      <span className="text-xs text-white/45">{message.sources.length}</span>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {message.sources.slice(0, 3).map((source, sourceIndex) => (
                        <div key={`${source.url}-${sourceIndex}`} className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                          <p className="truncate text-xs text-white/45">{getSourceHost(source.url)}</p>
                          <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white/80">{source.title}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                )}
                {!isEditingThisMessage && <div className={`flex flex-wrap gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <button
                    type="button"
                    onClick={() => copyMessageText(message.content)}
                    title={message.role === "assistant" ? "Копировать ответ" : "Копировать"}
                    aria-label={message.role === "assistant" ? "Копировать ответ" : "Копировать"}
                    className="message-action-button"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{message.role === "assistant" ? "Копировать ответ" : "Копировать"}</span>
                  </button>
                  {message.role === "user" ? (
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        editUserMessage(index);
                      }}
                      disabled={isLoading}
                      title="Редактировать"
                      aria-label="Редактировать"
                      className="message-action-button disabled:opacity-35"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Редактировать</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => regenerateAssistantMessage(index)}
                      disabled={isLoading}
                      title="Перегенерировать"
                      aria-label="Перегенерировать"
                      className="message-action-button disabled:opacity-35"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Перегенерировать</span>
                    </button>
                  )}
                  {message.role === "assistant" && extractDesignTheme(message.content) && (
                    <button
                      type="button"
                      onClick={() => applyDesignFromMessage(message.content)}
                      title="Применить дизайн"
                      aria-label="Применить дизайн"
                      className="message-action-button"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span>Применить дизайн</span>
                    </button>
                  )}
                </div>}
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex-shrink-0 flex items-center justify-center mt-1 order-2">
                  <User className="w-4 h-4 text-white/60" />
                </div>
              )}
            </motion.div>
            );
          })}

          {isWaitingForFirstToken && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 md:gap-6">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[var(--accent)] to-[var(--accent-to)] flex-shrink-0 flex items-center justify-center mt-1">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="rounded-3xl rounded-tl-none border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                {generationStatus || "Думаю..."}
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
            </>
          )}
        </div>

        {activeView === "chat" && <div className={`${isEmptyChat ? "absolute left-1/2 top-[41vh] -translate-x-1/2" : "sticky bottom-0"} z-20 bg-linear-to-t from-[var(--app-bg)] via-[var(--app-bg)] to-transparent p-4 md:p-8 mx-auto w-full max-w-[var(--input-width)]`}>
          {!!activeProject?.images.length && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {activeProject.images.map((image) => (
                <button key={image.id} onClick={() => setIsProjectOpen(true)} className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5" title={image.name}>
                  <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-[var(--accent)]/20 to-[var(--accent-to)]/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[var(--ui-radius)] p-1.5 flex items-end gap-2 shadow-2xl transition-all duration-300 group-focus-within:border-white/20">
              <div ref={promptMenuRef} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPromptMenuOpen((current) => !current)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                  title="Открыть модиферы"
                >
                  {themedIcon("modifier", <Plus className="h-5 w-5" />, "h-5 w-5")}
                </button>
                {isPromptMenuOpen && (
                  <div className="absolute bottom-full left-0 z-30 mb-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#2f2f2f] p-2 shadow-2xl">
                    <button onClick={() => { setIsPromptMenuOpen(false); activeProject ? setIsProjectOpen(true) : createNewProject(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/90 hover:bg-white/10">
                      {themedIcon("addFiles", <ImagePlus className="h-5 w-5 text-white/70" />, "h-5 w-5")}
                      Добавить файлы в проект
                    </button>
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsWebSearchEnabled((current) => !current);
                        setIsPromptMenuOpen(false);
                        window.setTimeout(() => setIsPromptMenuOpen(false), 0);
                        window.setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10 ${isWebSearchEnabled ? "bg-white/10 text-white" : "text-white/90"}`}
                    >
                      {themedIcon("webSearch", <Search className="h-5 w-5 text-[var(--accent)]" />, "h-5 w-5")}
                      Поиск в сети
                    </button>
                    <div className="my-1 h-px bg-white/10" />
                    {PROMPT_TEMPLATES.map((template) => (
                      <button key={template.title} onClick={() => applyPromptTemplate(template.title)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10 ${activePromptModifierTitle === template.title ? "bg-white/10 text-white" : "text-white/90"}`}>
                        {themedIcon("modifier", <WandSparkles className="h-5 w-5 text-white/70" />, "h-5 w-5")}
                        <span>{template.title}</span>
                      </button>
                    ))}
                    <div className="my-1 h-px bg-white/10" />
                    <button onClick={() => { setIsPromptMenuOpen(false); createNewProject(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/90 hover:bg-white/10">
                      {themedIcon("projects", <FolderPlus className="h-5 w-5 text-white/70" />, "h-5 w-5")}
                      Проекты
                    </button>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && (event.preventDefault(), handleSend())}
                  placeholder={apiKey ? `Message ${activeName}...` : "Please set API Key in settings..."}
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder:text-white/20 py-2.5 px-3 resize-none max-h-[220px] min-h-[40px] text-base overflow-y-auto custom-scrollbar break-words [overflow-wrap:anywhere]"
                  rows={1}
                />
                {activePromptModifier && (
                  <div className="flex items-center gap-2 px-3 pb-1 text-sm">
                    <button onClick={() => setActivePromptModifierTitle("")} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white/65 hover:bg-white/10 hover:text-white" title="Убрать модифер" aria-label="Убрать модифер">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {themedIcon("modifier", <WandSparkles className="h-4 w-4 text-[var(--accent)]" />, "h-4 w-4")}
                    <span className="text-[var(--accent)]">{activePromptModifier.title}</span>
                  </div>
                )}
                {isWebSearchEnabled && (
                  <div className="flex items-center gap-2 px-3 pb-1 text-sm">
                    <button onClick={() => setIsWebSearchEnabled(false)} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white/65 hover:bg-white/10 hover:text-white" title="Убрать поиск в сети" aria-label="Убрать поиск в сети">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {themedIcon("webSearch", <Search className="h-4 w-4 text-[var(--accent)]" />, "h-4 w-4")}
                    <span className="text-[var(--accent)]">Поиск</span>
                  </div>
                )}
              </div>

              {isLoading && loadingChatId === activeChatId ? (
                <button onClick={stopGeneration} className="p-3 rounded-full bg-white text-black transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]" title="Stop generation">
                  <span className="h-4 w-4 rounded-sm bg-black" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className={`p-3 rounded-full transition-all flex items-center justify-center ${input.trim() && !isLoading ? "bg-white text-black scale-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/10 text-white/20 scale-90 grayscale cursor-not-allowed"}`}>
                  {themedIcon("send", <ArrowUp className="w-5 h-5" />, "w-5 h-5")}
                </button>
              )}
            </div>
          </div>
        </div>}
      </main>

      {sourcePanel && (
        <aside className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-sm flex-col border-l border-white/10 bg-black/95 text-white shadow-2xl backdrop-blur-xl md:max-w-[390px]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-base font-semibold">Источники</h2>
            <button
              type="button"
              onClick={() => setSourcePanel(null)}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Закрыть источники"
              aria-label="Закрыть источники"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {sourcePanel.sources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition-colors hover:border-[var(--accent)]/45 hover:bg-white/[0.075]"
                >
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)]">
                      {getSourceHost(source.url).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate">{getSourceHost(source.url)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white">{source.title}</p>
                  {!!source.content && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/65">{source.content}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </aside>
      )}

      <AnimatePresence>
        {activeView === "x" && isXComposerOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-16 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -10 }} className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <button onClick={() => setIsXComposerOpen(false)} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
                <button onClick={publishXPost} disabled={!xDraft.trim()} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black disabled:opacity-40">
                  Опубликовать
                </button>
              </div>
              <div className="flex gap-3 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ff4b25] font-semibold">{(xUserName.trim()[0] || "U").toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <textarea
                    autoFocus
                    value={xDraft}
                    onChange={(event) => setXDraft(event.target.value)}
                    rows={5}
                    placeholder="Что происходит?"
                    className="max-h-72 min-h-32 w-full resize-none bg-transparent text-xl text-white outline-none placeholder:text-white/40 custom-scrollbar"
                  />
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex gap-4 text-[#1d9bf0]">
                      <ImagePlus className="h-5 w-5" />
                      <Hash className="h-5 w-5" />
                      <Sparkles className="h-5 w-5" />
                      <CircleEllipsis className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-white/35">{Math.max(0, 280 - xDraft.length)} символов</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[var(--panel-bg)] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[var(--accent)] to-[var(--accent-to)]" />
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)]">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Local Settings</h2>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> OpenRouter API Key
                  </label>
                  <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-or-v1-..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
                  <p className="text-[10px] text-white/20 leading-relaxed">Ключ хранится локально в браузере и используется только для запросов к OpenRouter.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> Model selection
                  </label>
                  <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 appearance-none transition-colors">
                    {MODEL_OPTIONS.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}
                  </select>
                  <label className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-white/70">
                    <input type="checkbox" checked={useCustomModel} onChange={(event) => setUseCustomModel(event.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                    Use custom OpenRouter model id
                  </label>
                  {useCustomModel && (
                    <input value={customModel} onChange={(event) => setCustomModel(event.target.value)} placeholder="for example: meta-llama/llama-3.1-70b-instruct" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
                  )}
                  <p className="text-[10px] text-white/20 leading-relaxed">Для своей модели вставь точный model id из OpenRouter. Если поле пустое, будет использована выбранная модель из списка.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <WandSparkles className="w-3 h-3" /> Global assistant prompt
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROMPT_TEMPLATES.map((template) => (
                      <button key={template.title} onClick={() => setGlobalPrompt(template.prompt)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-white/70 hover:bg-white/10">
                        {template.title}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={globalPrompt}
                    onChange={(event) => setGlobalPrompt(event.target.value)}
                    placeholder="Общие правила для всех чатов: язык, стиль ответа, формат, ограничения, роль помощника..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none custom-scrollbar"
                  />
                  <p className="text-[10px] text-white/20 leading-relaxed">Этот промпт применяется ко всем проектам и чатам. Инструкции конкретного проекта добавляются сверху как контекст проекта.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Memory
                  </label>
                  <textarea
                    value={assistantMemory}
                    onChange={(event) => setAssistantMemory(event.target.value)}
                    placeholder="Факты о пользователе, стиль ответа, предпочтения, постоянный контекст..."
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none custom-scrollbar"
                  />
                  <p className="text-[10px] text-white/20 leading-relaxed">Memory подмешивается в системный промпт всех обычных чатов и проектов.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <Download className="w-3 h-3" /> Workspace backup
                  </label>
                  <input ref={importInputRef} type="file" accept="application/json,.json" onChange={importWorkspace} className="hidden" />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={exportWorkspace} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 hover:bg-white/10">
                      <Download className="h-4 w-4" /> Export workspace
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70 hover:bg-white/10">
                      <Upload className="h-4 w-4" /> Import workspace
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {themeOptions.map((theme) => (
                      <button key={theme.id} onClick={() => setThemeId(theme.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${theme.id === themeId ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <span className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentTo})` }} />
                        <span className="text-sm text-white/70">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Custom design controls
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setCustomTheme(DEFAULT_CUSTOM_THEME); setThemeId("aether"); }} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white">Reset</button>
                      <button onClick={() => setThemeId("custom")} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white">Use Custom</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["appBg", "App"],
                      ["sidebarBg", "Sidebar"],
                      ["panelBg", "Panel"],
                      ["textColor", "Text"],
                      ["mutedText", "Muted"],
                      ["accent", "Accent"],
                      ["accentTo", "Accent 2"],
                      ["assistantBubble", "AI bubble"],
                      ["assistantText", "AI text"],
                      ["actionButtonBg", "Action bg"],
                      ["actionButtonText", "Action text"],
                      ["userBubble", "User bubble"],
                      ["userText", "User text"]
                    ] as Array<[keyof ThemeConfig, string]>).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-white/55">
                        {label}
                        <input type="color" value={String(customTheme[key])} onChange={(event) => updateCustomTheme({ [key]: event.target.value } as Partial<ThemeConfig>)} className="h-7 w-9 rounded border-0 bg-transparent" />
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs text-white/45">
                      Effect
                      <select value={customTheme.ambientEffect} onChange={(event) => updateCustomTheme({ ambientEffect: event.target.value as ThemeConfig["ambientEffect"] })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-white outline-none">
                        <option value="none">None</option>
                        <option value="snow">Snow</option>
                        <option value="rain">Rain</option>
                        <option value="stars">Stars</option>
                      </select>
                    </label>
                    <label className="block text-xs text-white/45">
                      Button icons
                      <select value={customTheme.buttonIconStyle} onChange={(event) => updateCustomTheme({ buttonIconStyle: event.target.value as ThemeConfig["buttonIconStyle"] })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-2 text-sm text-white outline-none">
                        <option value="icons">Icons</option>
                        <option value="emoji">Emoji</option>
                      </select>
                    </label>
                  </div>
                  {customTheme.buttonIconStyle === "emoji" && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["newChat", "newProject", "search", "settings", "addFiles", "modifier", "webSearch", "projects", "send", "assistant"] as Array<keyof typeof DEFAULT_BUTTON_EMOJIS>).map((key) => (
                        <label key={key} className="rounded-xl border border-white/10 bg-black/20 p-2 text-[10px] text-white/45">
                          {key}
                          <input value={customTheme.buttonEmojis[key] || ""} onChange={(event) => updateCustomTheme({ buttonEmojis: { ...customTheme.buttonEmojis, [key]: event.target.value } })} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none" />
                        </label>
                      ))}
                    </div>
                  )}
                  <label className="block text-xs text-white/45">
                    Radius {customTheme.radius}px
                    <input type="range" min="10" max="42" value={customTheme.radius} onChange={(event) => updateCustomTheme({ radius: Number(event.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
                  </label>
                  <label className="block text-xs text-white/45">
                    Font scale {customTheme.fontScale.toFixed(2)}
                    <input type="range" min="0.9" max="1.15" step="0.01" value={customTheme.fontScale} onChange={(event) => updateCustomTheme({ fontScale: Number(event.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
                  </label>
                  <label className="block text-xs text-white/45">
                    Input width {customTheme.inputWidth}px
                    <input type="range" min="640" max="1120" step="16" value={customTheme.inputWidth} onChange={(event) => updateCustomTheme({ inputWidth: Number(event.target.value) })} className="mt-2 w-full accent-[var(--accent)]" />
                  </label>
                </div>

                <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors mt-4">
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProjectOpen && activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProjectOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-[var(--panel-bg)] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[var(--accent)] to-[var(--accent-to)]" />
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[var(--accent)]">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold">Project Folder</h2>
                </div>
                <button onClick={() => setIsProjectOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Project name</label>
                    <input value={activeProject.name} onChange={(event) => updateActiveProject({ name: event.target.value })} placeholder="Project name" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/40">Assistant name</label>
                    <input value={activeProject.assistantName || ""} onChange={(event) => updateActiveProject({ assistantName: event.target.value })} placeholder="Aether" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <WandSparkles className="w-3 h-3" /> Project instructions
                  </label>
                  <textarea value={activeProject.prompt} onChange={(event) => updateActiveProject({ prompt: event.target.value })} placeholder="Инструкции именно для этого проекта: контекст, цель, стиль работы, правила, формат ответов, роли, если они нужны..." rows={7} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none custom-scrollbar" />
                </div>

                <div onDragOver={(event) => { event.preventDefault(); setIsDraggingImages(true); }} onDragLeave={() => setIsDraggingImages(false)} onDrop={handleProjectDrop} className={`rounded-[2rem] border border-dashed p-5 transition-colors ${isDraggingImages ? "border-[var(--accent)] bg-white/10" : "border-white/10 bg-white/5"}`}>
                  <input ref={imageInputRef} type="file" accept="image/*,.txt,.md,.json,.csv,.ts,.tsx" multiple onChange={handleProjectFilePick} className="hidden" />
                  <button onClick={() => imageInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl py-8 text-white/60 hover:text-white transition-colors">
                    <FileText className="w-8 h-8 text-[var(--accent)]" />
                    <span className="text-sm font-medium">Drag & drop local project files here or click to choose</span>
                    <span className="text-[10px] text-white/30">Images plus .txt, .md, .json, .csv, .ts, .tsx are stored locally and added to project context.</span>
                  </button>
                </div>

                {!!activeProject.images.length && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {activeProject.images.map((image) => (
                      <div key={image.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <img src={image.dataUrl} alt={image.name} className="h-28 w-full object-cover" />
                        <button onClick={() => removeProjectImage(image.id)} className="absolute right-2 top-2 p-2 rounded-full bg-black/60 text-white/70 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:text-white" title="Remove file">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="p-2 text-[10px] text-white/40 truncate">{image.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!!activeProject.files?.filter((file) => file.type === "text").length && (
                  <div className="space-y-2">
                    {activeProject.files.filter((file) => file.type === "text").map((file) => (
                      <div key={file.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <FileText className="h-4 w-4 text-[var(--accent)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white/75">{file.name}</p>
                          <p className="text-[10px] text-white/30">{formatXMetric(file.content.length)} chars</p>
                        </div>
                        <button onClick={() => removeProjectFile(file.id)} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setIsProjectOpen(false)} className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors">
                  Save Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .aether-root {
          color: var(--text-color);
        }
        .aether-light .text-white,
        .aether-light .text-white\\/90,
        .aether-light .text-white\\/80,
        .aether-light .text-white\\/75,
        .aether-light .text-white\\/70 {
          color: color-mix(in srgb, var(--text-color) 92%, transparent) !important;
        }
        .aether-light .text-white\\/65,
        .aether-light .text-white\\/60,
        .aether-light .text-white\\/55,
        .aether-light .text-white\\/50,
        .aether-light .text-white\\/45,
        .aether-light .text-white\\/40,
        .aether-light .text-white\\/35,
        .aether-light .text-white\\/30,
        .aether-light .text-white\\/25,
        .aether-light .text-white\\/20 {
          color: color-mix(in srgb, var(--muted-text) 88%, transparent) !important;
        }
        .aether-light .bg-white\\/5,
        .aether-light .bg-white\\/\\[0\\.045\\] {
          background-color: rgba(17, 24, 39, 0.055) !important;
        }
        .aether-light .hover\\:bg-white\\/10:hover,
        .aether-light .hover\\:bg-white\\/\\[0\\.075\\]:hover {
          background-color: rgba(17, 24, 39, 0.09) !important;
        }
        .aether-light .border-white\\/10,
        .aether-light .border-white\\/15,
        .aether-light .border-white\\/20 {
          border-color: rgba(17, 24, 39, 0.12) !important;
        }
        .ambient-effect {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 1;
          overflow: hidden;
        }
        .ambient-effect span {
          position: absolute;
          top: -8%;
          display: block;
          opacity: 0.45;
          will-change: transform, opacity;
        }
        .ambient-snow span {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 10px rgba(255,255,255,0.35);
          animation: snow-fall linear infinite;
        }
        .ambient-rain span {
          width: 1px;
          height: 42px;
          border-radius: 999px;
          background: linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 78%, white));
          animation: rain-fall linear infinite;
        }
        .ambient-stars span {
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 65%, white);
          top: auto;
          bottom: ${(0).toString()}%;
          animation: star-twinkle ease-in-out infinite;
        }
        @keyframes snow-fall {
          from { transform: translate3d(0, -10vh, 0) rotate(0deg); }
          to { transform: translate3d(28px, 112vh, 0) rotate(180deg); }
        }
        @keyframes rain-fall {
          from { transform: translate3d(0, -14vh, 0); opacity: 0; }
          12% { opacity: 0.55; }
          to { transform: translate3d(-22px, 118vh, 0); opacity: 0; }
        }
        @keyframes star-twinkle {
          0%, 100% { transform: translateY(-8vh) scale(0.55); opacity: 0.25; }
          50% { transform: translateY(-58vh) scale(1); opacity: 0.8; }
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--accent) 70%, transparent) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--accent) 55%, transparent);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: color-mix(in srgb, var(--accent) 85%, transparent);
        }
        .assistant-markdown {
          overflow: visible;
        }
        .assistant-markdown > * + * {
          margin-top: 0.9rem;
        }
        .assistant-markdown p {
          margin: 0;
        }
        .assistant-markdown strong {
          font-weight: 700;
          color: var(--assistant-text);
        }
        .assistant-markdown em {
          color: color-mix(in srgb, var(--assistant-text) 82%, transparent);
        }
        .assistant-markdown ul,
        .assistant-markdown ol {
          margin: 0;
          padding-left: 1.35rem;
        }
        .assistant-markdown li + li {
          margin-top: 0.35rem;
        }
        .assistant-markdown hr {
          border: 0;
          border-top: 1px solid rgba(255,255,255,0.14);
          margin: 1.1rem 0;
        }
        .assistant-markdown code {
          border: 1px solid color-mix(in srgb, var(--assistant-text) 16%, transparent);
          border-radius: 0.45rem;
          background: color-mix(in srgb, var(--assistant-text) 8%, transparent);
          padding: 0.12rem 0.35rem;
          font-size: 0.92em;
          color: var(--assistant-text);
        }
        .assistant-markdown pre {
          overflow-x: auto;
          border: 1px solid color-mix(in srgb, var(--assistant-text) 16%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--assistant-bubble) 72%, black);
          padding: 1rem;
        }
        .assistant-markdown pre code {
          border: 0;
          border-radius: 0;
          background: transparent;
          padding: 0;
          white-space: pre;
        }
        .assistant-markdown .markdown-table-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          border-radius: 0.9rem;
          border: 1px solid color-mix(in srgb, var(--assistant-text) 16%, transparent);
          scrollbar-width: thin;
          scrollbar-color: color-mix(in srgb, var(--accent) 70%, transparent) transparent;
        }
        .assistant-markdown .markdown-table-wrap::-webkit-scrollbar {
          height: 6px;
        }
        .assistant-markdown .markdown-table-wrap::-webkit-scrollbar-track {
          background: transparent;
        }
        .assistant-markdown .markdown-table-wrap::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--accent) 55%, transparent);
          border-radius: 999px;
        }
        .assistant-markdown table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          font-size: 0.95em;
          line-height: 1.45;
        }
        .assistant-markdown th,
        .assistant-markdown td {
          border: 1px solid color-mix(in srgb, var(--assistant-text) 16%, transparent);
          padding: 0.65rem 0.8rem;
          text-align: left;
          vertical-align: top;
        }
        .assistant-markdown th {
          background: color-mix(in srgb, var(--assistant-text) 8%, transparent);
          font-weight: 700;
          color: var(--assistant-text);
        }
        .assistant-markdown td {
          color: color-mix(in srgb, var(--assistant-text) 86%, transparent);
        }
        .message-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid color-mix(in srgb, var(--action-button-text) 18%, transparent);
          border-radius: 999px;
          background: var(--action-button-bg);
          padding: 0.5rem;
          color: var(--action-button-text);
          opacity: 0.78;
          position: relative;
          z-index: 5;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .message-action-button:disabled {
          cursor: not-allowed;
        }
        .message-action-button:hover {
          background: color-mix(in srgb, var(--action-button-bg) 84%, var(--accent));
          border-color: color-mix(in srgb, var(--accent) 45%, var(--action-button-text));
          color: var(--action-button-text);
          opacity: 1;
        }
        .message-action-button span {
          display: none;
        }
        .message-bubble::-webkit-scrollbar {
          width: 4px;
        }
        select option {
          background: var(--panel-bg);
          color: white;
        }
      `}} />
    </div>
  );
};
