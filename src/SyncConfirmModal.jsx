import React, { useEffect, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { C } from "./theme.js";
import { useCharacters } from "./CharactersContext.jsx";

/* "Check for Updates" flow: fetch candidates, let the admin tick which ones
   to add, write only the confirmed ones. Nothing touches Firestore until
   Confirm is pressed. */
export default function SyncConfirmModal({ onClose }) {
  const { checkForUpdates, confirmAddCharacters, syncBusy, syncError } = useCharacters();
  const [candidates, setCandidates] = useState(null); // null = not fetched yet
  const [picked, setPicked] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkForUpdates().then((list) => {
      if (cancelled) return;
      setCandidates(list);
      setPicked(Object.fromEntries(list.map((c) => [c.id, true])));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id) {
    setPicked((p) => ({ ...p, [id]: !p[id] }));
  }

  async function handleConfirm() {
    const chosen = (candidates || []).filter((c) => picked[c.id]);
    if (!chosen.length) { onClose(); return; }
    setSaving(true);
    try {
      await confirmAddCharacters(chosen);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000099" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.panel, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold flex items-center gap-2"><Sparkles size={16} color={C.gold} /> Check for Updates</h2>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.ivoryDim }}>
          Compares your roster against an external database and lists anyone not already in it. Nothing is added until you confirm below.
        </p>

        {syncBusy && (
          <div className="flex items-center gap-2 py-6 justify-center" style={{ color: C.ivoryDim }}>
            <Loader2 size={16} className="animate-spin" /> Checking…
          </div>
        )}

        {!syncBusy && syncError && (
          <div className="rounded-lg p-3 text-xs" style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}44`, color: C.rose }}>
            {syncError}
            <p className="mt-2" style={{ color: C.ivoryDim }}>
              You can still add new characters manually with "+ Add Resonator" — ask me to look up the current roster and I'll tell you who's missing.
            </p>
          </div>
        )}

        {!syncBusy && !syncError && candidates && candidates.length === 0 && (
          <p className="text-sm italic py-4 text-center" style={{ color: C.ivoryDim }}>Your roster is already up to date.</p>
        )}

        {!syncBusy && !syncError && candidates && candidates.length > 0 && (
          <>
            <div className="space-y-2 mb-4">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer"
                  style={{ background: C.panel2, border: `1px solid ${C.border}` }}
                >
                  <input type="checkbox" checked={!!picked[c.id]} onChange={() => toggle(c.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-[10px]" style={{ color: C.ivoryDim }}>
                      {[c.element, c.weaponType, c.rarity ? `${c.rarity}★` : null, c.version].filter(Boolean).join(" · ") || "Details unconfirmed — edit after adding"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-60"
              style={{ background: C.gold, color: C.void }}
            >
              {saving ? "Adding…" : `Add Selected (${Object.values(picked).filter(Boolean).length})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
