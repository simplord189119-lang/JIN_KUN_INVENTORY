/**
 * SyncConfirmModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown after "Check for Updates" returns.
 *
 * Displays a list of characters found in the remote API that aren't yet in
 * Firestore. User ticks which ones to add, then clicks Confirm.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import {
  X, CheckCircle2, RefreshCw, Loader2, Sparkles, AlertCircle,
  Wind, Snowflake, Flame, Zap, Crosshair, Sun,
  Sword, Swords, Target, Hand, Wand2,
} from "lucide-react";
import { useCharacters } from "../../contexts/CharactersContext";

const ELEMENTS = {
  aero:    { color: "#6FE3C4", Icon: Wind },
  glacio:  { color: "#7FD8F5", Icon: Snowflake },
  fusion:  { color: "#FF7A45", Icon: Flame },
  electro: { color: "#B98AF5", Icon: Zap },
  havoc:   { color: "#E0485B", Icon: Crosshair },
  spectro: { color: "#F5D567", Icon: Sun },
};
const WEAPONS = {
  broadblade: { Icon: Swords },
  sword:      { Icon: Sword },
  pistols:    { Icon: Target },
  gauntlets:  { Icon: Hand },
  rectifier:  { Icon: Wand2 },
};

export default function SyncConfirmModal({ onClose }) {
  const { syncResults, confirmNewCharacters, clearSyncResults } = useCharacters();
  const [selected, setSelected] = useState(() =>
    new Set((syncResults?.newChars ?? []).map((c) => c.id))
  );
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  const newChars = syncResults?.newChars ?? [];
  const total    = syncResults?.total    ?? 0;

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const handleConfirm = async () => {
    setSaving(true);
    const toAdd = newChars.filter((c) => selected.has(c.id));
    await confirmNewCharacters(toAdd);
    setSaving(false);
    setDone(true);
  };

  const handleClose = () => { clearSyncResults(); onClose(); };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{
          background: "linear-gradient(155deg,rgba(20,27,37,0.98),rgba(10,13,18,0.99))",
          border: "1px solid rgba(127,216,245,0.18)",
          clipPath: "polygon(0 16px,16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%)",
          boxShadow: "0 0 0 1px rgba(255,248,210,0.05),0 40px 100px rgba(0,0,0,0.85)",
          animation: "wt-rise 0.32s ease-out both",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <RefreshCw size={15} style={{ color: "#7FD8F5" }} />
            <span className="font-bold tracking-wider text-sm" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
              UPDATE CHECK RESULTS
            </span>
          </div>
          <button onClick={handleClose} className="text-slate-500 p-1"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ scrollbarWidth:"thin" }}>
          {done ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={36} style={{ color: "#6FE3C4" }} />
              <div className="font-semibold text-lg" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
                {selected.size} Resonator{selected.size !== 1 ? "s" : ""} Added
              </div>
              <p className="text-sm text-slate-400">
                They've been added to the roster as <span className="text-cyan-300">Upcoming</span>. Mark them released when the banner drops.
              </p>
              <button onClick={handleClose}
                className="mt-2 px-5 py-2 rounded text-sm font-semibold"
                style={{ background: "#F2C84B", color: "#000" }}>
                Done
              </button>
            </div>
          ) : newChars.length === 0 ? (
            /* ── No new characters ── */
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Sparkles size={32} className="text-slate-600" />
              <div className="font-semibold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>
                Roster is up to date
              </div>
              <p className="text-xs text-slate-500">
                The API returned {total} characters — none are new compared to your Firestore collection.<br/>
                Add characters manually with the <strong>+ Add</strong> button if needed.
              </p>
            </div>
          ) : (
            /* ── New characters list ── */
            <>
              <div className="flex items-center gap-2 p-3 rounded border border-cyan-300/20 bg-cyan-300/5">
                <AlertCircle size={13} style={{ color:"#7FD8F5" }} className="shrink-0" />
                <p className="text-xs text-slate-300">
                  Found <strong>{newChars.length}</strong> new resonator{newChars.length !== 1 ? "s" : ""} from the remote API.
                  Tick the ones you want to add, then click <strong>Confirm</strong>.
                </p>
              </div>

              <div className="space-y-2">
                {newChars.map((char) => {
                  const el  = ELEMENTS[char.element];
                  const wpn = WEAPONS[char.weapon];
                  const on  = selected.has(char.id);

                  return (
                    <button key={char.id} type="button"
                      onClick={() => toggle(char.id)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded text-left transition-all"
                      style={{
                        background: on ? "rgba(242,200,75,0.08)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${on ? "rgba(242,200,75,0.4)" : "rgba(255,255,255,0.07)"}`,
                      }}>
                      {/* Checkbox */}
                      <div className="w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all"
                        style={{ borderColor: on ? "#F2C84B" : "rgba(255,255,255,0.2)", background: on ? "rgba(242,200,75,0.2)" : "transparent" }}>
                        {on && <CheckCircle2 size={11} style={{ color:"#F2C84B" }} />}
                      </div>

                      {/* Element dot */}
                      {el && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: el.color }} />}

                      {/* Name */}
                      <span className="flex-1 text-sm font-medium">{char.name}</span>

                      {/* Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {el && <el.Icon size={13} style={{ color: el.color }} />}
                        {wpn && <wpn.Icon size={13} className="text-slate-500" />}
                        <span className="text-xs" style={{ color: char.rarity === 5 ? "#F2C84B" : "#C89BF5" }}>{char.rarity}★</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Select all / none */}
              <div className="flex gap-3 text-xs">
                <button onClick={() => setSelected(new Set(newChars.map(c => c.id)))} className="text-cyan-300/70 hover:text-cyan-300">Select all</button>
                <button onClick={() => setSelected(new Set())} className="text-slate-500 hover:text-slate-300">Deselect all</button>
              </div>
            </>
          )}
        </div>

        {/* Footer — only shown when there are characters to confirm */}
        {!done && newChars.length > 0 && (
          <div className="flex gap-3 px-6 py-4 border-t border-white/8 shrink-0">
            <button onClick={handleClose}
              className="flex-1 py-2.5 rounded text-sm border border-white/12 text-slate-400 hover:border-white/25 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={saving || selected.size === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,rgba(242,200,75,0.9),rgba(196,150,42,0.9))", color:"#000" }}>
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />}
              Confirm {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
