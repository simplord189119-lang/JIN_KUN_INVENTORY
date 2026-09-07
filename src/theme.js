/* ============================================================================
   THEME — shared design tokens, extracted out of App.jsx so new files
   (CharactersContext, CharacterFormModal, SyncConfirmModal) can import them
   without creating a circular import with App.jsx.

   App.jsx now imports C / ELEMENTS / WEAPON_TYPES from here instead of
   defining them locally — nothing about their values changed.
============================================================================ */
export const C = {
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

export const ELEMENTS = {
  Aero: { color: "#7FE0C6", code: "AE" },
  Glacio: { color: "#8FD3FF", code: "GL" },
  Electro: { color: "#C9A6FF", code: "EL" },
  Fusion: { color: "#FF9A6C", code: "FU" },
  Havoc: { color: "#E36BA0", code: "HA" },
  Spectro: { color: "#F4D35E", code: "SP" },
};

export const WEAPON_TYPES = {
  Sword: "SW", Broadblade: "BB", Pistols: "PI", Gauntlets: "GA", Rectifier: "RE",
};
