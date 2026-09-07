/**
 * CharacterFormModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable modal for:
 *   • Adding a brand-new character
 *   • Editing an existing character's attributes
 *
 * Props
 * ─────
 *   character   – existing character object (for edit mode) | null (add mode)
 *   onClose     – () => void
 *   onSave      – (formData) => Promise<void>  (parent decides add vs update)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from "react";
import {
  X, Check, Loader2, ImagePlus, AlertCircle,
  Wind, Snowflake, Flame, Zap, Crosshair, Sun,
  Sword, Swords, Target, Hand, Wand2, Star,
  UserPlus, Pencil, Hash, Image, Package,
} from "lucide-react";

/* ── Data ── */
const ELEMENTS = {
  aero:    { label: "Aero",    color: "#6FE3C4", Icon: Wind },
  glacio:  { label: "Glacio",  color: "#7FD8F5", Icon: Snowflake },
  fusion:  { label: "Fusion",  color: "#FF7A45", Icon: Flame },
  electro: { label: "Electro", color: "#B98AF5", Icon: Zap },
  havoc:   { label: "Havoc",   color: "#E0485B", Icon: Crosshair },
  spectro: { label: "Spectro", color: "#F5D567", Icon: Sun },
};
const WEAPONS = {
  broadblade: { label: "Broadblade", Icon: Swords },
  sword:      { label: "Sword",      Icon: Sword },
  pistols:    { label: "Pistols",    Icon: Target },
  gauntlets:  { label: "Gauntlets",  Icon: Hand },
  rectifier:  { label: "Rectifier",  Icon: Wand2 },
};

const BLANK = {
  name: "", element: "", weapon: "", rarity: 5,
  img: "", version: "", standard: false, upcoming: false,
};

/* ─────────────────────────────────────────────────────────────────────────── */

export default function CharacterFormModal({ character = null, onClose, onSave }) {
  const isEdit = !!character;
  const [form, setForm] = useState(isEdit ? { ...character } : { ...BLANK });
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef();

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /* Validate */
  const validate = () => {
    if (!form.name.trim())    return "Name is required.";
    if (!form.element)        return "Select an element.";
    if (!form.weapon)         return "Select a weapon type.";
    if (![4,5].includes(Number(form.rarity))) return "Rarity must be 4 or 5.";
    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        rarity: Number(form.rarity),
        name:   form.name.trim(),
        img:    form.img.trim(),
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  /* Auto-fill image URL from prydwen CDN when name changes */
  const handleNameBlur = () => {
    if (form.img) return; // don't overwrite a manually entered URL
    const slug = form.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (slug) set("img", `https://cdn.prydwen.gg/wuthering-waves/characters/${slug}_icon.webp`);
  };

  const el  = ELEMENTS[form.element];
  const wpn = WEAPONS[form.weapon];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-none"
        style={{
          background: "linear-gradient(155deg,rgba(20,27,37,0.98),rgba(10,13,18,0.99))",
          border: "1px solid rgba(127,216,245,0.18)",
          clipPath: "polygon(0 16px,16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)",
          boxShadow: "0 0 0 1px rgba(255,248,210,0.06),0 40px 100px rgba(0,0,0,0.8)",
          animation: "wt-rise 0.32s ease-out both",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {isEdit
              ? <Pencil size={16} style={{ color: "#7FD8F5" }} />
              : <UserPlus size={16} style={{ color: "#F2C84B" }} />}
            <span className="font-bold tracking-wider text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
              {isEdit ? `EDIT — ${character.name}` : "ADD NEW RESONATOR"}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Preview strip */}
          <div className="flex items-center gap-4 p-3 rounded"
            style={{ background: el ? `${el.color}14` : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Portrait preview */}
            <div className="w-16 h-16 rounded overflow-hidden shrink-0 relative flex items-center justify-center"
              style={{ background: el ? `${el.color}22` : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {form.img && !imgError
                ? <img src={form.img} alt={form.name} onError={() => setImgError(true)} onLoad={() => setImgError(false)}
                    className="w-full h-full object-cover" style={{ objectPosition:"50% 15%" }} />
                : el
                  ? <el.Icon size={28} style={{ color: el.color, opacity: 0.5 }} />
                  : <ImagePlus size={22} className="text-slate-600" />}
            </div>
            <div>
              <div className="font-semibold text-base" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
                {form.name || <span className="text-slate-600 italic">Character name</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {el && <span className="text-xs flex items-center gap-1" style={{ color: el.color }}><el.Icon size={11} />{el.label}</span>}
                {wpn && <span className="text-xs flex items-center gap-1 text-slate-400"><wpn.Icon size={11} />{wpn.label}</span>}
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: Number(form.rarity) || 1 }).map((_, i) => (
                    <Star key={i} size={10} fill={form.rarity === 5 ? "#F2C84B" : "#C89BF5"}
                      style={{ color: form.rarity === 5 ? "#F2C84B" : "#C89BF5" }} />
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* ── Name ── */}
          <div>
            <Label icon={<Hash size={12} />}>Character Name *</Label>
            <input
              ref={nameRef}
              value={form.name}
              onChange={e => { set("name", e.target.value); setImgError(false); }}
              onBlur={handleNameBlur}
              placeholder="e.g. Cartethyia"
              className="w-full bg-white/5 border border-white/12 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-300/50 placeholder:text-slate-700"
            />
            <p className="text-[10px] text-slate-600 mt-1">Blurring auto-fills the Prydwen CDN portrait URL.</p>
          </div>

          {/* ── Element picker ── */}
          <div>
            <Label>Element *</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ELEMENTS).map(([key, el]) => (
                <button key={key} type="button"
                  onClick={() => set("element", key)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded text-xs transition-all"
                  style={{
                    border: form.element === key ? `1px solid ${el.color}` : "1px solid rgba(255,255,255,0.08)",
                    background: form.element === key ? `${el.color}18` : "rgba(255,255,255,0.03)",
                    color: form.element === key ? el.color : "#6A7585",
                  }}>
                  <el.Icon size={14} style={{ color: el.color }} />{el.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Weapon picker ── */}
          <div>
            <Label>Weapon Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(WEAPONS).map(([key, wpn]) => (
                <button key={key} type="button"
                  onClick={() => set("weapon", key)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded text-xs transition-all"
                  style={{
                    border: form.weapon === key ? "1px solid rgba(127,216,245,0.7)" : "1px solid rgba(255,255,255,0.08)",
                    background: form.weapon === key ? "rgba(127,216,245,0.1)" : "rgba(255,255,255,0.03)",
                    color: form.weapon === key ? "#7FD8F5" : "#6A7585",
                  }}>
                  <wpn.Icon size={14} />{wpn.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Rarity + Version ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rarity *</Label>
              <div className="flex gap-2">
                {[4, 5].map(r => (
                  <button key={r} type="button"
                    onClick={() => set("rarity", r)}
                    className="flex-1 py-2 rounded text-sm font-semibold transition-all"
                    style={{
                      border: form.rarity === r
                        ? `1px solid ${r === 5 ? "#F2C84B" : "#C89BF5"}`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: form.rarity === r
                        ? `${r === 5 ? "#F2C84B" : "#C89BF5"}18`
                        : "rgba(255,255,255,0.03)",
                      color: form.rarity === r
                        ? (r === 5 ? "#F2C84B" : "#C89BF5")
                        : "#6A7585",
                    }}>
                    {r}★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label icon={<Package size={12} />}>Version</Label>
              <input
                value={form.version}
                onChange={e => set("version", e.target.value)}
                placeholder="e.g. 2.2"
                className="w-full bg-white/5 border border-white/12 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-300/50 placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* ── Image URL ── */}
          <div>
            <Label icon={<Image size={12} />}>Portrait Image URL</Label>
            <input
              value={form.img}
              onChange={e => { set("img", e.target.value); setImgError(false); }}
              placeholder="https://cdn.prydwen.gg/wuthering-waves/characters/…_icon.webp"
              className="w-full bg-white/5 border border-white/12 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-300/50 placeholder:text-slate-700"
            />
            <p className="text-[10px] text-slate-600 mt-1">Leave blank to use the auto-filled Prydwen CDN URL.</p>
          </div>

          {/* ── Toggles ── */}
          <div className="flex gap-4">
            {[
              { key:"standard", label:"Standard pool" },
              { key:"upcoming", label:"Upcoming / unconfirmed" },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => set(key, !form[key])}
                className="flex items-center gap-2 text-xs transition-colors"
                style={{ color: form[key] ? "#7FD8F5" : "#4A5568" }}>
                <div className="w-4 h-4 rounded border flex items-center justify-center"
                  style={{ borderColor: form[key] ? "#7FD8F5" : "rgba(255,255,255,0.15)", background: form[key] ? "rgba(127,216,245,0.15)" : "transparent" }}>
                  {form[key] && <Check size={10} style={{ color: "#7FD8F5" }} />}
                </div>
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-300 p-2.5 rounded border border-rose-400/25 bg-rose-400/5">
              <AlertCircle size={13} className="shrink-0" />{error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded text-sm border border-white/12 text-slate-400 hover:border-white/25 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,rgba(242,200,75,0.9),rgba(196,150,42,0.9))",
                color: "#000",
                clipPath: "polygon(0 6px,6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%)",
              }}>
              {saving
                ? <Loader2 size={15} className="animate-spin" />
                : isEdit ? <Pencil size={15} /> : <UserPlus size={15} />}
              {isEdit ? "Save Changes" : "Add Resonator"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tiny label helper ── */
function Label({ icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400 mb-2"
      style={{ fontFamily: "'Rajdhani',sans-serif" }}>
      {icon}{children}
    </div>
  );
}
