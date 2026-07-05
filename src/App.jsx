import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Sparkles, User, Upload, Link2, Star, Star as StarIcon, Crown, Circle,
  Check, X, Menu, LayoutDashboard, Users, Package, History, BarChart3,
  LogOut, LogIn, UserPlus, Loader2, Info, Image as ImageIcon, Eye, EyeOff,
  Trash2, Plus, Search, ListChecks, Filter, ChevronDown, ChevronUp,
  Mail, Lock, CheckCircle2,
} from "lucide-react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase.js";
import { CHARACTERS } from "./data.js";
import { WEAPONS } from "./weaponsData.js";
import { BUILD_DATA } from "./buildData.js";

/* ============================================================================
   BUILD LOOKUPS — DetailModal looks characters/weapons up by lowercased
   name, but BUILD_DATA is keyed by `id` and uses a `signature` field (not
   `signatureWeapon`). Derive the two name-keyed maps the modal expects.
============================================================================ */
const CHARACTER_BUILDS_BY_NAME = Object.fromEntries(
  CHARACTERS
    .map((c) => {
      const b = BUILD_DATA.find((x) => x.id === c.id);
      if (!b) return null;
      return [
        c.name.toLowerCase(),
        { signatureWeapon: b.signature, echoSet: b.echoSet, teamComp: b.teamComp },
      ];
    })
    .filter(Boolean)
);

/* Weapon-specific build info (crit/buff text, which character it belongs
   to) isn't in buildData.js yet — BUILD_DATA only covers characters. Left
   empty so DetailModal's existing "Not added yet" fallback handles weapons
   until that data is added; nothing crashes in the meantime. */
const WEAPON_INFO_BY_NAME = {};

/* Pulls in history only store a name string — these let the Tracker tab
   resolve a pull's element/weapon-type/rarity for rendering a Portrait. */
const CHAR_BY_NAME = Object.fromEntries(CHARACTERS.map(c => [c.name.toLowerCase(), c]));
const WEAPON_BY_NAME = Object.fromEntries(WEAPONS.map(w => [w.name.toLowerCase(), w]));

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
  { id: "must", label: "Must Pull", color: C.five, Icon: Crown },
  { id: "high", label: "High", color: C.starlight, Icon: StarIcon },
  { id: "low", label: "Low", color: C.ivoryDim, Icon: Circle },
];

const BANNERS = [
  { id: "char_event", label: "Character Event", short: "Char. Event", kind: "character" },
  { id: "weapon_event", label: "Weapon Event", short: "Weap. Event", kind: "weapon" },
  { id: "char_standard", label: "Standard Character", short: "Char. Standard", kind: "character" },
  { id: "weapon_standard", label: "Standard Weapon", short: "Weap. Standard", kind: "weapon" },
];
const HARD_PITY = 80;
/* 1 pull = 1 Radiant Tide (Featured Resonator convene currency) = 160
   Astrite — this is Kuro's actual exchange rate (Tidal Exchange), not an
   estimate, so Astrite-spent figures below are exact, not approximated. */
const ASTRITE_PER_PULL = 160;

/* Kuro's gacha-record API keys each convene pool by a numeric
   "cardPoolType". Mapping these to our banner ids lets one link import
   pull every pool at once (char event, weapon event, AND both standard
   pools) instead of forcing everything into whichever single banner
   happened to be selected in a dropdown. */
const CARD_POOL_TYPE_TO_BANNER = {
  "1": "char_event",
  "2": "weapon_event",
  "3": "char_standard",
  "4": "weapon_standard",
};

/* ============================================================================
   REFERENCE-MATCHED STYLE SHEET — notch-cut panel corners, gold shimmer
   title text, glowing active-tab underline, and styled auth inputs. Kept
   as plain CSS (injected once below) since arbitrary clip-paths and
   keyframe animations aren't expressible via Tailwind utility classes.
   Resonator/weapon roster cards intentionally do NOT use these classes —
   they keep their original size and styling.
============================================================================ */
const WT_STYLE_SHEET = `
.jk-notch{clip-path:polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%);}
.jk-notch-sm{clip-path:polygon(0 8px,8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%);}
.jk-shimmer{background:linear-gradient(90deg,${C.gold} 0%,#ffe99a 40%,${C.gold} 60%,${C.goldDim} 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:jk-shimmer 4s linear infinite;}
@keyframes jk-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
.jk-tabbtn{position:relative;}
.jk-tabbtn[data-active="true"]::after{content:"";position:absolute;left:18%;right:18%;bottom:0;height:2px;background:${C.gold};box-shadow:0 0 8px ${C.gold}CC;}
.jk-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid ${C.border};border-radius:8px;padding:10px 14px 10px 38px;color:${C.ivory};font-size:14px;outline:none;transition:border-color .2s;}
.jk-input:focus{border-color:${C.gold}88;}
.jk-input::placeholder{color:${C.starlightDim};}
.jk-ambient{background:radial-gradient(ellipse 60% 40% at 50% -6%,${C.gold}22,transparent 62%),radial-gradient(ellipse 70% 55% at 85% 105%,${C.starlight}18,transparent 60%),${C.void};}
`;

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "resonators", label: "Resonators", icon: Users },
  { id: "weapons", label: "Weapons", icon: Package },
  { id: "convene", label: "Tracker", icon: History },
  { id: "analytics", label: "Astrite Calc", icon: BarChart3 },
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

async function attemptDirectFetch(parsed, cardPoolType = "1") {
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
      cardPoolType,
    }),
  });
  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
  return res.json();
}

/* A pull only "wins" or "loses" a 50/50 on an EVENT banner (char_event /
   weapon_event) — standard banners have no rate-up to lose against.
   `sig_*` ids are limited/signature units, only obtainable as the rate-up
   on their own event banner. `standard_*` ids are the permanent pool —
   landing one on an event banner IS the 50/50 loss. Unrecognized names
   (not yet in data.js/weaponsData.js) return null so the UI can still show
   a manual pick instead of silently guessing wrong. */
function autoWon50(bannerId, name) {
  const bannerMeta = BANNERS.find(b => b.id === bannerId);
  if (!bannerMeta || (bannerId !== "char_event" && bannerId !== "weapon_event")) return null;
  const key = (name || "").toLowerCase();
  const match = bannerMeta.kind === "weapon" ? WEAPON_BY_NAME[key] : CHAR_BY_NAME[key];
  if (!match?.id) return null;
  if (match.id.startsWith("sig_")) return true;
  if (match.id.startsWith("standard_")) return false;
  return null;
}

function makePull(banner, rarity, name, time, won50 = undefined) {
  const resolvedWon50 = won50 !== undefined ? won50 : (rarity === 5 ? autoWon50(banner, name) : null);
  return {
    id: `${banner}-${time}-${Math.random().toString(36).slice(2, 8)}`,
    banner, rarity, name, time, won50: resolvedWon50,
  };
}

/* Lenient normalizer for pasted JSON export records — different export
   tools use different field names, so we check a handful of aliases. */
function normalizeRecord(rec, fallbackBanner) {
  if (!rec || typeof rec !== "object") return null;
  const rarity = Number(rec.rarity ?? rec.qualityLevel ?? rec.rank ?? rec.star ?? 0);
  const name = rec.name ?? rec.resourceName ?? rec.itemName ?? rec.characterName ?? null;
  const time = rec.time ?? rec.date ?? rec.gachaTime ?? new Date().toISOString();
  // Prefer the record's OWN pool identifier over the dropdown fallback —
  // this is what makes a single export/paste land pulls on the correct
  // banner (including weapon standard) instead of dumping everything into
  // whatever banner happened to be selected.
  const rawPoolType = rec.cardPoolType ?? rec.card_pool_type ?? rec.poolType ?? rec.gachaType ?? rec.pool_type;
  const banner = rec.banner ?? CARD_POOL_TYPE_TO_BANNER[String(rawPoolType)] ?? fallbackBanner;
  if (!rarity || !name) return null;
  return makePull(banner, rarity, String(name), new Date(time).toISOString());
}

/* One-shot cleanup for history imported before the fixes above existed,
   back when every pull from a link/JSON import got force-tagged with
   whichever single banner was selected in the dropdown. This can't
   un-mix which STANDARD pulls came from which pool (both an event banner
   loss and the standard banner itself can legitimately produce a
   standard_* unit) — but it CAN safely fix two things that are always
   unambiguous:
     1. A sig_* unit only ever comes from its own event banner, so any
        sig_* pull sitting under the wrong banner gets moved to the
        correct one.
     2. Every 5★ pull's won50 gets recomputed from scratch via autoWon50,
        replacing old blank/manual marks with an accurate automatic result.
*/
function reclassifyPullHistory(pullHistory) {
  let changed = 0;
  const next = pullHistory.map((p) => {
    let banner = p.banner;
    if (p.rarity === 5) {
      const key = (p.name || "").toLowerCase();
      const char = CHAR_BY_NAME[key];
      const weapon = WEAPON_BY_NAME[key];
      const match = char || weapon;
      if (match?.id?.startsWith("sig_")) {
        const kind = char ? "character" : "weapon";
        const correctBanner = BANNERS.find(b => b.kind === kind && b.id.endsWith("_event"));
        if (correctBanner && correctBanner.id !== banner) banner = correctBanner.id;
      }
    }
    const won50 = p.rarity === 5 ? autoWon50(banner, p.name) : null;
    if (banner !== p.banner || won50 !== p.won50) {
      changed++;
      return { ...p, banner, won50 };
    }
    return p;
  });
  return { next, changed };
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

/* Walks a banner's pull history in chronological order and tags every 5★
   pull with the pity count it took to land (pulls since the previous 5★,
   inclusive) — this is what the game calls your "Radiant Tide" spend for
   that specific character. Returns chronological order (oldest first). */
function annotateFiveStarPity(pullHistory, bannerId) {
  const bannerPulls = pullHistory
    .filter(p => p.banner === bannerId)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
  let sinceFive = 0;
  const fiveStars = [];
  for (const p of bannerPulls) {
    sinceFive++;
    if (p.rarity === 5) {
      fiveStars.push({ ...p, pityAtPull: sinceFive });
      sinceFive = 0;
    }
  }
  return fiveStars;
}

/* Sequence/dupe count (S0, S1, S2…) for the 5★ pull at `index` within a
   chronological list of that banner's 5★ pulls — counts every earlier (and
   including this) pull sharing the same name. */
function dupeSequenceAt(fiveStarsChrono, index) {
  const target = fiveStarsChrono[index];
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (fiveStarsChrono[i].name === target.name) count++;
  }
  return count - 1; // S0 = first copy, S1 = first dupe, etc.
}

/* ============================================================================
   ASTRITE CALCULATOR HELPERS — all real date math against the live clock,
   so the person never multiplies "days remaining × daily amount" by hand.
============================================================================ */
function daysRemainingUntil(dateStr) {
  if (!dateStr) return 0;
  const end = new Date(dateStr);
  if (isNaN(end.getTime())) return 0;
  end.setHours(23, 59, 59, 999);
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/* A source's own end date wins; otherwise it inherits the nearest banner
   countdown already set in the Tracker tab (bannerMeta) — so setting a
   banner's end date once feeds both tabs automatically. */
function sourceHorizon(src, globalHorizonISO) {
  return src.endsAt || globalHorizonISO || null;
}

function computeSourceTotal(src, globalHorizonISO) {
  if (src.kind === "onetime") {
    return src.claimed ? 0 : Math.max(0, src.amount || 0);
  }
  const remainingDays = daysRemainingUntil(sourceHorizon(src, globalHorizonISO));
  if (src.kind === "daily") {
    const usableDays = Math.max(0, remainingDays - (src.claimedToday ? 1 : 0));
    return usableDays * (src.amount || 0);
  }
  if (src.kind === "weekly") {
    const remainingWeeks = Math.floor(remainingDays / 7);
    const usableWeeks = Math.max(0, remainingWeeks - (src.claimedThisWeek ? 1 : 0));
    return usableWeeks * (src.amount || 0);
  }
  return 0;
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
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = image && !imgFailed;

  // reset the failed flag if a new image URL comes in (e.g. user just fixed the link)
  useEffect(() => { setImgFailed(false); }, [image]);

  return (
    <div
      className={`${size} rounded-lg flex items-center justify-center relative overflow-hidden`}
      style={{
        background: showImage ? C.panel2 : `linear-gradient(155deg, ${color}33, ${C.panel2} 70%)`,
        border: `1px solid ${rarity === 5 ? C.gold + "77" : C.border}`,
      }}
    >
      {showImage ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
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
  const [ownedCharacters, setOwnedCharacters] = useState({}); // { [charId]: true }
  const [ownedWeapons, setOwnedWeapons] = useState({}); // { [weaponId]: true }
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

  // --- tracker tab ---
  const [trackerBanner, setTrackerBanner] = useState("char_event");
  const [selectedPullKey, setSelectedPullKey] = useState(null);
  const [bannerMeta, setBannerMeta] = useState({}); // { [bannerId]: { featuredName, endsAt } }
  const [importOpen, setImportOpen] = useState(false);

  // --- astrite calculator ---
  const [calcBanner, setCalcBanner] = useState("char_event"); // which banner's pity to auto-pull
  const [ownedAstrite, setOwnedAstrite] = useState(0); // manual — the app can't read your real balance
  const [astriteSources, setAstriteSources] = useState([]); // [{id,name,kind,amount,endsAt,claimedToday,claimedThisWeek,claimed}]

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = WT_STYLE_SHEET;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
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
        ownedCharacters: {},
        ownedWeapons: {},
        pullHistory: [],
        wallpaper: null,
        bannerMeta: {},
        ownedAstrite: 0,
        astriteSources: [],
      });
      skipNextSave.current = true;
      setCharacterPriorities({});
      setWeaponPriorities({});
      setOwnedCharacters({});
      setOwnedWeapons({});
      setPullHistory([]);
      setWallpaperUrl(null);
      setBannerMeta({});
      setOwnedAstrite(0);
      setAstriteSources([]);
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
      const data = snap.exists() ? snap.data() : { characterPriorities: {}, weaponPriorities: {}, ownedCharacters: {}, ownedWeapons: {}, pullHistory: [], wallpaper: null, bannerMeta: {}, ownedAstrite: 0, astriteSources: [] };
      skipNextSave.current = true;
      setCharacterPriorities(data.characterPriorities || {});
      setWeaponPriorities(data.weaponPriorities || {});
      setOwnedCharacters(data.ownedCharacters || {});
      setOwnedWeapons(data.ownedWeapons || {});
      setPullHistory(data.pullHistory || []);
      setWallpaperUrl(data.wallpaper || null);
      setBannerMeta(data.bannerMeta || {});
      setOwnedAstrite(data.ownedAstrite || 0);
      setAstriteSources(data.astriteSources || []);
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
    setOwnedCharacters({});
    setOwnedWeapons({});
    setPullHistory([]);
    setWallpaperUrl(null);
    setBannerMeta({});
    setOwnedAstrite(0);
    setAstriteSources([]);
    notify("Signed out. Switched to guest mode (not saved).");
  }

  // restore session on page load/refresh (Firebase keeps you signed in)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.exists() ? snap.data() : { characterPriorities: {}, weaponPriorities: {}, ownedCharacters: {}, ownedWeapons: {}, pullHistory: [], wallpaper: null, bannerMeta: {}, ownedAstrite: 0, astriteSources: [] };
          skipNextSave.current = true;
          setCharacterPriorities(data.characterPriorities || {});
          setWeaponPriorities(data.weaponPriorities || {});
          setOwnedCharacters(data.ownedCharacters || {});
          setOwnedWeapons(data.ownedWeapons || {});
          setPullHistory(data.pullHistory || []);
          setWallpaperUrl(data.wallpaper || null);
          setBannerMeta(data.bannerMeta || {});
          setOwnedAstrite(data.ownedAstrite || 0);
          setAstriteSources(data.astriteSources || []);
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
        await setDoc(doc(db, "users", uid), { characterPriorities, weaponPriorities, ownedCharacters, ownedWeapons, pullHistory, bannerMeta, ownedAstrite, astriteSources }, { merge: true });
      } catch {
        notify("Cloud sync failed — will retry on next change.", "error");
      }
    }, 900);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterPriorities, weaponPriorities, ownedCharacters, ownedWeapons, pullHistory, bannerMeta, ownedAstrite, astriteSources, uid]);

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
  function toggleOwned(id) {
    setOwnedCharacters(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      return next;
    });
  }
  function toggleOwnedWeapon(id) {
    setOwnedWeapons(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
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
      // Fetch every convene pool (char event, weapon event, char standard,
      // weapon standard) with the same credentials instead of just one —
      // this is what lets a single pasted link cover your full history,
      // weapon standard included, in one go.
      const poolTypes = Object.keys(CARD_POOL_TYPE_TO_BANNER);
      const results = await Promise.allSettled(poolTypes.map(pt => attemptDirectFetch(parsed, pt)));
      let imported = [];
      let anySucceeded = false;
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        anySucceeded = true;
        const bannerId = CARD_POOL_TYPE_TO_BANNER[poolTypes[i]];
        const records = r.value?.data || r.value?.list || [];
        imported = imported.concat(records.map(rec => normalizeRecord(rec, bannerId)).filter(Boolean));
      });
      if (!anySucceeded) throw new Error("all pools failed");
      if (!imported.length) { notify("No pulls found across any banner.", "error"); return; }
      setPullHistory(prev => [...imported, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)));
      notify(`Imported ${imported.length} pulls across all banners.`);
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

  function handleRecalculate() {
    const { next, changed } = reclassifyPullHistory(pullHistory);
    setPullHistory(next);
    notify(changed ? `Recalculated — fixed ${changed} pull${changed === 1 ? "" : "s"}.` : "Everything already checks out — no changes needed.");
  }

  /* ---------------------------------------------------------------------
     DERIVED DATA
  --------------------------------------------------------------------- */
  const pityByBanner = useMemo(() => {
    const out = {};
    for (const b of BANNERS) out[b.id] = computePity(pullHistory, b.id);
    return out;
  }, [pullHistory]);

  // Real per-banner stats for the Tracker tab: total pulls, Astrite spent
  // (pulls × 160), average pity-per-5★ (mean of each 5★'s actual pity gap),
  // 50/50 win rate (character-event banner only), and the full chronological
  // 5★ history (each annotated with the pity it took and its dupe/S-rank).
  const bannerInsights = useMemo(() => {
    const out = {};
    for (const b of BANNERS) {
      const totalPulls = pullHistory.filter(p => p.banner === b.id).length;
      const fiveStarsChrono = annotateFiveStarPity(pullHistory, b.id).map((p, i, arr) => ({
        ...p,
        dupeRank: dupeSequenceAt(arr, i),
      }));
      const avgPity = fiveStarsChrono.length
        ? Math.round(fiveStarsChrono.reduce((s, p) => s + p.pityAtPull, 0) / fiveStarsChrono.length)
        : 0;
      let winrate = null;
      if (b.id === "char_event") {
        const marked = fiveStarsChrono.filter(p => p.won50 === true || p.won50 === false);
        winrate = marked.length ? Math.round((marked.filter(p => p.won50 === true).length / marked.length) * 100) : null;
      }
      out[b.id] = {
        totalPulls,
        astrite: totalPulls * ASTRITE_PER_PULL,
        avgPity,
        winrate,
        fiveStarCount: fiveStarsChrono.length,
        fiveStarsRecent: fiveStarsChrono.slice().reverse(), // most-recent-first
        pity: pityByBanner[b.id] || 0,
      };
    }
    return out;
  }, [pullHistory, pityByBanner]);

  // Nearest banner end-date already set in the Tracker tab — reused here so
  // Astrite sources don't need their own end date typed in a second time.
  const globalHorizon = useMemo(() => {
    const dates = BANNERS.map(b => bannerMeta[b.id]?.endsAt).filter(Boolean);
    if (!dates.length) return null;
    return dates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min), dates[0]);
  }, [bannerMeta]);

  // Real, automatic Astrite math — no manual multiplication anywhere here.
  const astriteCalc = useMemo(() => {
    const pity = pityByBanner[calcBanner] || 0;
    const pullsToHardPity = Math.max(0, HARD_PITY - pity);
    const astriteNeeded = pullsToHardPity * ASTRITE_PER_PULL;
    const shortfall = Math.max(0, astriteNeeded - ownedAstrite);
    const ownedPulls = Math.floor(ownedAstrite / ASTRITE_PER_PULL);

    const todayTotal = astriteSources
      .filter(s => s.kind === "daily" && !s.claimedToday)
      .reduce((sum, s) => sum + (s.amount || 0), 0);

    const bySource = astriteSources.map(s => ({
      ...s,
      remainingDays: s.kind !== "onetime" ? daysRemainingUntil(sourceHorizon(s, globalHorizon)) : null,
      total: computeSourceTotal(s, globalHorizon),
    }));
    const claimableTotal = bySource.reduce((sum, s) => sum + s.total, 0);

    return {
      pity, pullsToHardPity, astriteNeeded, shortfall, ownedPulls,
      todayTotal, todayPulls: Math.floor(todayTotal / ASTRITE_PER_PULL),
      bySource, claimableTotal, claimablePulls: Math.floor(claimableTotal / ASTRITE_PER_PULL),
    };
  }, [pityByBanner, calcBanner, ownedAstrite, astriteSources, globalHorizon]);

  function addAstriteSource() {
    setAstriteSources(prev => [
      ...prev,
      { id: `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "New source", kind: "daily", amount: 60, endsAt: "", claimedToday: false, claimedThisWeek: false, claimed: false },
    ]);
  }
  function updateAstriteSource(id, patch) {
    setAstriteSources(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeAstriteSource(id) {
    setAstriteSources(prev => prev.filter(s => s.id !== id));
  }

  const priorityChars = useMemo(
    () => CHARACTERS.filter(c => characterPriorities[c.id] === dashPriorityTier),
    [characterPriorities, dashPriorityTier]
  );
  const priorityWeapons = useMemo(
    () => WEAPONS.filter(w => weaponPriorities[w.id] === dashPriorityTier),
    [weaponPriorities, dashPriorityTier]
  );
  const ownedCharList = useMemo(
    () => CHARACTERS.filter(c => ownedCharacters[c.id]),
    [ownedCharacters]
  );
  const ownedWeaponList = useMemo(
    () => WEAPONS.filter(w => ownedWeapons[w.id]),
    [ownedWeapons]
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
            <button
              onClick={() => setSidebarOpen(true)}
              className="jk-notch-sm p-2.5"
              style={{ background: C.panel2, border: `1px solid ${C.border}` }}
              aria-label="Open menu"
            >
              <Menu size={20} color={C.ivory} />
            </button>
            <div className="flex items-center gap-2.5">
              <Sparkles size={24} color={C.gold} />
              <span className="font-black tracking-widest text-lg leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span className="jk-shimmer">JIN_KUN</span>
                <span style={{ color: C.ivoryDim }}>.INVENTORY</span>
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

        {activeTab === "owned" && (
          <OwnedCharactersTab
            ownedCharList={ownedCharList}
            onToggleOwned={toggleOwned}
          />
        )}

        {activeTab === "ownedWeapons" && (
          <OwnedWeaponsTab
            ownedWeaponList={ownedWeaponList}
            onToggleOwned={toggleOwnedWeapon}
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
            owned={ownedCharacters}
            onToggleOwned={toggleOwned}
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
            owned={ownedWeapons}
            onToggleOwned={toggleOwnedWeapon}
          />
        )}

        {activeTab === "convene" && (
          <TrackerTab
            bannerInsights={bannerInsights}
            trackerBanner={trackerBanner} setTrackerBanner={setTrackerBanner}
            bannerMeta={bannerMeta} setBannerMeta={setBannerMeta}
            selectedPullKey={selectedPullKey} setSelectedPullKey={setSelectedPullKey}
            markFiftyFifty={markFiftyFifty}
            importOpen={importOpen} setImportOpen={setImportOpen}
            conveneLink={conveneLink} setConveneLink={setConveneLink}
            conveneBusy={conveneBusy} handleLinkImport={handleLinkImport}
            conveneTargetBanner={conveneTargetBanner} setConveneTargetBanner={setConveneTargetBanner}
            jsonPaste={jsonPaste} setJsonPaste={setJsonPaste} handleJsonImport={handleJsonImport}
            manualBanner={manualBanner} setManualBanner={setManualBanner}
            manualRarity={manualRarity} setManualRarity={setManualRarity}
            manualName={manualName} setManualName={setManualName}
            handleManualAdd={handleManualAdd}
            pullHistory={pullHistory} handleClearHistory={handleClearHistory}
            handleRecalculate={handleRecalculate}
          />
        )}

        {activeTab === "analytics" && (
          <AstriteCalculatorTab
            calcBanner={calcBanner} setCalcBanner={setCalcBanner}
            ownedAstrite={ownedAstrite} setOwnedAstrite={setOwnedAstrite}
            astriteSources={astriteSources}
            addAstriteSource={addAstriteSource}
            updateAstriteSource={updateAstriteSource}
            removeAstriteSource={removeAstriteSource}
            astriteCalc={astriteCalc}
            globalHorizon={globalHorizon}
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
                data-active={active}
                className="jk-tabbtn flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
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
          onOpenOwned={() => { setActiveTab("owned"); setSidebarOpen(false); }}
          onOpenOwnedWeapons={() => { setActiveTab("ownedWeapons"); setSidebarOpen(false); }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
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
          <button onClick={() => setActiveTab("convene")} className="underline" style={{ color: C.starlight }}>Tracker</button> tab.
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
  const [detailItem, setDetailItem] = useState(null);
  const [detailKind, setDetailKind] = useState("character");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Crown size={18} color={C.gold} /> Pull Priorities
      </h1>

      <div className="jk-notch p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex gap-1.5">
          {TIERS.map(t => {
            const active = dashPriorityTier === t.id;
            const TierIcon = t.Icon;
            return (
              <button
                key={t.id}
                onClick={() => setDashPriorityTier(t.id)}
                className="jk-notch-sm flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 uppercase tracking-wide transition-all"
                style={{
                  background: active ? t.color : C.panel2,
                  color: active ? C.void : C.ivoryDim,
                  border: `1px solid ${active ? t.color : C.border}`,
                }}
              >
                <TierIcon size={13} />
                {t.id === "must" ? "Must" : t.label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] mt-2" style={{ color: C.ivoryDim }}>Tap a card for full details.</p>
      </div>

      {/* Characters — always shown, no toggle needed */}
      <div>
        <h2 className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: C.starlight }}>
          <Users size={13} /> Characters ({priorityChars.length})
        </h2>
        {priorityChars.length === 0 ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No characters flagged as "{activeTierMeta.label}" yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {priorityChars.map(c => (
              <div
                key={c.id}
                onClick={() => { setDetailItem(c); setDetailKind("character"); }}
                className="rounded-xl p-3 cursor-pointer active:opacity-80"
                style={{ background: C.panel, border: `1px solid ${activeTierMeta.color}55` }}
              >
                <Portrait name={c.name} image={c.image} rarity={c.rarity} color={ELEMENTS[c.element]?.color || C.starlight} />
                <div className="mt-2 text-sm font-semibold truncate">{c.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    <ElementBadge element={c.element} />
                    <WeaponBadge type={c.weaponType} />
                  </div>
                  <RarityStars rarity={c.rarity} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weapons — always shown, its own separate section below Characters */}
      <div>
        <h2 className="text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wide" style={{ color: C.starlight }}>
          <Package size={13} /> Weapons ({priorityWeapons.length})
        </h2>
        {priorityWeapons.length === 0 ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No weapons flagged as "{activeTierMeta.label}" yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {priorityWeapons.map(w => (
              <div
                key={w.id}
                onClick={() => { setDetailItem(w); setDetailKind("weapon"); }}
                className="rounded-xl p-3 cursor-pointer active:opacity-80"
                style={{ background: C.panel, border: `1px solid ${activeTierMeta.color}55` }}
              >
                <Portrait name={w.name} image={w.image} rarity={w.rarity} color={C.starlight} />
                <div className="mt-2 text-sm font-semibold truncate">{w.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <WeaponBadge type={w.type} />
                  <RarityStars rarity={w.rarity} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailItem && <DetailModal kind={detailKind} item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/* ============================================================================
   OWNED CHARACTERS TAB — a real portrait grid (not text cards) of every
   resonator you've marked as owned from the Resonators page. Tapping the
   check icon here un-marks them, mirroring the toggle on the roster card.
============================================================================ */
/* ============================================================================
   OWNED CHARACTERS TAB — a real portrait grid (not text cards) of every
   resonator you've marked as owned from the Resonators page. Tapping the
   check icon here un-marks them, mirroring the toggle on the roster card.
   Split into two fixed sub-tabs (5★ / 4★, not a scroll strip) so each
   rarity gets its own dedicated section and count.
============================================================================ */
function OwnedCharactersTab({ ownedCharList, onToggleOwned }) {
  const [ownedRarityTab, setOwnedRarityTab] = useState(5);
  const [detailItem, setDetailItem] = useState(null);

  const fiveStarOwned = ownedCharList.filter(c => c.rarity === 5);
  const fourStarOwned = ownedCharList.filter(c => c.rarity === 4);
  const shownList = ownedRarityTab === 5 ? fiveStarOwned : fourStarOwned;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <CheckCircle2 size={18} color={C.starlight} /> Owned Characters
        </h1>
        <span className="text-xs" style={{ color: C.ivoryDim }}>{ownedCharList.length} total</span>
      </div>
      <p className="text-xs mb-3" style={{ color: C.ivoryDim }}>Tap a card for signature weapon, echo, and team comp.</p>

      {/* Fixed two-way rarity switch — both sections always exist, never a scroll strip */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setOwnedRarityTab(5)}
          className="rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1.5"
          style={{
            background: ownedRarityTab === 5 ? C.five : C.panel,
            color: ownedRarityTab === 5 ? C.void : C.ivoryDim,
            border: `1px solid ${ownedRarityTab === 5 ? C.five : C.border}`,
          }}
        >
          5★ Characters <span style={{ opacity: 0.85 }}>({fiveStarOwned.length})</span>
        </button>
        <button
          onClick={() => setOwnedRarityTab(4)}
          className="rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1.5"
          style={{
            background: ownedRarityTab === 4 ? C.four : C.panel,
            color: ownedRarityTab === 4 ? C.void : C.ivoryDim,
            border: `1px solid ${ownedRarityTab === 4 ? C.four : C.border}`,
          }}
        >
          4★ Characters <span style={{ opacity: 0.85 }}>({fourStarOwned.length})</span>
        </button>
      </div>

      {shownList.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <p className="text-sm" style={{ color: C.ivoryDim }}>
            {ownedCharList.length === 0 ? (
              <>No characters marked as owned yet. Go to the <span style={{ color: C.starlight }}>Resonators</span> page and tap the check icon on a card to mark it owned.</>
            ) : (
              `No ${ownedRarityTab}★ characters owned yet.`
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shownList.map(c => (
            <div
              key={c.id}
              onClick={() => setDetailItem(c)}
              className="rounded-xl p-3 relative cursor-pointer active:opacity-80"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleOwned(c.id); }}
                className="absolute top-2 right-2 z-10 rounded-full p-1"
                style={{ background: C.starlight, border: `1px solid ${C.starlight}` }}
                title="Remove from owned"
              >
                <CheckCircle2 size={14} color={C.void} />
              </button>
              <Portrait name={c.name} image={c.image} rarity={c.rarity} color={ELEMENTS[c.element]?.color || C.starlight} />
              <div className="mt-2 text-sm font-semibold truncate">{c.name}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1">
                  <ElementBadge element={c.element} />
                  <WeaponBadge type={c.weaponType} />
                </div>
                <RarityStars rarity={c.rarity} />
              </div>
            </div>
          ))}
        </div>
      )}

      {detailItem && <DetailModal kind="character" item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/* ============================================================================
   OWNED WEAPONS TAB — same idea as Owned Characters (real portrait grid,
   tap to un-mark, tap card for info), but weapons don't split by rarity —
   just one list with a total count up top.
============================================================================ */
function OwnedWeaponsTab({ ownedWeaponList, onToggleOwned }) {
  const [detailItem, setDetailItem] = useState(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Package size={18} color={C.four} /> Owned Weapons
        </h1>
        <span className="text-xs" style={{ color: C.ivoryDim }}>{ownedWeaponList.length} owned</span>
      </div>
      <p className="text-xs mb-3" style={{ color: C.ivoryDim }}>Tap a card for info.</p>

      {ownedWeaponList.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <p className="text-sm" style={{ color: C.ivoryDim }}>
            No weapons marked as owned yet. Go to the <span style={{ color: C.starlight }}>Weapons</span> page and tap the check icon on a card to mark it owned.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {ownedWeaponList.map(w => (
            <div
              key={w.id}
              onClick={() => setDetailItem(w)}
              className="rounded-xl p-3 relative cursor-pointer active:opacity-80"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleOwned(w.id); }}
                className="absolute top-2 right-2 z-10 rounded-full p-1"
                style={{ background: C.starlight, border: `1px solid ${C.starlight}` }}
                title="Remove from owned"
              >
                <CheckCircle2 size={14} color={C.void} />
              </button>
              <Portrait name={w.name} image={w.image} rarity={w.rarity} color={C.starlight} />
              <div className="mt-2 text-sm font-semibold truncate">{w.name}</div>
              <div className="flex items-center justify-between mt-1">
                <WeaponBadge type={w.type} />
                <RarityStars rarity={w.rarity} />
              </div>
            </div>
          ))}
        </div>
      )}

      {detailItem && <DetailModal kind="weapon" item={detailItem} onClose={() => setDetailItem(null)} />}
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

function RosterGrid({ title, items, search, setSearch, priorities, setTier, kind, elementFilter, setElementFilter, weaponFilter, setWeaponFilter, owned, onToggleOwned }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const activeFilterCount = (kind === "character" && elementFilter !== "all" ? 1 : 0) + (weaponFilter !== "all" ? 1 : 0);
  const showOwnership = (kind === "character" || kind === "weapon") && typeof onToggleOwned === "function";

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h1 className="text-lg font-bold">{title}</h1>
        <span className="text-xs" style={{ color: C.ivoryDim }}>
          Tap a card for info · tap a tier chip to assign priority{showOwnership ? " · tap the check to mark owned" : ""}
        </span>
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
        {items.map(item => {
          const isOwned = showOwnership && !!owned?.[item.id];
          return (
            <div
              key={item.id}
              onClick={() => setDetailItem(item)}
              className="rounded-xl p-3 cursor-pointer active:opacity-80 relative"
              style={{
                background: C.panel,
                border: `1px solid ${isOwned ? C.borderSoft : C.border}`,
                opacity: isOwned ? 0.72 : 1,
                filter: isOwned ? "grayscale(0.55)" : "none",
                transition: "opacity .15s, filter .15s",
              }}
            >
              {showOwnership && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleOwned(item.id); }}
                  className="absolute top-2 right-2 z-10 rounded-full p-1"
                  style={{
                    background: isOwned ? C.starlight : `${C.void}AA`,
                    border: `1px solid ${isOwned ? C.starlight : C.border}`,
                  }}
                  title={isOwned ? "Remove from owned" : "Mark as owned"}
                >
                  <CheckCircle2 size={14} color={isOwned ? C.void : C.ivoryDim} />
                </button>
              )}
              {isOwned && (
                <span
                  className="absolute top-2 left-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: `${C.void}CC`, color: C.ivoryDim, border: `1px solid ${C.borderSoft}` }}
                >
                  Owned
                </span>
              )}
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
          );
        })}
        {items.length === 0 && (
          <p className="col-span-2 text-sm italic text-center py-8" style={{ color: C.ivoryDim }}>No matches.</p>
        )}
      </div>

      {detailItem && <DetailModal kind={kind} item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
}

/* ============================================================================
   TRACKER TAB — Wavemate-style Insights view: banner hero, real Astrite/
   winrate/pity stats, Radiant Tide allocation detail, Recent Convenes grid,
   plus the existing import tools (link/JSON/manual) folded into a panel.
============================================================================ */
function TrackerTab(props) {
  const {
    bannerInsights, trackerBanner, setTrackerBanner,
    bannerMeta, setBannerMeta,
    selectedPullKey, setSelectedPullKey,
    markFiftyFifty,
    importOpen, setImportOpen,
    conveneLink, setConveneLink, conveneBusy, handleLinkImport,
    conveneTargetBanner, setConveneTargetBanner,
    jsonPaste, setJsonPaste, handleJsonImport,
    manualBanner, setManualBanner, manualRarity, setManualRarity,
    manualName, setManualName, handleManualAdd,
    pullHistory, handleClearHistory, handleRecalculate,
  } = props;

  const banner = BANNERS.find(b => b.id === trackerBanner);
  const insights = bannerInsights[trackerBanner];
  const meta = bannerMeta[trackerBanner] || { featuredName: "", endsAt: "" };
  const featuredChar = meta.featuredName ? CHAR_BY_NAME[meta.featuredName.toLowerCase()] : null;
  const featuredWeapon = meta.featuredName ? WEAPON_BY_NAME[meta.featuredName.toLowerCase()] : null;

  function updateMeta(patch) {
    setBannerMeta(prev => ({ ...prev, [trackerBanner]: { ...(prev[trackerBanner] || {}), ...patch } }));
  }

  let remaining = null;
  if (meta.endsAt) {
    const diff = new Date(meta.endsAt).getTime() - Date.now();
    if (!isNaN(diff)) {
      remaining = diff <= 0 ? "Ended" : `${Math.floor(diff / 86400000)}d ${Math.floor((diff % 86400000) / 3600000)}h`;
    }
  }

  const selectedPull =
    insights.fiveStarsRecent.find(p => p.id === selectedPullKey) || insights.fiveStarsRecent[0] || null;
  const lastFour = insights.fiveStarsRecent.slice(0, 4).slice().reverse();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <History size={18} color={C.gold} /> Tracker
      </h1>

      {/* Hero */}
      <div className="jk-notch overflow-hidden relative" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="p-4 pb-2 flex items-start justify-between gap-2">
          <input
            value={meta.featuredName || ""}
            onChange={(e) => updateMeta({ featuredName: e.target.value })}
            placeholder="Featured character/weapon name…"
            className="bg-transparent text-sm font-bold outline-none border-b flex-1 pb-1"
            style={{ borderColor: C.borderSoft, color: C.ivory }}
          />
          <input
            type="datetime-local"
            value={meta.endsAt || ""}
            onChange={(e) => updateMeta({ endsAt: e.target.value })}
            className="text-[10px] px-1.5 py-1 rounded outline-none shrink-0"
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivoryDim }}
          />
        </div>
        {remaining && (
          <div className="px-4 mb-1">
            <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${C.rose}22`, color: C.rose }}>
              Remaining: {remaining}
            </span>
          </div>
        )}

        <div className="px-4 py-5 flex flex-col items-center">
          <Portrait
            name={meta.featuredName || banner.label}
            image={featuredChar?.image || featuredWeapon?.image || ""}
            rarity={5}
            color={featuredChar ? (ELEMENTS[featuredChar.element]?.color || C.gold) : C.gold}
            size="w-28 h-28"
          />
          <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
            {featuredChar && <ElementBadge element={featuredChar.element} />}
            {featuredWeapon && <WeaponBadge type={featuredWeapon.wtype} />}
            <span className="text-sm font-semibold">{meta.featuredName || "Set featured name above ↑"}</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-4 text-sm font-bold" style={{ color: C.starlight }}>
          {insights.pity}/{HARD_PITY}
        </div>
      </div>

      {/* Banner sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {BANNERS.map(b => {
          const active = trackerBanner === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setTrackerBanner(b.id)}
              className="jk-notch-sm px-3 py-2 text-xs font-bold whitespace-nowrap shrink-0"
              style={{
                background: active ? C.gold : C.panel2,
                color: active ? C.void : C.ivoryDim,
                border: `1px solid ${active ? C.gold : C.border}`,
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="jk-notch-sm p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>ASTRITE SPENT</div>
          <div className="text-xl font-bold mt-1">{insights.astrite.toLocaleString()}</div>
          <div className="text-[10px] mt-0.5" style={{ color: C.ivoryDim }}>{insights.totalPulls} pulls × {ASTRITE_PER_PULL}</div>
        </div>
        <div className="jk-notch-sm p-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>WIN RATE (50/50)</div>
          <div className="text-xl font-bold mt-1" style={{ color: C.rose }}>
            {insights.winrate === null ? "—" : `${insights.winrate}%`}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: C.ivoryDim }}>
            {trackerBanner === "char_event" ? "Featured Resonator only" : "N/A on this banner"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="jk-notch-sm p-3 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>TOTAL</div>
          <div className="text-lg font-bold mt-1">{insights.totalPulls}</div>
        </div>
        <div className="jk-notch-sm p-3 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>AVG.</div>
          <div className="text-lg font-bold mt-1" style={{ color: C.gold }}>{insights.avgPity || "—"}</div>
        </div>
        <div className="jk-notch-sm p-3 text-center" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>PITY</div>
          <div className="text-lg font-bold mt-1" style={{ color: C.starlight }}>{insights.pity}/{HARD_PITY}</div>
        </div>
      </div>

      {/* Radiant Tide allocation */}
      <div className="jk-notch p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <h2 className="text-sm font-bold mb-3">Radiant Tide Allocation</h2>
        {!selectedPull ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No 5★ pulls logged on this banner yet.</p>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Portrait
                name={selectedPull.name}
                image={CHAR_BY_NAME[selectedPull.name.toLowerCase()]?.image || WEAPON_BY_NAME[selectedPull.name.toLowerCase()]?.image || ""}
                rarity={5}
                color={C.gold}
                size="w-14 h-14"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm truncate">{selectedPull.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.panel2, color: C.ivoryDim }}>
                    S{selectedPull.dupeRank}
                  </span>
                </div>
                <div className="text-[11px] mt-1.5" style={{ color: C.ivoryDim }}>Radiant Tide</div>
                <div className="text-lg font-bold leading-tight" style={{ color: C.gold }}>{selectedPull.pityAtPull}</div>
                <div className="text-[11px] mt-1" style={{ color: C.ivoryDim }}>Astrite</div>
                <div className="text-sm font-semibold">
                  {(selectedPull.pityAtPull * ASTRITE_PER_PULL).toLocaleString()}
                </div>
              </div>
            </div>
            {lastFour.length > 1 && (
              <div className="flex items-end gap-1.5 h-24 shrink-0">
                {lastFour.map(p => {
                  const isSel = p.id === selectedPull.id;
                  const h = Math.max(8, Math.round((p.pityAtPull / HARD_PITY) * 88));
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPullKey(p.id)}
                      title={`${p.name} · pity ${p.pityAtPull}`}
                      style={{ width: 14, height: h, background: isSel ? C.gold : C.panel2, borderRadius: 3, border: `1px solid ${isSel ? C.gold : C.border}` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Convenes */}
      <div>
        <h2 className="text-sm font-bold mb-2">Recent Convenes ({insights.fiveStarCount})</h2>
        {insights.fiveStarsRecent.length === 0 ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No 5★ pulls yet — import your history below.</p>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {insights.fiveStarsRecent.slice(0, 30).map(p => {
              const tagWon = p.won50 === true;
              const tagLost = p.won50 === false;
              const badgeColor = p.pityAtPull >= 70 ? C.rose : p.pityAtPull >= 40 ? "#E8B34A" : C.starlight;
              const isSel = selectedPull?.id === p.id;
              // Auto-resolve portrait: matches this pull's name against your
              // character/weapon data by name, case-insensitively. As soon as
              // a character/weapon has an `image` set in data.js/weaponsData.js,
              // every past AND future pull with that name shows it automatically
              // — no manual per-pull work needed.
              const matchedChar = CHAR_BY_NAME[p.name.toLowerCase()];
              const matchedWeapon = WEAPON_BY_NAME[p.name.toLowerCase()];
              const pullImage = matchedChar?.image || matchedWeapon?.image || "";
              const pullColor = matchedChar ? (ELEMENTS[matchedChar.element]?.color || C.gold) : C.gold;
              return (
                <div
                  key={p.id}
                  className="relative rounded-lg overflow-hidden shrink-0 snap-start"
                  style={{ width: 108, border: `2px solid ${isSel ? C.gold : "transparent"}` }}
                >
                  <button onClick={() => setSelectedPullKey(p.id)} className="block w-full text-left">
                    <Portrait name={p.name} image={pullImage} rarity={5} color={pullColor} size="w-full aspect-square" />
                  </button>
                  <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: badgeColor, color: C.void }}>
                    {p.pityAtPull}
                  </span>
                  {(tagWon || tagLost) ? (
                    <span
                      className="absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5"
                      style={{ background: tagWon ? `${C.gold}CC` : `${C.rose}CC`, color: C.void }}
                    >
                      {tagWon ? "Rate On" : "Rate Off"}
                    </span>
                  ) : trackerBanner === "char_event" ? (
                    <div className="absolute bottom-0 inset-x-0 flex">
                      <button
                        onClick={() => markFiftyFifty(p.id, true)}
                        className="flex-1 text-[9px] font-bold py-0.5"
                        style={{ background: `${C.gold}AA`, color: C.void }}
                      >
                        Won
                      </button>
                      <button
                        onClick={() => markFiftyFifty(p.id, false)}
                        className="flex-1 text-[9px] font-bold py-0.5"
                        style={{ background: `${C.rose}AA`, color: C.void }}
                      >
                        Lost
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Import panel */}
      <button
        onClick={() => setImportOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 jk-notch-sm text-sm font-bold"
        style={{ background: C.gold, color: C.void }}
      >
        <Upload size={15} /> {importOpen ? "Hide Import" : "Import Convene History"}
      </button>

      {importOpen && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
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
              One link pulls every banner at once — Character Event, Weapon Event, and both Standard pools — and tags each pull correctly on its own. Direct fetch often gets blocked by the browser (CORS) since it's calling the game server straight from your device; if it fails, use the JSON paste option below with an exported record file instead.
            </p>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
            <label className="text-xs font-semibold" style={{ color: C.starlight }}>Or paste exported JSON</label>
            <label className="text-[11px] font-semibold block" style={{ color: C.ivoryDim }}>Fallback banner (only used if the JSON doesn't identify its own pool)</label>
            <select
              value={conveneTargetBanner}
              onChange={(e) => setConveneTargetBanner(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
            >
              {BANNERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
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
              <h2 className="text-sm font-bold" style={{ color: C.starlight }}>All Pulls ({pullHistory.length})</h2>
              {pullHistory.length > 0 && (
                <div className="flex items-center gap-3">
                  <button onClick={handleRecalculate} className="text-xs flex items-center gap-1" style={{ color: C.starlight }} title="Fix mistagged banners and recompute pity + 50/50 results">
                    <Sparkles size={12} /> Recalculate
                  </button>
                  <button onClick={handleClearHistory} className="text-xs flex items-center gap-1" style={{ color: C.rose }}>
                    <Trash2 size={12} /> Clear
                  </button>
                </div>
              )}
            </div>
            {pullHistory.length === 0 ? (
              <p className="text-sm italic" style={{ color: C.ivoryDim }}>No pulls imported yet.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {pullHistory.slice(0, 150).map(p => {
                  const bMeta = BANNERS.find(b => b.id === p.banner);
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
                          {bMeta && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${C.starlight}18`, color: C.starlight }}>
                              {bMeta.short}
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
      )}
    </div>
  );
}

/* ============================================================================
   ASTRITE CALCULATOR TAB
   Two real, automatic calculators — no manual arithmetic required anywhere:
   1. Pity → Astrite needed: pity is auto-pulled from the Tracker tab's live
      pity count for the chosen banner; only the Astrite you actually own is
      manual input (the app has no way to read your real in-game balance).
   2. Claimable Astrite: add your income sources once (daily/weekly/one-time
      + when they end); the app does all day/week counting against the real
      clock — including reusing the banner countdown you already set in the
      Tracker tab as a shared deadline, so you don't enter it twice.
============================================================================ */
function AstriteCalculatorTab(props) {
  const {
    calcBanner, setCalcBanner,
    ownedAstrite, setOwnedAstrite,
    astriteSources, addAstriteSource, updateAstriteSource, removeAstriteSource,
    astriteCalc, globalHorizon,
  } = props;

  const banner = BANNERS.find(b => b.id === calcBanner);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Sparkles size={18} color={C.gold} /> Astrite Calculator
      </h1>

      {/* ---------- Pity → Astrite needed ---------- */}
      <div className="jk-notch p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <h2 className="text-sm font-bold" style={{ color: C.starlight }}>Astrite to Guaranteed 5★</h2>

        <div>
          <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Banner (pity auto-filled from Tracker)</label>
          <select
            value={calcBanner}
            onChange={(e) => setCalcBanner(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
          >
            {BANNERS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="jk-notch-sm p-3 text-center" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>CURRENT PITY (AUTO)</div>
            <div className="text-lg font-bold mt-1" style={{ color: C.starlight }}>{astriteCalc.pity}/{HARD_PITY}</div>
          </div>
          <div>
            <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Astrite you currently own</label>
            <input
              type="number"
              min={0}
              value={ownedAstrite}
              onChange={(e) => setOwnedAstrite(Math.max(0, Number(e.target.value) || 0))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
            />
          </div>
        </div>

        <div className="pt-2 space-y-1.5" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: C.ivoryDim }}>Pulls to hard pity on {banner.label}</span>
            <span className="font-bold">{astriteCalc.pullsToHardPity}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: C.ivoryDim }}>Astrite needed</span>
            <span className="font-bold" style={{ color: C.gold }}>
              {astriteCalc.astriteNeeded.toLocaleString()} <span className="font-normal text-xs" style={{ color: C.ivoryDim }}>({astriteCalc.pullsToHardPity} pulls)</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: C.ivoryDim }}>You own</span>
            <span className="font-semibold">
              {ownedAstrite.toLocaleString()} <span className="font-normal text-xs" style={{ color: C.ivoryDim }}>({astriteCalc.ownedPulls} pulls)</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="font-bold">{astriteCalc.shortfall > 0 ? "Still need" : "Surplus"}</span>
            <span className="font-bold" style={{ color: astriteCalc.shortfall > 0 ? C.rose : C.five }}>
              {astriteCalc.shortfall > 0
                ? <>{astriteCalc.shortfall.toLocaleString()} <span className="font-normal text-xs" style={{ color: C.ivoryDim }}>({Math.ceil(astriteCalc.shortfall / ASTRITE_PER_PULL)} pulls)</span></>
                : <>{(ownedAstrite - astriteCalc.astriteNeeded).toLocaleString()} <span className="font-normal text-xs" style={{ color: C.ivoryDim }}>({Math.floor((ownedAstrite - astriteCalc.astriteNeeded) / ASTRITE_PER_PULL)} pulls spare)</span></>
              }
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Claimable Astrite from sources/events ---------- */}
      <div className="jk-notch p-4 space-y-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: C.starlight }}>Claimable Astrite</h2>
          <button onClick={addAstriteSource} className="flex items-center gap-1 text-xs font-semibold" style={{ color: C.gold }}>
            <Plus size={13} /> Add source
          </button>
        </div>
        <p className="text-[11px]" style={{ color: C.ivoryDim }}>
          Add each income source once — the app counts the real days/weeks left automatically.
          {globalHorizon ? ` Sources with no end date of their own use your nearest Tracker banner countdown (${fmtDate(globalHorizon)}).` : " Set an end date per source, or set a banner countdown in the Tracker tab to share one automatically."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="jk-notch-sm p-3 text-center" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="text-[10px] font-semibold" style={{ color: C.ivoryDim }}>TODAY</div>
            <div className="text-lg font-bold mt-1">
              {astriteCalc.todayTotal.toLocaleString()} <span className="text-xs font-normal" style={{ color: C.ivoryDim }}>({astriteCalc.todayPulls})</span>
            </div>
          </div>
          <div className="jk-notch-sm p-3 text-center" style={{ background: `${C.gold}14`, border: `1px solid ${C.gold}55` }}>
            <div className="text-[10px] font-semibold" style={{ color: C.gold }}>TOTAL CLAIMABLE</div>
            <div className="text-lg font-bold mt-1" style={{ color: C.gold }}>
              {astriteCalc.claimableTotal.toLocaleString()} <span className="text-xs font-normal" style={{ color: C.ivoryDim }}>({astriteCalc.claimablePulls} pulls)</span>
            </div>
          </div>
        </div>

        {astriteSources.length === 0 ? (
          <p className="text-sm italic" style={{ color: C.ivoryDim }}>No sources yet — add dailies, weekly challenges, or one-time event rewards.</p>
        ) : (
          <div className="space-y-2">
            {astriteCalc.bySource.map(s => (
              <div key={s.id} className="jk-notch-sm p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={s.name}
                    onChange={(e) => updateAstriteSource(s.id, { name: e.target.value })}
                    className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-dashed pb-0.5"
                    style={{ borderColor: C.borderSoft, color: C.ivory }}
                  />
                  <button onClick={() => removeAstriteSource(s.id)}><Trash2 size={13} color={C.rose} /></button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={s.kind}
                    onChange={(e) => updateAstriteSource(s.id, { kind: e.target.value })}
                    className="px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.ivory }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="onetime">One-time</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={s.amount}
                    onChange={(e) => updateAstriteSource(s.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-20 px-2 py-1.5 rounded text-xs outline-none"
                    style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.ivory }}
                  />
                  <span className="text-[10px]" style={{ color: C.ivoryDim }}>Astrite / {s.kind === "onetime" ? "reward" : s.kind === "daily" ? "day" : "week"}</span>

                  {s.kind !== "onetime" && (
                    <input
                      type="date"
                      value={s.endsAt || ""}
                      onChange={(e) => updateAstriteSource(s.id, { endsAt: e.target.value })}
                      placeholder="uses banner countdown"
                      className="px-2 py-1.5 rounded text-xs outline-none"
                      style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.ivoryDim }}
                    />
                  )}

                  {s.kind === "daily" && (
                    <label className="flex items-center gap-1 text-[11px]" style={{ color: C.ivoryDim }}>
                      <input type="checkbox" checked={!!s.claimedToday} onChange={(e) => updateAstriteSource(s.id, { claimedToday: e.target.checked })} />
                      Claimed today
                    </label>
                  )}
                  {s.kind === "weekly" && (
                    <label className="flex items-center gap-1 text-[11px]" style={{ color: C.ivoryDim }}>
                      <input type="checkbox" checked={!!s.claimedThisWeek} onChange={(e) => updateAstriteSource(s.id, { claimedThisWeek: e.target.checked })} />
                      Claimed this week
                    </label>
                  )}
                  {s.kind === "onetime" && (
                    <label className="flex items-center gap-1 text-[11px]" style={{ color: C.ivoryDim }}>
                      <input type="checkbox" checked={!!s.claimed} onChange={(e) => updateAstriteSource(s.id, { claimed: e.target.checked })} />
                      Already claimed
                    </label>
                  )}
                </div>

                <div className="text-[11px] mt-2" style={{ color: C.ivoryDim }}>
                  {s.kind === "onetime" ? (
                    <>Contributes <span style={{ color: C.gold }}>{s.total.toLocaleString()}</span> {s.claimed && "(claimed — counted as 0)"}</>
                  ) : (
                    <>
                      {s.remainingDays} day{s.remainingDays === 1 ? "" : "s"} left
                      {s.kind === "weekly" && ` (${Math.floor(s.remainingDays / 7)} reset${Math.floor(s.remainingDays / 7) === 1 ? "" : "s"})`}
                      {" → "}
                      <span style={{ color: C.gold }}>{s.total.toLocaleString()}</span> Astrite ({Math.floor(s.total / ASTRITE_PER_PULL)} pulls)
                    </>
                  )}
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
function Sidebar({ onClose, username, wallpaperUrl, wallpaperBusy, fileInputRef, onPickWallpaper, onWallpaperFile, onRemoveWallpaper, onOpenAuth, onLogout, onOpenPriorities, onOpenOwned, onOpenOwnedWeapons, activeTab, setActiveTab }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-72 max-w-[85vw] h-full p-4 overflow-y-auto jk-notch" style={{ background: C.panel, borderRight: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-base" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span className="jk-shimmer">jin_kun</span>
          </span>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>

        <nav className="space-y-1 mb-5">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide jk-notch-sm"
                style={{ background: active ? C.panel2 : "transparent", color: active ? C.gold : C.ivoryDim }}
              >
                <Icon size={17} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onOpenOwned}
          className="w-full flex items-center gap-2.5 px-3 py-3 jk-notch-sm text-sm font-semibold mb-2"
          style={{ background: `${C.starlight}14`, border: `1px solid ${C.starlight}55`, color: C.starlight }}
        >
          <CheckCircle2 size={17} /> Owned Characters
        </button>

        <button
          onClick={onOpenOwnedWeapons}
          className="w-full flex items-center gap-2.5 px-3 py-3 jk-notch-sm text-sm font-semibold mb-2"
          style={{ background: `${C.four}14`, border: `1px solid ${C.four}55`, color: C.four }}
        >
          <Package size={17} /> Owned Weapons
        </button>

        <button
          onClick={onOpenPriorities}
          className="w-full flex items-center gap-2.5 px-3 py-3 jk-notch-sm text-sm font-semibold mb-5"
          style={{ background: `${C.gold}14`, border: `1px solid ${C.gold}55`, color: C.gold }}
        >
          <ListChecks size={17} /> Pull Priorities
        </button>

        {!username && (
          <button
            onClick={() => onOpenAuth("login")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 jk-notch-sm text-sm font-semibold mb-5"
            style={{ border: `1px solid ${C.gold}66`, color: C.gold }}
          >
            <LogIn size={15} /> Sign In
          </button>
        )}

        <h3 className="text-xs font-bold mb-2" style={{ color: C.starlight }}>APPEARANCE</h3>
        <div className="jk-notch-sm p-3 mb-5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
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
          <div className="jk-notch-sm p-3" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} color={C.starlight} />
              <span className="text-sm font-semibold">{username}</span>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold" style={{ border: `1px solid ${C.rose}66`, color: C.rose }}>
              <LogOut size={13} /> Log Out
            </button>
          </div>
        ) : (
          <div className="jk-notch-sm p-3 space-y-2" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.ivoryDim }}>Guest mode — nothing is saved.</p>
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
      <div className="w-full max-w-sm jk-notch p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold">
            <span className="jk-shimmer">jin_kun</span> <span style={{ color: C.ivoryDim, fontWeight: 500 }}>inventory</span>
          </h2>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.ivoryDim }}>
          {mode === "login" ? "Sign in to sync your data" : "Create your Rover profile"}
        </p>

        <div className="flex mb-4 jk-notch-sm overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <button
            onClick={() => setMode("login")}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wide"
            style={{ background: mode === "login" ? C.panel2 : "transparent", color: mode === "login" ? C.gold : C.ivoryDim }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wide"
            style={{ background: mode === "signup" ? C.panel2 : "transparent", color: mode === "signup" ? C.gold : C.ivoryDim }}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.starlightDim} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="jk-input"
              autoCapitalize="none"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.starlightDim} />
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="jk-input"
              style={{ paddingRight: 36 }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {showPw ? <EyeOff size={15} color={C.ivoryDim} /> : <Eye size={15} color={C.ivoryDim} />}
            </button>
          </div>
          {mode === "signup" && (
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={C.starlightDim} />
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="jk-input"
              />
            </div>
          )}

          {error && <p className="text-xs" style={{ color: "#E38FA8" }}>{error}</p>}

          <button
            onClick={onSubmit}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 jk-notch-sm text-sm font-bold disabled:opacity-60"
            style={{ background: C.gold, color: C.void }}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : mode === "login" ? <LogIn size={15} /> : <UserPlus size={15} />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
