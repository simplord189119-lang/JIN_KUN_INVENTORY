import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Sparkles, User, Upload, Link2, Star,
  Check, X, Menu, LayoutDashboard, Users, Package, History, BarChart3,
  LogOut, LogIn, UserPlus, Loader2, Info, Image as ImageIcon, Eye, EyeOff,
  Trash2, Plus, Search, ListChecks, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase.js";
import { CHARACTERS } from "./data.js";
import { WEAPONS } from "./weaponsData.js";
import { CHARACTER_BUILDS_BY_NAME, WEAPON_INFO_BY_NAME } from "./buildData.js";
/* ============================================================================
   DESIGN TOKENS — starlight blues, ivory whites, gilt-thorn gold, a whisper
   of deep rose thorn-vine. Tailwind covers layout/spacing/type scale; custom
   hues are inline styles since arbitrary Tailwind values aren't available.
============================================================================ */
const C = {
  void: "#080B16",
  panel: "#0F1630",
  panel2: "#141C3D",
  border: "#26305A",
  borderSoft: "#1B2447",
  ivory: "#F4F1E6",
  ivoryDim: "#B7B4C6",
  starlight: "#8FD3FF",
  starlightDim: "#4C6E96",
  gold: "#D6B15C",
  goldDim: "#7A652A",
  thorn: "#8A4A63",
  rose: "#B6708C",
  five: "#E8B84B",
  four: "#B98CE0",
};

const ELEMENTS = {
  Aero: { color: "#7FE0C6", code: "AE" },
  Glacio: { color: "#8FD3FF", code: "GL" },
  Electro: { color: "#C9A6FF", code: "EL" },
  Fusion: { color: "#FF9A6C", code: "FU" },
  Havoc: { color: "#E36BA0", code: "HA" },
  Spectro: { color: "#F4D35E", code: "SP" },
};

const WEAPON_TYPES = {
  Sword: "SW", Broadblade: "BB", Pistols: "PI", Gauntlets: "GA", Rectifier: "RE",
};

const TIERS = [
  { id: "must", label: "Must Pull", color: C.five },
  { id: "high", label: "High", color: C.starlight },
  { id: "low", label: "Low", color: C.ivoryDim },
];

const BANNERS = [
  { id: "char_event", label: "Character Event", short: "Char. Event", kind: "character" },
  { id: "weapon_event", label: "Weapon Event", short: "Weap. Event", kind: "weapon" },
  { id: "char_standard", label: "Standard Character", short: "Char. Standard", kind: "character" },
  { id: "weapon_standard", label: "Standard Weapon", short: "Weap. Standard", kind: "weapon" },
];
const HARD_PITY = 80;

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resonators", label: "Resonators", icon: Users },
  { id: "weapons", label: "Weapons", icon: Package },
  { id: "convene", label: "Convene Import", icon: History },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

/* ============================================================================
   HELPERS
============================================================================ */
function slugify(s) {
  return (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}
function initials(name) {
  return (name || "?").replace(/\(.*?\)/g, "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* Firebase Auth's built-in email/password provider requires a real email
   shape, but the app's UX is "username, not email". We synthesize a stable,
   fake-domain email from the username so people never have to think about
   email at all — Firebase still does all the real credential checking. */
const USERNAME_DOMAIN = "users.jinkuninventory.app";
function usernameToEmail(username) {
  return `${slugify(username)}@${USERNAME_DOMAIN}`;
}
function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That username is already taken.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Incorrect username or password.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("too-many-requests")) return "Too many attempts — wait a bit and try again.";
  if (code.includes("invalid-email")) return "That username has characters that don't convert cleanly — try letters/numbers only.";
  return "Something went wrong. Try again.";
}

function parseConveneLink(raw) {
  try {
    let queryStr = "";
    const hashIdx = raw.indexOf("#");
    if (hashIdx >= 0) {
      const afterHash = raw.slice(hashIdx + 1);
      const qIdx = afterHash.indexOf("?");
      queryStr = qIdx >= 0 ? afterHash.slice(qIdx + 1) : "";
    }
    if (!queryStr) {
      const u = new URL(raw);
      queryStr = u.search.replace(/^\?/, "");
    }
    const params = new URLSearchParams(queryStr);
    const playerId = params.get("player_id") || params.get("playerId");
    const serverId = params.get("svr_id") || params.get("svrId");
    if (!playerId && !serverId && !queryStr) return null;
    return {
      playerId, serverId,
      lang: params.get("lang") || "en",
      recordId: params.get("record_id") || params.get("recordId"),
      resourcesId: params.get("resources_id"),
      raw: queryStr,
    };
  } catch {
    return null;
  }
}

async function attemptDirectFetch(parsed) {
  const endpoint = "https://gmserver-api.aki-game2.net/gacha/record/query";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: parsed.playerId,
      serverId: parsed.serverId,
      languageCode: parsed.lang || "en",
      recordId: parsed.recordId,
      cardPoolId: parsed.resourcesId,
      cardPoolType: "1",
    }),
  });
  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
  return res.json();
}

function makePull(banner, rarity, name, time, won50 = null) {
  return {
    id: `${banner}-${time}-${Math.random().toString(36).slice(2, 8)}`,
    banner, rarity, name, time, won50,
  };
}

/* Lenient normalizer for pasted JSON export records — different export
   tools use different field names, so we check a handful of aliases. */
function normalizeRecord(rec, fallbackBanner) {
  if (!rec || typeof rec !== "object") return null;
  const rarity = Number(rec.rarity ?? rec.qualityLevel ?? rec.rank ?? rec.star ?? 0);
  const name = rec.name ?? rec.resourceName ?? rec.itemName ?? rec.characterName ?? null;
  const time = rec.time ?? rec.date ?? rec.gachaTime ?? new Date().toISOString();
  const banner = rec.banner ?? fallbackBanner;
  if (!rarity || !name) return null;
  return makePull(banner, rarity, String(name), new Date(time).toISOString());
}

function computePity(pullHistory, bannerId) {
  const bannerPulls = pullHistory
    .filter(p => p.banner === bannerId)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
  let sinceFive = 0;
  for (const p of bannerPulls) {
    sinceFive++;
    if (p.rarity === 5) sinceFive = 0;
  }
  return sinceFive;
}

/* Resize + compress an uploaded image client-side so it fits comfortably
   under the storage value size limit before it's saved as a data URL. */
function compressImageFile(file, maxDim = 1920, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   SMALL UI PRIMITIVES
============================================================================ */
function ElementBadge({ element, size = 22 }) {
  const e = ELEMENTS[element] || { color: C.ivoryDim, code: "??" };
  return (
    <span
      title={element}
      style={{ width: size, height: size, background: `${e.color}22`, color: e.color, border: `1px solid ${e.color}66` }}
      className="rounded-full flex items-center justify-center text-[9px] font-bold tracking-tight shrink-0"
    >
      {e.code}
    </span>
  );
}

function WeaponBadge({ type, size = 22 }) {
  const code = WEAPON_TYPES[type] || "??";
  return (
    <span
      title={type}
      style={{ width: size, height: size, background: `${C.starlight}18`, color: C.starlight, border: `1px solid ${C.starlight}55` }}
      className="rounded-md flex items-center justify-center text-[9px] font-bold tracking-tight shrink-0"
    >
      {code}
    </span>
  );
}

function Portrait({ name, image, color, rarity, size = "w-full aspect-square" }) {
  return (
    <div
      className={`${size} rounded-lg flex items-center justify-center relative overflow-hidden`}
      style={{
        background: image ? C.panel2 : `linear-gradient(155deg, ${color}33, ${C.panel2} 70%)`,
        border: `1px solid ${rarity === 5 ? C.gold + "77" : C.border}`,
      }}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-black tracking-wide" style={{ color, fontFamily: "'Orbitron', sans-serif", fontSize: "1.4rem" }}>
          {initials(name)}
        </span>
      )}
      {rarity === 5 && (
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
      )}
    </div>
  );
}

function RarityStars({ rarity }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rarity }).map((_, i) => (
        <Star key={i} size={10} fill={rarity === 5 ? C.five : C.four} color={rarity === 5 ? C.five : C.four} />
      ))}
    </div>
  );
}

function TierPicker({ value, onChange }) {
  return (
    <div className="flex gap-1 mt-2">
      {TIERS.map(t => (
        <button
          key={t.id}
          onClick={(e) => { e.stopPropagation(); onChange(value === t.id ? null : t.id); }}
          className="flex-1 rounded text-[9px] font-semibold py-1 uppercase tracking-wide transition-all"
          style={{
            background: value === t.id ? t.color : C.panel2,
            color: value === t.id ? C.void : C.ivoryDim,
            border: `1px solid ${value === t.id ? t.color : C.border}`,
          }}
        >
          {t.id === "must" ? "Must" : t.label}
        </button>
      ))}
    </div>
  );
}

function RadialPity({ label, pity, hardPity = HARD_PITY }) {
  const pct = Math.min(100, Math.round((pity / hardPity) * 100));
  const hot = pity >= hardPity - 15;
  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-full flex items-center justify-center shrink-0"
        style={{ width: 56, height: 56, background: `conic-gradient(${hot ? C.five : C.starlight} ${pct * 3.6}deg, ${C.borderSoft} 0deg)` }}
      >
        <div className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: C.panel }}>
          <span className="font-mono font-bold text-sm" style={{ color: hot ? C.five : C.ivory }}>{pity}</span>
        </div>
      </div>
      <div>
        <div className="text-xs" style={{ color: C.ivoryDim }}>{label}</div>
        <div className="text-[11px] font-mono" style={{ color: C.starlightDim }}>{pity} / {hardPity} pity</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-sm font-medium z-50 shadow-lg flex items-center gap-2 max-w-[90vw]"
      style={{ background: C.panel2, border: `1px solid ${toast.type === "error" ? "#B6708C" : C.starlight}55`, color: C.ivory }}
    >
      {toast.type === "error" ? <X size={14} color="#E38FA8" /> : <Check size={14} color={C.starlight} />}
      {toast.message}
    </div>
  );
}

/* ============================================================================
   BACKDROP — either the user's uploaded wallpaper (with a legibility
   overlay) or the original starlight/thorn signature motif.
============================================================================ */
function Backdrop({ wallpaperUrl }) {
  if (wallpaperUrl) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: C.void }}>
        <img src={wallpaperUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, ${C.void}CC 0%, ${C.void}99 40%, ${C.void}EE 100%)` }}
        />
      </div>
    );
  }
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: C.void }}>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 80% 60% at 20% 0%, ${C.starlight}14, transparent 60%),
                     radial-gradient(ellipse 70% 50% at 100% 100%, ${C.thorn}12, transparent 60%)`,
      }} />
      <svg className="absolute -right-24 -bottom-24 opacity-[0.14] motion-safe:animate-[pulse_9s_ease-in-out_infinite]" width="620" height="620" viewBox="0 0 200 200" fill="none">
        <line x1="100" y1="10" x2="100" y2="180" stroke={C.starlight} strokeWidth="1.4" />
        <line x1="60" y1="45" x2="140" y2="45" stroke={C.gold} strokeWidth="1.6" />
        <path d="M100 45 L100 175" stroke={C.gold} strokeWidth="2.2" />
        <path d="M70 60 C 60 90, 85 100, 78 130 C 74 150, 90 160, 88 178" stroke={C.thorn} strokeWidth="1" fill="none" />
        <path d="M130 65 C 142 92, 118 105, 126 132 C 131 152, 114 162, 118 178" stroke={C.thorn} strokeWidth="1" fill="none" />
        {[...Array(16)].map((_, i) => (
          <circle key={i} cx={40 + (i * 37) % 160} cy={10 + (i * 53) % 190} r={i % 3 === 0 ? 1.4 : 0.8} fill={C.ivory} opacity={0.5} />
        ))}
      </svg>
    </div>
  );
}

/* ============================================================================
   APP
============================================================================ */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- auth ---
  const [username, setUsername] = useState(null);
  const [uid, setUid] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'signup'
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authShowPw, setAuthShowPw] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  // --- wallpaper ---
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [wallpaperBusy, setWallpaperBusy] = useState(false);
  const fileInputRef = useRef(null);

  // --- data ---
  const [characterPriorities, setCharacterPriorities] = useState({});
  const [weaponPriorities, setWeaponPriorities] = useState({});
  const [pullHistory, setPullHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // --- convene import ---
  const [conveneLink, setConveneLink] = useState("");
  const [conveneBusy, setConveneBusy] = useState(false);
  const [conveneTargetBanner, setConveneTargetBanner] = useState("char_event");
  const [jsonPaste, setJsonPaste] = useState("");

  // --- manual add ---
  const [manualBanner, setManualBanner] = useState("char_event");
  const [manualRarity, setManualRarity] = useState(5);
  const [manualName, setManualName] = useState("");

  // --- search filters ---
  const [charSearch, setCharSearch] = useState("");
  const [weaponSearch, setWeaponSearch] = useState("");
  const [charElementFilter, setCharElementFilter] = useState("all");
  const [charWeaponFilter, setCharWeaponFilter] = useState("all");
  const [weaponTypeFilter, setWeaponTypeFilter] = useState("all");

  // --- dashboard priority view ---
  const [dashPriorityTier, setDashPriorityTier] = useState("must");

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const notify = useCallback((message, type = "ok") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  /* ---------------------------------------------------------------------
     REAL AUTH — Firebase Authentication (email/password under the hood,
     synthesized from the username so people never type an email). Session
     persists automatically across refreshes via onAuthStateChanged below.
  --------------------------------------------------------------------- */
  async function handleSignup() {
    const uname = authUsername.trim();
    const slug = slugify(uname);
    if (!slug) { setAuthError("Enter a username."); return; }
    if (authPassword.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    if (authPassword !== authConfirm) { setAuthError("Passwords don't match."); return; }
    setAuthBusy(true);
    setAuthError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(uname), authPassword);
      await setDoc(doc(db, "users", cred.user.uid), {
        username: uname,
        characterPriorities: {},
        weaponPriorities: {},
        pullHistory: [],
        wallpaper: null,
      });
      skipNextSave.current = true;
      setCharacterPriorities({});
      setWeaponPriorities({});
      setPullHistory([]);
      setWallpaperUrl(null);
      setUsername(uname);
      setUid(cred.user.uid);
      setAuthOpen(false);
      resetAuthFields();
      notify(`Account created — welcome, ${uname}.`);
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogin() {
    const uname = authUsername.trim();
    const slug = slugify(uname);
    if (!slug || !authPassword) { setAuthError("Enter your username and password."); return; }
    setAuthBusy(true);
    setAuthError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, usernameToEmail(uname), authPassword);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const data = snap.exists() ? snap.data() : { characterPriorities: {}, weaponPriorities: {}, pullHistory: [], wallpaper: null };
      skipNextSave.current = true;
      setCharacterPriorities(data.characterPriorities || {});
      setWeaponPriorities(data.weaponPriorities || {});
      setPullHistory(data.pullHistory || []);
      setWallpaperUrl(data.wallpaper || null);
      setUsername(data.username || uname);
      setUid(cred.user.uid);
      setAuthOpen(false);
      resetAuthFields();
      notify(`Welcome back, ${data.username || uname}.`);
    } catch (err) {
      setAuthError(friendlyAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  }

  function resetAuthFields() {
    setAuthUsername("");
    setAuthPassword("");
    setAuthConfirm("");
    setAuthError("");
    setAuthShowPw(false);
  }

  async function handleLogout() {
    await signOut(auth);
    setUsername(null);
    setUid(null);
    setCharacterPriorities({});
    setWeaponPriorities({});
    setPullHistory([]);
    setWallpaperUrl(null);
    notify("Signed out. Switched to guest mode (not saved).");
  }

  // restore session on page load/refresh (Firebase keeps you signed in)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.exists() ? snap.data() : { characterPriorities: {}, weaponPriorities: {}, pullHistory: [], wallpaper: null };
          skipNextSave.current = true;
          setCharacterPriorities(data.characterPriorities || {});
          setWeaponPriorities(data.weaponPriorities || {});
          setPullHistory(data.pullHistory || []);
          setWallpaperUrl(data.wallpaper || null);
          setUsername(data.username || null);
          setUid(user.uid);
        } catch {
          notify("Couldn't reach the cloud database — check your connection.", "error");
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced autosave of priorities + pull history for logged-in users
  useEffect(() => {
    if (!uid) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, "users", uid), { characterPriorities, weaponPriorities, pullHistory }, { merge: true });
      } catch {
        notify("Cloud sync failed — will retry on next change.", "error");
      }
    }, 900);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterPriorities, weaponPriorities, pullHistory, uid]);

  /* ---------------------------------------------------------------------
     WALLPAPER — compressed hard enough to comfortably fit inside a
     Firestore document (1MiB limit, shared with priorities + history).
  --------------------------------------------------------------------- */
  async function handleWallpaperFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("Please choose an image file.", "error"); return; }
    if (file.size > 20 * 1024 * 1024) { notify("That image is too large (max 20MB).", "error"); return; }
    setWallpaperBusy(true);
    try {
      const dataUrl = await compressImageFile(file, 1200, 0.6);
      setWallpaperUrl(dataUrl);
      if (uid) {
        await setDoc(doc(db, "users", uid), { wallpaper: dataUrl }, { merge: true });
        notify("Wallpaper updated.");
      } else {
        notify("Wallpaper set for this session — log in to keep it.");
      }
    } catch (err) {
      notify(err.message || "Couldn't process that image — try a smaller photo.", "error");
    } finally {
      setWallpaperBusy(false);
    }
  }

  async function handleRemoveWallpaper() {
    setWallpaperUrl(null);
    if (uid) {
      try { await setDoc(doc(db, "users", uid), { wallpaper: null }, { merge: true }); } catch { /* non-fatal */ }
    }
    notify("Wallpaper reset to default.");
  }

  /* ---------------------------------------------------------------------
     PRIORITIES
  --------------------------------------------------------------------- */
  function setCharTier(id, tier) {
    setCharacterPriorities(prev => {
      const next = { ...prev };
      if (tier == null) delete next[id]; else next[id] = tier;
      return next;
    });
  }
  function setWeaponTier(id, tier) {
    setWeaponPriorities(prev => {
      const next = { ...prev };
      if (tier == null) delete next[id]; else next[id] = tier;
      return next;
    });
  }

  /* ---------------------------------------------------------------------
     CONVENE IMPORT
  --------------------------------------------------------------------- */
  async function handleLinkImport() {
    const parsed = parseConveneLink(conveneLink.trim());
    if (!parsed) { notify("That doesn't look like a valid convene link.", "error"); return; }
    setConveneBusy(true);
    try {
      const json = await attemptDirectFetch(parsed);
      const records = json?.data || json?.list || [];
      const imported = records.map(r => normalizeRecord(r, conveneTargetBanner)).filter(Boolean);
      if (!imported.length) { notify("No pulls found in that response.", "error"); return; }
      setPullHistory(prev => [...imported, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)));
      notify(`Imported ${imported.length} pulls.`);
      setConveneLink("");
    } catch {
      notify("Direct fetch failed (browsers usually block this due to CORS). Try the JSON paste option below instead.", "error");
    } finally {
      setConveneBusy(false);
    }
  }

  function handleJsonImport() {
    if (!jsonPaste.trim()) { notify("Paste some JSON first.", "error"); return; }
    try {
      const parsed = JSON.parse(jsonPaste);
      const records = Array.isArray(parsed) ? parsed : (parsed.data || parsed.list || []);
      const imported = records.map(r => normalizeRecord(r, conveneTargetBanner)).filter(Boolean);
      if (!imported.length) { notify("Couldn't find any recognizable pulls in that JSON.", "error"); return; }
      setPullHistory(prev => [...imported, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)));
      notify(`Imported ${imported.length} pulls.`);
      setJsonPaste("");
    } catch {
      notify("That's not valid JSON.", "error");
    }
  }

  function handleManualAdd() {
    if (!manualName.trim()) { notify("Enter a character or weapon name.", "error"); return; }
    const pull = makePull(manualBanner, manualRarity, manualName.trim(), new Date().toISOString());
    setPullHistory(prev => [pull, ...prev]);
    notify(`Logged ${manualName.trim()} (${manualRarity}★).`);
    setManualName("");
  }

  function handleClearHistory() {
    if (!window.confirm("Clear all pull history? This can't be undone.")) return;
    setPullHistory([]);
    notify("Pull history cleared.");
  }

  function markFiftyFifty(id, won) {
    setPullHistory(prev => prev.map(p => (p.id === id ? { ...p, won50: won } : p)));
  }

  /* ---------------------------------------------------------------------
     DERIVED DATA
  --------------------------------------------------------------------- */
  const pityByBanner = useMemo(() => {
    const out = {};
    for (const b of BANNERS) out[b.id] = computePity(pullHistory, b.id);
    return out;
  }, [pullHistory]);

  const priorityChars = useMemo(
    () => CHARACTERS.filter(c => characterPriorities[c.id] === dashPriorityTier),
    [characterPriorities, dashPriorityTier]
  );
  const priorityWeapons = useMemo(
    () => WEAPONS.filter(w => weaponPriorities[w.id] === dashPriorityTier),
    [weaponPriorities, dashPriorityTier]
  );

  const filteredChars = useMemo(
    () => CHARACTERS.filter(c =>
      c.name.toLowerCase().includes(charSearch.toLowerCase()) &&
      (charElementFilter === "all" || c.element === charElementFilter) &&
      (charWeaponFilter === "all" || c.weaponType === charWeaponFilter)
    ),
    [charSearch, charElementFilter, charWeaponFilter]
  );
  const filteredWeapons = useMemo(
    () => WEAPONS.filter(w =>
      w.name.toLowerCase().includes(weaponSearch.toLowerCase()) &&
      (weaponTypeFilter === "all" || w.type === weaponTypeFilter)
    ),
    [weaponSearch, weaponTypeFilter]
  );

  const fiftyFiftyPulls = useMemo(
    () => pullHistory.filter(p => p.banner === "char_event" && p.rarity === 5),
    [pullHistory]
  );
  const fiftyFiftyMarked = fiftyFiftyPulls.filter(p => p.won50 === true || p.won50 === false);
  const wins50 = fiftyFiftyMarked.filter(p => p.won50 === true).length;
  const losses50 = fiftyFiftyMarked.filter(p => p.won50 === false).length;
  const pieData = [
    { name: "Won 50/50", value: wins50 },
    { name: "Lost 50/50", value: losses50 },
  ];

  /* ---------------------------------------------------------------------
     RENDER
  --------------------------------------------------------------------- */
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: C.void, color: C.ivory }}>
        <Loader2 size={22} className="animate-spin" color={C.gold} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "'Manrope', sans-serif", color: C.ivory }}>
      <Backdrop wallpaperUrl={wallpaperUrl} />
      <Toast toast={toast} />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ background: `${C.void}CC`, borderColor: C.borderSoft }}>
        <div className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md border" style={{ borderColor: C.border }}>
              <Menu size={20} color={C.ivory} />
            </button>
            <div className="flex items-center gap-2.5">
              <Sparkles size={24} color={C.gold} />
              <span className="font-black tracking-widest text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                JIN_KUN.INVENTORY
              </span>
            </div>
          </div>
          {username ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
            >
              <User size={14} color={C.starlight} />
              {username}
              <LogOut size={13} color={C.ivoryDim} />
            </button>
          ) : (
            <button
              onClick={() => { setAuthMode("login"); setAuthOpen(true); }}
              className="flex items-center gap-2 pl-4 pr-4 py-1.5 rounded-full text-xs font-bold"
              style={{ background: C.gold, color: C.void }}
            >
              <User size={14} /> Sync / Login
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 pb-28">
        {!username && activeTab === "dashboard" && (
          <div className="mb-4 rounded-lg px-4 py-3 flex items-start justify-between gap-3 flex-wrap" style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}44` }}>
            <p className="text-xs" style={{ color: C.rose }}>
              Guest mode — your priorities and pull history live only in this tab and will vanish on refresh.
            </p>
            <button onClick={() => { setAuthMode("signup"); setAuthOpen(true); }} className="text-xs font-semibold underline shrink-0" style={{ color: C.gold }}>
              Create a profile to sync it
            </button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardTab
            username={username}
            pityByBanner={pityByBanner}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "priorities" && (
          <PullPrioritiesTab
            priorityChars={priorityChars}
            priorityWeapons={priorityWeapons}
            dashPriorityTier={dashPriorityTier}
            setDashPriorityTier={setDashPriorityTier}
          />
        )}

        {activeTab === "resonators" && (
          <RosterGrid
            title="Resonator Selection"
            items={filteredChars}
            search={charSearch}
            setSearch={setCharSearch}
            priorities={characterPriorities}
            setTier={setCharTier}
            kind="character"
            elementFilter={charElementFilter}
            setElementFilter={setCharElementFilter}
            weaponFilter={charWeaponFilter}
            setWeaponFilter={setCharWeaponFilter}
          />
        )}

        {activeTab === "weapons" && (
          <RosterGrid
            title="Weapon Selection"
            items={filteredWeapons}
            search={weaponSearch}
            setSearch={setWeaponSearch}
            priorities={weaponPriorities}
            setTier={setWeaponTier}
            kind="weapon"
            weaponFilter={weaponTypeFilter}
            setWeaponFilter={setWeaponTypeFilter}
          />
        )}

        {activeTab === "convene" && (
          <ConveneTab
            conveneLink={conveneLink} setConveneLink={setConveneLink}
            conveneBusy={conveneBusy} handleLinkImport={handleLinkImport}
            conveneTargetBanner={conveneTargetBanner} setConveneTargetBanner={setConveneTargetBanner}
            jsonPaste={jsonPaste} setJsonPaste={setJsonPaste} handleJsonImport={handleJsonImport}
            manualBanner={manualBanner} setManualBanner={setManualBanner}
            manualRarity={manualRarity} setManualRarity={setManualRarity}
            manualName={manualName} setManualName={setManualName}
            handleManualAdd={handleManualAdd}
            pullHistory={pullHistory} handleClearHistory={handleClearHistory}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab
            pityByBanner={pityByBanner}
            pieData={pieData}
            fiftyFiftyPulls={fiftyFiftyPulls}
            markFiftyFifty={markFiftyFifty}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-stretch"
        style={{ background: `${C.void}F2`, borderTop: `1px solid ${C.borderSoft}`, backdropFilter: "blur(10px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex w-full max-w-5xl mx-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <Icon size={19} color={active ? C.gold : C.ivoryDim} />
                <span className="text-[9px] font-semibold leading-none" style={{ color: active ? C.gold : C.ivoryDim }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {sidebarOpen && (
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          username={username}
          wallpaperUrl={wallpaperUrl}
          wallpaperBusy={wallpaperBusy}
          fileInputRef={fileInputRef}
          onPickWallpaper={() => fileInputRef.current?.click()}
          onWallpaperFile={handleWallpaperFile}
          onRemoveWallpaper={handleRemoveWallpaper}
          onOpenAuth={(mode) => { setAuthMode(mode); setAuthOpen(true); setSidebarOpen(false); }}
          onLogout={handleLogout}
          onOpenPriorities={() => { setActiveTab("priorities"); setSidebarOpen(false); }}
        />
      )}

      {authOpen && (
        <AuthModal
          mode={authMode} setMode={setAuthMode}
          username={authUsername} setUsername={setAuthUsername}
          password={authPassword} setPassword={setAuthPassword}
          confirm={authConfirm} setConfirm={setAuthConfirm}
          showPw={authShowPw} setShowPw={setAuthShowPw}
          busy={authBusy} error={authError}
          onSubmit={authMode === "login" ? handleLogin : handleSignup}
          onClose={() => { setAuthOpen(false); resetAuthFields(); }}
        />
      )}
    </div>
  );
}

/* ============================================================================
   DASHBOARD TAB
============================================================================ */
function DashboardTab({ username, pityByBanner, setActiveTab }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} color={C.gold} />
          <h1 className="text-lg font-bold">Welcome, {username || "Rover"}</h1>
        </div>
        <p className="text-sm" style={{ color: C.ivoryDim }}>
          Track your convene pity, rank your priority targets, and see your 50/50 luck at a glance. Set priorities on the{" "}
          <button onClick={() => setActiveTab("resonators")} className="underline" style={{ color: C.starlight }}>Resonators</button> and{" "}
          <button onClick={() => setActiveTab("weapons")} className="underline" style={{ color: C.starlight }}>Weapons</button> boards, then import your history from the{" "}
          <button onClick={() => setActiveTab("convene")} className="underline" style={{ color: C.starlight }}>Convene Import</button> tab.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BANNERS.map(b => (
          <div key={b.id} className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <RadialPity label={b.short} pity={pityByBanner[b.id] || 0} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   PULL PRIORITIES TAB — reached only from the sidebar menu
============================================================================ */
function PullPrioritiesTab({ priorityChars, priorityWeapons, dashPriorityTier, setDashPriorityTier }) {
  const activeTierMeta = TIERS.find(t => t.id === dashPriorityTier);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Pull Priorities</h1>

      <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex gap-1.5 mb-4">
          {TIERS.map(t => {
            const active = dashPriorityTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setDashPriorityTier(t.id)}
                className="flex-1 rounded-lg text-xs font-bold py-2 uppercase tracking-wide transition-all"
                style={{
                  background: active ? t.color : C.panel2,
                  color: active ? C.void : C.ivoryDim,
                  border: `1px solid ${active ? t.color : C.border}`,
                }}
              >
                {t.id === "must" ? "Must" : t.label}
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-semibold mb-1.5" style={{ color: C.ivoryDim }}>CHARACTERS</div>
          {priorityChars.length === 0 ? (
            <p className="text-sm italic" style={{ color: C.ivoryDim }}>No characters set to "{activeTierMeta?.label}" yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {priorityChars.map(c => (
                <span key={c.id} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: `${activeTierMeta.color}18`, color: activeTierMeta.color, border: `1px solid ${activeTierMeta.color}55` }}>
                  <ElementBadge element={c.element} size={16} /> {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-semibold mb-1.5" style={{ color: C.ivoryDim }}>WEAPONS</div>
          {priorityWeapons.length === 0 ? (
            <p className="text-sm italic" style={{ color: C.ivoryDim }}>No weapons set to "{activeTierMeta?.label}" yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {priorityWeapons.map(w => (
                <span key={w.id} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ background: `${activeTierMeta.color}18`, color: activeTierMeta.color, border: `1px solid ${activeTierMeta.color}55` }}>
                  <WeaponBadge type={w.type} size={16} /> {w.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   CURATED BUILD INFO — imported from buildData.js (see that file for how
   to add more characters/weapons).
============================================================================ */

function DetailModal({ kind, item, onClose }) {
  const isChar = kind === "character";
  const build = isChar ? CHARACTER_BUILDS_BY_NAME[item.name.toLowerCase()] : null;
  const info = !isChar ? WEAPON_INFO_BY_NAME[item.name.toLowerCase()] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000099" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.panel, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">{item.name}</h2>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>

        <Portrait
          name={item.name}
          image={item.image}
          rarity={item.rarity}
          color={isChar ? (ELEMENTS[item.element]?.color || C.starlight) : C.starlight}
          size="w-32 h-32 mx-auto"
        />
        <div className="flex items-center justify-center gap-2 mt-3">
          {isChar && <ElementBadge element={item.element} />}
          <WeaponBadge type={isChar ? item.weaponType : item.type} />
          <RarityStars rarity={item.rarity} />
        </div>

        {isChar ? (
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.starlight }}>SIGNATURE WEAPON</div>
              <p className="text-sm mt-1">{build?.signatureWeapon || <span className="italic" style={{ color: C.ivoryDim }}>Not added yet.</span>}</p>
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.starlight }}>BEST ECHO SET</div>
              <p className="text-sm mt-1">{build?.echoSet || <span className="italic" style={{ color: C.ivoryDim }}>Not added yet.</span>}</p>
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.starlight }}>BEST TEAM COMP</div>
              {build?.teamComp?.length ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {build.teamComp.map(n => (
                    <span key={n} className="text-xs px-2 py-1 rounded-full" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>{n}</span>
                  ))}
                </div>
              ) : <p className="text-sm mt-1 italic" style={{ color: C.ivoryDim }}>Not added yet.</p>}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.starlight }}>CRIT / BUFF</div>
              <p className="text-sm mt-1">{info?.buff || <span className="italic" style={{ color: C.ivoryDim }}>Not added yet.</span>}</p>
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: C.starlight }}>BELONGS TO</div>
              <p className="text-sm mt-1">{info?.ownerName || <span className="italic" style={{ color: C.ivoryDim }}>Not character-specific / not set.</span>}</p>
            </div>
          </div>
        )}

        {!build && !info && (
          <p className="text-[11px] mt-4 italic" style={{ color: C.ivoryDim }}>
            Ask to have this one filled in and I'll look up current, accurate build info for it.
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   RESONATOR / WEAPON GRID (shared layout)
============================================================================ */
function FilterChipRow({ label, options, value, onChange }) {
  return (
    <div className="mb-2.5">
      <div className="text-[10px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: C.ivoryDim }}>{label}</div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => onChange("all")}
          className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{
            background: value === "all" ? C.gold : C.panel2,
            color: value === "all" ? C.void : C.ivoryDim,
            border: `1px solid ${value === "all" ? C.gold : C.border}`,
          }}
        >
          All
        </button>
        {options.map(opt => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{
                background: active ? opt.color : C.panel2,
                color: active ? C.void : C.ivoryDim,
                border: `1px solid ${active ? opt.color : C.border}`,
              }}
            >
              {opt.code && (
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold"
                  style={{ background: active ? `${C.void}33` : `${opt.color}22`, color: active ? C.void : opt.color }}
                >
                  {opt.code}
                </span>
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ELEMENT_FILTER_OPTIONS = Object.entries(ELEMENTS).map(([name, v]) => ({ id: name, label: name, color: v.color, code: v.code }));
const WEAPON_FILTER_OPTIONS = Object.entries(WEAPON_TYPES).map(([name, code]) => ({ id: name, label: name, color: C.starlight, code }));

function RosterGrid({ title, items, search, setSearch, priorities, setTier, kind, elementFilter, setElementFilter, weaponFilter, setWeaponFilter }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const activeFilterCount = (kind === "character" && elementFilter !== "all" ? 1 : 0) + (weaponFilter !== "all" ? 1 : 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h1 className="text-lg font-bold">{title}</h1>
        <span className="text-xs" style={{ color: C.ivoryDim }}>Tap a card for info · tap a tier chip to assign priority</span>
      </div>

      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.ivoryDim} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${kind === "character" ? "resonators" : "weapons"}...`}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
        />
      </div>

      <div className="mb-3">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
        >
          <span className="flex items-center gap-2">
            <Filter size={15} color={C.starlight} />
            Filters
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: C.gold, color: C.void }}>{activeFilterCount}</span>
            )}
          </span>
          {filtersOpen ? <ChevronUp size={15} color={C.ivoryDim} /> : <ChevronDown size={15} color={C.ivoryDim} />}
        </button>
        {filtersOpen && (
          <div className="mt-2 p-3 rounded-lg" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            {kind === "character" && (
              <FilterChipRow label="Element" options={ELEMENT_FILTER_OPTIONS} value={elementFilter} onChange={setElementFilter} />
            )}
            <FilterChipRow label="Weapon Type" options={WEAPON_FILTER_OPTIONS} value={weaponFilter} onChange={setWeaponFilter} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => setDetailItem(item)}
            className="rounded-xl p-3 cursor-pointer active:opacity-80"
            style={{ background: C.panel, border: `1px solid ${C.border}` }}
          >
            <Portrait
              name={item.name}
              image={item.image}
              rarity={item.rarity}
              color={kind === "character" ? (ELEMENTS[item.element]?.color || C.starlight) : C.starlight}
            />
            <div className="mt-2 text-sm font-semibold truncate">{item.name}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                {kind === "character" ? (
                  <>
                    <ElementBadge element={item.element} />
                    <WeaponBadge type={item.weaponType} />
                  </>
                ) : (
                  <WeaponBadge type={item.type} />
                )}
              </div>
              <RarityStars rarity={item.rarity} />
            </div>
            <TierPicker value={priorities[item.id]} onChange={(tier) => setTier(item.id, tier)} />
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm italic text-center py-8" style={{ color: C.ivoryDim }}>No matches.</p>
        )}
      </div>

      {detailItem && <DetailModal kind={kind} item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/* ============================================================================
   CONVENE IMPORT TAB
============================================================================ */
function ConveneTab(props) {
  const {
    conveneLink, setConveneLink, conveneBusy, handleLinkImport,
    conveneTargetBanner, setConveneTargetBanner,
    jsonPaste, setJsonPaste, handleJsonImport,
    manualBanner, setManualBanner, manualRarity, setManualRarity,
    manualName, setManualName, handleManualAdd,
    pullHistory, handleClearHistory,
  } = props;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Convene Import</h1>

      <div className="rounded-xl p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <label className="text-xs font-semibold" style={{ color: C.starlight }}>Target banner for imports without one</label>
        <select
          value={conveneTargetBanner}
          onChange={(e) => setConveneTargetBanner(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
        >
          {BANNERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>

        <label className="text-xs font-semibold" style={{ color: C.starlight }}>Paste your convene link</label>
        <div className="flex gap-2">
          <input
            value={conveneLink}
            onChange={(e) => setConveneLink(e.target.value)}
            placeholder="https://aki-gm-resources...#/record?player_id=..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
          />
          <button
            onClick={handleLinkImport}
            disabled={conveneBusy || !conveneLink.trim()}
            className="px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: C.gold, color: C.void }}
          >
            {conveneBusy ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
            Fetch
          </button>
        </div>
        <p className="text-[11px] flex items-start gap-1.5" style={{ color: C.ivoryDim }}>
          <Info size={12} className="mt-0.5 shrink-0" />
          Direct fetch often gets blocked by the browser (CORS) since it's calling the game server straight from your device. If it fails, use the JSON paste option below with an exported record file instead.
        </p>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <label className="text-xs font-semibold" style={{ color: C.starlight }}>Or paste exported JSON</label>
        <textarea
          value={jsonPaste}
          onChange={(e) => setJsonPaste(e.target.value)}
          rows={4}
          placeholder='[{"name":"Jinhsi","rarity":5,"time":"2026-05-01T12:00:00Z"}, ...]'
          className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
        />
        <button
          onClick={handleJsonImport}
          className="px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm font-semibold"
          style={{ background: C.panel2, border: `1px solid ${C.starlight}55`, color: C.starlight }}
        >
          <Upload size={15} /> Import JSON
        </button>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <label className="text-xs font-semibold" style={{ color: C.starlight }}>Log a single pull manually</label>
        <div className="flex gap-2 flex-wrap">
          <select value={manualBanner} onChange={(e) => setManualBanner(e.target.value)} className="px-2 py-2 rounded-lg text-xs outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}>
            {BANNERS.map(b => <option key={b.id} value={b.id}>{b.short}</option>)}
          </select>
          <select value={manualRarity} onChange={(e) => setManualRarity(Number(e.target.value))} className="px-2 py-2 rounded-lg text-xs outline-none" style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}>
            <option value={5}>5★</option>
            <option value={4}>4★</option>
            <option value={3}>3★</option>
          </select>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Name"
            className="flex-1 min-w-[100px] px-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
          />
          <button onClick={handleManualAdd} className="px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-semibold" style={{ background: C.gold, color: C.void }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold" style={{ color: C.starlight }}>Pull History ({pullHistory.length})</h2>
          {pullHistory.length > 0 && (
            <button onClick={handleClearHistory} className="text-xs flex items-center gap-1" style={{ color: C.rose }}>
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
        {pullHistory.length === 0 ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No pulls imported yet.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {pullHistory.slice(0, 150).map(p => {
              const bannerMeta = BANNERS.find(b => b.id === p.banner);
              const rarityColor = p.rarity === 5 ? C.five : p.rarity === 4 ? C.four : C.ivoryDim;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                  style={{ background: C.panel2, borderLeft: `3px solid ${rarityColor}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{p.name}</span>
                      <RarityStars rarity={p.rarity} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {bannerMeta && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${C.starlight}18`, color: C.starlight }}>
                          {bannerMeta.short}
                        </span>
                      )}
                      <span className="text-[11px]" style={{ color: C.ivoryDim }}>{fmtDate(p.time)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   ANALYTICS TAB
============================================================================ */
const PIE_COLORS = [C.five, C.rose];

function AnalyticsTab({ pityByBanner, pieData, fiftyFiftyPulls, markFiftyFifty }) {
  const total = pieData.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Analytics</h1>

      <div className="grid grid-cols-2 gap-3">
        {BANNERS.map(b => (
          <div key={b.id} className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <RadialPity label={b.short} pity={pityByBanner[b.id] || 0} />
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <h2 className="text-sm font-bold" style={{ color: C.starlight }}>50/50 RECORD</h2>
        <p className="text-xs mb-3" style={{ color: C.ivoryDim }}>Character Event banner only. Mark wins/losses in the table below.</p>

        {total === 0 ? (
          <div className="flex flex-col items-center py-6">
            <div className="rounded-full" style={{ width: 160, height: 160, border: `18px solid ${C.borderSoft}` }} />
            <p className="text-sm italic mt-3" style={{ color: C.ivoryDim }}>No marked 5★ pulls yet</p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke={C.panel} />)}
                </Pie>
                <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.ivoryDim }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {fiftyFiftyPulls.length > 0 && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {fiftyFiftyPulls.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded" style={{ background: C.panel2 }}>
                <span className="truncate">{p.name} <span style={{ color: C.ivoryDim }}>· {fmtDate(p.time)}</span></span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => markFiftyFifty(p.id, true)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: p.won50 === true ? C.five : "transparent", color: p.won50 === true ? C.void : C.five, border: `1px solid ${C.five}66` }}
                  >
                    Won
                  </button>
                  <button
                    onClick={() => markFiftyFifty(p.id, false)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: p.won50 === false ? C.rose : "transparent", color: p.won50 === false ? C.void : C.rose, border: `1px solid ${C.rose}66` }}
                  >
                    Lost
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   SIDEBAR DRAWER — appearance (wallpaper) + account
============================================================================ */
function Sidebar({ onClose, username, wallpaperUrl, wallpaperBusy, fileInputRef, onPickWallpaper, onWallpaperFile, onRemoveWallpaper, onOpenAuth, onLogout, onOpenPriorities }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-72 max-w-[85vw] h-full p-4 overflow-y-auto" style={{ background: C.panel, borderRight: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-sm" style={{ fontFamily: "'Orbitron', sans-serif" }}>MENU</span>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>

        <button
          onClick={onOpenPriorities}
          className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold mb-5"
          style={{ background: `${C.gold}14`, border: `1px solid ${C.gold}55`, color: C.gold }}
        >
          <ListChecks size={17} /> Pull Priorities
        </button>

        <h3 className="text-xs font-bold mb-2" style={{ color: C.starlight }}>APPEARANCE</h3>
        <div className="rounded-lg p-3 mb-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
          {wallpaperUrl ? (
            <img src={wallpaperUrl} alt="Current wallpaper" className="w-full h-24 object-cover rounded-md mb-2" />
          ) : (
            <div className="w-full h-24 rounded-md mb-2 flex items-center justify-center text-xs" style={{ background: C.void, color: C.ivoryDim }}>
              Default starlight
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onWallpaperFile} />
          <div className="flex gap-2">
            <button
              onClick={onPickWallpaper}
              disabled={wallpaperBusy}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold disabled:opacity-50"
              style={{ background: C.gold, color: C.void }}
            >
              {wallpaperBusy ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
              Upload
            </button>
            {wallpaperUrl && (
              <button onClick={onRemoveWallpaper} className="px-2 py-2 rounded-md text-xs" style={{ border: `1px solid ${C.border}`, color: C.ivoryDim }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          {!username && <p className="text-[10px] mt-2" style={{ color: C.ivoryDim }}>Log in to keep your wallpaper across sessions.</p>}
        </div>

        <h3 className="text-xs font-bold mb-2" style={{ color: C.starlight }}>ACCOUNT</h3>
        {username ? (
          <div className="rounded-lg p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} color={C.starlight} />
              <span className="text-sm font-semibold">{username}</span>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold" style={{ border: `1px solid ${C.rose}66`, color: C.rose }}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        ) : (
          <div className="rounded-lg p-3 space-y-2" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.ivoryDim }}>Guest mode — nothing is saved.</p>
            <button onClick={() => onOpenAuth("login")} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold" style={{ background: C.gold, color: C.void }}>
              <LogIn size={13} /> Log In
            </button>
            <button onClick={() => onOpenAuth("signup")} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold" style={{ border: `1px solid ${C.starlight}55`, color: C.starlight }}>
              <UserPlus size={13} /> Create Account
            </button>
          </div>
        )}
      </div>
      <div className="flex-1" style={{ background: "#00000088" }} onClick={onClose} />
    </div>
  );
}

/* ============================================================================
   AUTH MODAL — real username + password, salted SHA-256 hashed
============================================================================ */
function AuthModal({ mode, setMode, username, setUsername, password, setPassword, confirm, setConfirm, showPw, setShowPw, busy, error, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000099" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">{mode === "login" ? "Log In" : "Create Account"}</h2>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold" style={{ color: C.starlight }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              autoCapitalize="none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: C.starlight }}>Password</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {showPw ? <EyeOff size={15} color={C.ivoryDim} /> : <Eye size={15} color={C.ivoryDim} />}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <div>
              <label className="text-[11px] font-semibold" style={{ color: C.starlight }}>Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              />
            </div>
          )}

          {error && <p className="text-xs" style={{ color: "#E38FA8" }}>{error}</p>}

          <button
            onClick={onSubmit}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
            style={{ background: C.gold, color: C.void }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : mode === "login" ? <LogIn size={15} /> : <UserPlus size={15} />}
            {mode === "login" ? "Log In" : "Create Account"}
          </button>

          <p className="text-xs text-center" style={{ color: C.ivoryDim }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="underline font-semibold" style={{ color: C.starlight }}>
              {mode === "login" ? "Create one" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
