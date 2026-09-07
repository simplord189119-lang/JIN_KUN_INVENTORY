import React, { useState } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { C, ELEMENTS, WEAPON_TYPES } from "./theme.js";
import { useCharacters } from "./CharactersContext.jsx";

const ELEMENT_NAMES = Object.keys(ELEMENTS);
const WEAPON_TYPE_NAMES = Object.keys(WEAPON_TYPES);

/* Add/edit modal for a single character. Pass `character` to edit an
   existing one, or omit it to create a new one. */
export default function CharacterFormModal({ character, onClose }) {
  const { addCharacter, updateCharacter, deleteCharacter } = useCharacters();
  const isEdit = !!character;

  const [name, setName] = useState(character?.name || "");
  const [element, setElement] = useState(character?.element || ELEMENT_NAMES[0]);
  const [weaponType, setWeaponType] = useState(character?.weaponType || WEAPON_TYPE_NAMES[0]);
  const [rarity, setRarity] = useState(character?.rarity || 5);
  const [image, setImage] = useState(character?.image || "");
  const [version, setVersion] = useState(character?.version || "");
  const [standard, setStandard] = useState(!!character?.standard);
  const [upcoming, setUpcoming] = useState(!!character?.upcoming);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Convenience: auto-fill a Prydwen CDN portrait guess when the name field
  // is left and no image has been set yet. It's a guess, not a guarantee —
  // Prydwen's slug doesn't always match ours 1:1, so it's easy to overwrite.
  function handleNameBlur() {
    if (image.trim() || !name.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setImage(`https://cdn.prydwen.gg/wuthering-waves/characters/${slug}_icon.webp`);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Enter a name."); return; }
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        element, weaponType,
        rarity: Number(rarity),
        image: image.trim(),
        version: version.trim(),
        standard, upcoming,
      };
      if (isEdit) {
        await updateCharacter(character.id, payload);
      } else {
        await addCharacter(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${character.name}? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteCharacter(character.id);
      onClose();
    } catch (err) {
      setError(err.message || "Delete failed.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000099" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: C.panel, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">{isEdit ? `Edit ${character.name}` : "Add Resonator"}</h2>
          <button onClick={onClose}><X size={18} color={C.ivoryDim} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Element</label>
              <select
                value={element}
                onChange={(e) => setElement(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              >
                {ELEMENT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Weapon Type</label>
              <select
                value={weaponType}
                onChange={(e) => setWeaponType(e.target.value)}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              >
                {WEAPON_TYPE_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Rarity</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(Number(e.target.value))}
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              >
                <option value={5}>5★</option>
                <option value={4}>4★</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 3.5"
                className="w-full mt-1 px-2 py-2 rounded-lg text-sm outline-none"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold" style={{ color: C.ivoryDim }}>Portrait Image URL</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.ivory }}
            />
            <p className="text-[10px] mt-1" style={{ color: C.ivoryDim }}>Auto-guessed from the name (Prydwen CDN) — double check it actually loads, then override if not.</p>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs" style={{ color: C.ivoryDim }}>
              <input type="checkbox" checked={standard} onChange={(e) => setStandard(e.target.checked)} /> Standard banner
            </label>
            <label className="flex items-center gap-1.5 text-xs" style={{ color: C.ivoryDim }}>
              <input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Upcoming (not released)
            </label>
          </div>

          {error && <p className="text-xs" style={{ color: "#E38FA8" }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-semibold disabled:opacity-50"
                style={{ border: `1px solid ${C.rose}66`, color: C.rose }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm font-bold disabled:opacity-60"
              style={{ background: C.gold, color: C.void }}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Add Resonator"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
