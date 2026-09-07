/**
 * Roster.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic character roster wired to the live Firestore collection via
 * CharactersContext.
 *
 * What's new vs the old static version
 * ─────────────────────────────────────
 * • Characters come from Firestore (real-time, editable)
 * • Admin bar: "+ Add Resonator" and "Check for Updates" buttons
 * • Each card: hover reveals Edit (pencil) and Delete (trash) icons
 * • "Mark Released" button for upcoming characters
 * • Loading / seeding / error states handled
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import {
  Search, Plus, RefreshCw, Loader2, Trash2, Pencil, CheckCircle2,
  ImagePlus, Check, Star, Shield, Wind, Snowflake, Flame, Zap,
  Crosshair, Sun, Sword, Swords, Target, Hand, Wand2, AlertCircle,
} from "lucide-react";
import { useCharacters } from "../contexts/CharactersContext";
import CharacterFormModal from "../components/admin/CharacterFormModal";
import SyncConfirmModal  from "../components/admin/SyncConfirmModal";

/* ── shared element / weapon data ── */
const ELEMENTS = {
  aero:    { label:"Aero",    color:"#6FE3C4", Icon:Wind },
  glacio:  { label:"Glacio",  color:"#7FD8F5", Icon:Snowflake },
  fusion:  { label:"Fusion",  color:"#FF7A45", Icon:Flame },
  electro: { label:"Electro", color:"#B98AF5", Icon:Zap },
  havoc:   { label:"Havoc",   color:"#E0485B", Icon:Crosshair },
  spectro: { label:"Spectro", color:"#F5D567", Icon:Sun },
};
const WTYPES = {
  broadblade:{ label:"Broadblade", Icon:Swords },
  sword:     { label:"Sword",      Icon:Sword },
  pistols:   { label:"Pistols",    Icon:Target },
  gauntlets: { label:"Gauntlets",  Icon:Hand },
  rectifier: { label:"Rectifier",  Icon:Wand2 },
};
const TIERS = [
  { id:"must", label:"Must", color:"#F2C84B" },
  { id:"high", label:"High", color:"#7FD8F5" },
  { id:"low",  label:"Low",  color:"#8A96A6" },
];

/* ─────────────────────────────────────────────────────────────────────────── */

export default function Roster({ charPriorities, onSetPriority, customImages, onSetCustomImage }) {
  const {
    characters, loading, seeding, syncing, syncResults, error,
    addCharacter, updateCharacter, deleteCharacter, markReleased,
    checkForUpdates, clearError,
  } = useCharacters();

  /* filter state */
  const [query,    setQuery]    = useState("");
  const [element,  setElement]  = useState("all");
  const [weapon,   setWeapon]   = useState("all");
  const [rarity,   setRarity]   = useState("all");
  const [priOnly,  setPriOnly]  = useState(false);

  /* modal state */
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);  // character object to edit
  const [syncOpen,     setSyncOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);  // id to delete

  /* filtered list */
  const filtered = useMemo(() => characters.filter(c => {
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (element !== "all" && c.element !== element) return false;
    if (weapon  !== "all" && c.weapon  !== weapon)  return false;
    if (rarity  !== "all" && String(c.rarity) !== rarity) return false;
    if (priOnly && !charPriorities[c.id]) return false;
    return true;
  }), [characters, query, element, weapon, rarity, priOnly, charPriorities]);

  /* open sync modal when results arrive */
  const handleCheckUpdates = async () => {
    await checkForUpdates();
    setSyncOpen(true);
  };

  const selCls =
    "bg-transparent border border-white/10 rounded px-2.5 py-1.5 text-[11px] uppercase tracking-wide focus:outline-none focus:border-cyan-300/40 text-slate-300";

  /* ── loading / seed state ── */
  if (loading || seeding) return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2 size={32} className="animate-spin" style={{ color:"#F2C84B" }} />
      <div className="text-sm text-slate-400" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
        {seeding ? "Seeding initial character data…" : "Loading roster…"}
      </div>
    </div>
  );

  return (
    <div className="space-y-4" style={{ animation:"wt-rise 0.36s ease-out both" }}>

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
          Resonator Roster
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {filtered.length} of {characters.length} resonators · live from Firestore
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded border border-rose-400/25 bg-rose-400/5 text-xs text-rose-300">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="shrink-0"><X size={13} /></button>
        </div>
      )}

      {/* ── Admin action bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold tracking-wide uppercase"
          style={{
            background: "linear-gradient(135deg,rgba(242,200,75,0.9),rgba(196,150,42,0.9))",
            color: "#000",
            clipPath: "polygon(0 6px,6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)",
            fontFamily: "'Rajdhani',sans-serif",
          }}>
          <Plus size={15} /> Add Resonator
        </button>

        <button onClick={handleCheckUpdates} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-sm tracking-wide uppercase border border-cyan-300/30 text-cyan-300 disabled:opacity-50 hover:bg-cyan-300/5 transition-colors"
          style={{
            clipPath: "polygon(0 6px,6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)",
            fontFamily: "'Rajdhani',sans-serif",
          }}>
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {syncing ? "Checking…" : "Check for Updates"}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 p-3 rounded border border-white/8"
        style={{ background:"rgba(20,27,37,0.7)" }}>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 flex-1 min-w-[150px]">
          <Search size={13} className="text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search resonators…"
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-slate-600" />
        </div>
        <select value={element} onChange={e => setElement(e.target.value)} className={selCls}>
          <option value="all">All Elements</option>
          {Object.entries(ELEMENTS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={weapon} onChange={e => setWeapon(e.target.value)} className={selCls}>
          <option value="all">All Weapons</option>
          {Object.entries(WTYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={rarity} onChange={e => setRarity(e.target.value)} className={selCls}>
          <option value="all">All Rarities</option>
          <option value="5">5★</option>
          <option value="4">4★</option>
        </select>
        <button onClick={() => setPriOnly(v => !v)}
          className="px-2.5 py-1.5 rounded text-[11px] uppercase tracking-wide border transition-colors"
          style={{
            border: priOnly ? "1px solid rgba(242,200,75,0.5)" : "1px solid rgba(255,255,255,0.1)",
            color:  priOnly ? "#F2C84B" : "#6A7585",
            background: priOnly ? "rgba(242,200,75,0.08)" : "transparent",
            fontFamily: "'Rajdhani',sans-serif",
          }}>
          Flagged only
        </button>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(c => (
          <CharacterCard
            key={c.id}
            c={c}
            priority={charPriorities[c.id]}
            customImg={customImages[c.id]}
            onSetPriority={onSetPriority}
            onSetCustomImage={onSetCustomImage}
            onEdit={() => setEditTarget(c)}
            onDelete={() => setDeleteTarget(c.id)}
            onMarkReleased={() => markReleased(c.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center text-slate-600 text-sm py-12">
          No resonators match those filters.
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <DeleteConfirm
          id={deleteTarget}
          characters={characters}
          onConfirm={async () => { await deleteCharacter(deleteTarget); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Add modal ── */}
      {addOpen && (
        <CharacterFormModal
          onClose={() => setAddOpen(false)}
          onSave={addCharacter}
        />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <CharacterFormModal
          character={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(data) => updateCharacter(editTarget.id, data)}
        />
      )}

      {/* ── Sync results modal ── */}
      {syncOpen && syncResults && (
        <SyncConfirmModal onClose={() => setSyncOpen(false)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Character Card                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function CharacterCard({ c, priority, customImg, onSetPriority, onSetCustomImage, onEdit, onDelete, onMarkReleased }) {
  const el       = ELEMENTS[c.element] ?? {};
  const [imgFail, setImgFail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState("");

  const src     = customImg || c.img;
  const showImg = src && !imgFail;
  const tierCfg = TIERS.find(t => t.id === priority);

  const openImgEdit = e => { e.stopPropagation(); setDraft(src || ""); setEditing(true); };
  const saveImgEdit = e => {
    e.stopPropagation();
    onSetCustomImage(c.id, draft.trim() || null);
    setImgFail(false);
    setEditing(false);
  };

  return (
    <div
      className="relative overflow-hidden group transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(155deg,rgba(20,27,37,0.93),rgba(10,13,18,0.97))",
        border: priority ? `1px solid ${tierCfg.color}66` : "1px solid rgba(127,216,245,0.10)",
        clipPath: "polygon(0 12px,12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)",
        boxShadow: priority ? `0 0 18px ${tierCfg.color}18` : undefined,
      }}
    >
      {/* Portrait */}
      <div className="aspect-[3/4] relative flex items-end p-3"
        style={{ background: showImg ? "#090c11" : `linear-gradient(160deg,${el.color || "#7FD8F5"}35,#090c11 72%)` }}>

        {showImg && (
          <img src={src} alt={c.name} onError={() => setImgFail(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition:"50% 12%" }} />
        )}

        {/* Bottom fade */}
        {showImg && (
          <div className="absolute inset-0"
            style={{ background:"linear-gradient(180deg,rgba(9,12,17,0) 40%,rgba(9,12,17,0.95) 100%)" }} />
        )}

        {/* Element glyph fallback */}
        {!showImg && el.Icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <el.Icon size={56} style={{ color: el.color, opacity:0.28 }} />
          </div>
        )}

        {/* Stars */}
        <div className="absolute top-2 left-2 flex gap-0.5">
          {Array.from({ length: c.rarity }).map((_, i) => (
            <Star key={i} size={10} fill={c.rarity === 5 ? "#F2C84B" : "#C89BF5"}
              style={{ color: c.rarity === 5 ? "#F2C84B" : "#C89BF5" }} />
          ))}
        </div>

        {/* Upcoming badge */}
        {c.upcoming && !editing && (
          <div className="absolute top-2 right-8">
            <span className="text-[9px] px-1.5 py-0.5 rounded border border-cyan-300/25 text-cyan-300"
              style={{ background:"rgba(127,216,245,0.10)", fontFamily:"'Rajdhani',sans-serif" }}>
              SOON
            </span>
          </div>
        )}

        {/* Admin overlay buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={openImgEdit} title="Portrait URL"
            className="w-6 h-6 rounded-full bg-black/60 border border-white/15 flex items-center justify-center">
            <ImagePlus size={9} className="text-slate-200" />
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} title="Edit"
            className="w-6 h-6 rounded-full bg-black/60 border border-white/15 flex items-center justify-center">
            <Pencil size={9} className="text-slate-200" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete"
            className="w-6 h-6 rounded-full bg-black/60 border border-rose-400/30 flex items-center justify-center">
            <Trash2 size={9} className="text-rose-400" />
          </button>
        </div>

        {/* Image URL editor */}
        {editing && (
          <div className="absolute inset-0 z-10 bg-black/90 flex flex-col justify-center gap-2 p-3"
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] text-slate-400 uppercase tracking-wide" style={{ fontFamily:"'Rajdhani',sans-serif" }}>Portrait URL</div>
            <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="https://…"
              className="w-full bg-white/5 border border-white/20 rounded px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-cyan-300/50 placeholder:text-slate-600" />
            <div className="flex gap-1.5">
              <button onClick={saveImgEdit}
                className="flex-1 py-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1"
                style={{ background:"#F2C84B", color:"#000", fontFamily:"'Rajdhani',sans-serif" }}>
                <Check size={10} />Save
              </button>
              <button onClick={e => { e.stopPropagation(); setEditing(false); }}
                className="flex-1 py-1.5 rounded border border-white/20 text-[10px] text-slate-400"
                style={{ fontFamily:"'Rajdhani',sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Name + badges */}
        <div className="relative z-[5] w-full">
          <div className="font-semibold text-sm leading-tight truncate" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
            {c.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {el.Icon && (
              <span className="inline-flex items-center justify-center rounded-full"
                style={{ width:22, height:22, background:`${el.color}22`, border:`1px solid ${el.color}55` }}>
                <el.Icon size={11} style={{ color:el.color }} />
              </span>
            )}
            {WTYPES[c.weapon]?.Icon && (
              <span className="inline-flex items-center justify-center rounded-full w-5 h-5 bg-white/5 border border-white/10">
                {React.createElement(WTYPES[c.weapon].Icon, { size:11, className:"text-slate-300" })}
              </span>
            )}
            {c.version && (
              <span className="text-[9px] text-slate-600 ml-auto">v{c.version}</span>
            )}
          </div>
        </div>
      </div>

      {/* Mark released button for upcoming */}
      {c.upcoming && (
        <button onClick={() => onMarkReleased(c.id)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] border-b border-white/8 text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-300/5 transition-colors"
          style={{ fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.05em" }}>
          <CheckCircle2 size={10} /> Mark Released
        </button>
      )}

      {/* Priority tier buttons */}
      <div className="grid grid-cols-3 border-t border-white/8">
        {TIERS.map(tier => {
          const active = priority === tier.id;
          return (
            <button key={tier.id}
              onClick={() => onSetPriority(c.id, active ? null : tier.id)}
              className="py-1.5 text-[10px] uppercase tracking-wide transition-colors"
              style={{
                color:      active ? tier.color : "#3A4555",
                background: active ? `${tier.color}18` : "transparent",
                fontFamily: "'Rajdhani',sans-serif",
              }}
              title={tier.label}>
              {tier.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Delete Confirmation                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function DeleteConfirm({ id, characters, onConfirm, onCancel }) {
  const char = characters.find(c => c.id === id);
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-xs p-6 space-y-4"
        style={{
          background: "linear-gradient(155deg,rgba(20,27,37,0.98),rgba(10,13,18,0.99))",
          border: "1px solid rgba(224,72,91,0.35)",
          clipPath: "polygon(0 12px,12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)",
          animation: "wt-rise 0.28s ease-out both",
        }}>
        <div className="text-sm font-semibold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
          Remove <span className="text-rose-300">{char?.name}</span> from the roster?
        </div>
        <p className="text-xs text-slate-500">This removes the character from Firestore for all users. Pull priority data for this character will also be lost.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded border border-white/12 text-sm text-slate-400">Cancel</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm(); }}
            disabled={loading}
            className="flex-1 py-2 rounded text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
            style={{ background:"rgba(224,72,91,0.2)", border:"1px solid rgba(224,72,91,0.4)", color:"#E0485B" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove
          </button>
        </div>
      </div>
    </div>
  );
}
