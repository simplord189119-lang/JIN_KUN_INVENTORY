/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root component.
 *
 * Provider order
 * ──────────────
 * AuthProvider        → Firebase Auth state
 *   AppProvider       → user app data (priorities, pulls, settings) in Firestore
 *     CharactersProvider → live Firestore characters collection
 *       <App UI>
 *
 * To plug in your existing TopBar, MobileNav, PriorityPanel, Backdrop, etc.
 * just replace the placeholder <Layout> import below with your own components.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { AuthProvider, useAuth }           from "./contexts/AuthContext";
import { CharactersProvider }              from "./contexts/CharactersContext";
import Roster                              from "./pages/Roster";

/* ── Inline minimal app-state context (replace with your full AppContext) ── */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ──────────────────────────────────────────────────────────────────────────
   AppState — wraps character / weapon priorities and pull history.
   Replace this with your existing AppContext if you have one.
   ────────────────────────────────────────────────────────────────────────── */
function AppStateProvider({ children }) {
  const { user } = useAuth();

  const [charPriorities,  setCharPrioritiesRaw]  = useState({});
  const [weaponPriorities, setWeaponPrioritiesRaw] = useState({});
  const [customImages,    setCustomImagesRaw]     = useState({});
  const [pulls,           setPullsRaw]            = useState([]);
  const [settings,        setSettingsRaw]         = useState({ background:"fleurdelys", reduceMotion:false });

  /* Persist to localStorage for guests / cloud for signed-in users
     (wire your own Firestore sync here if needed) */
  const PREFIX = user ? `jk_${user.uid}` : "jk_guest";

  useEffect(() => {
    try {
      const cfg  = JSON.parse(localStorage.getItem(`${PREFIX}_cfg`)  || "{}");
      const pl   = JSON.parse(localStorage.getItem(`${PREFIX}_pulls`) || "[]");
      if (cfg.charPriorities)   setCharPrioritiesRaw(cfg.charPriorities);
      if (cfg.weaponPriorities) setWeaponPrioritiesRaw(cfg.weaponPriorities);
      if (cfg.customImages)     setCustomImagesRaw(cfg.customImages);
      if (cfg.settings)         setSettingsRaw(s => ({ ...s, ...cfg.settings }));
      if (Array.isArray(pl))    setPullsRaw(pl);
    } catch (_) {}
  }, [PREFIX]);

  const save = useCallback((extra = {}) => {
    try {
      localStorage.setItem(`${PREFIX}_cfg`, JSON.stringify({
        charPriorities, weaponPriorities, customImages, settings, ...extra
      }));
    } catch (_) {}
  }, [PREFIX, charPriorities, weaponPriorities, customImages, settings]);

  useEffect(() => { save(); }, [charPriorities, weaponPriorities, customImages, settings]);
  useEffect(() => {
    try { localStorage.setItem(`${PREFIX}_pulls`, JSON.stringify(pulls)); } catch (_) {}
  }, [pulls, PREFIX]);

  const setCharPriority = useCallback((id, tier) =>
    setCharPrioritiesRaw(p => { const n={...p}; tier ? n[id]=tier : delete n[id]; return n; }), []);
  const setWeaponPriority = useCallback((id, tier) =>
    setWeaponPrioritiesRaw(p => { const n={...p}; tier ? n[id]=tier : delete n[id]; return n; }), []);
  const setCustomImage = useCallback((id, url) =>
    setCustomImagesRaw(p => { const n={...p}; url ? n[id]=url : delete n[id]; return n; }), []);

  return (
    <AppCtx.Provider value={{
      charPriorities, setCharPriority,
      weaponPriorities, setWeaponPriority,
      customImages, setCustomImage,
      pulls, setPulls: setPullsRaw,
      settings, setSettings: setSettingsRaw,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Inner App — rendered inside all providers
   ────────────────────────────────────────────────────────────────────────── */
function InnerApp() {
  const { charPriorities, setCharPriority, customImages, setCustomImage } = useApp();

  /* In your real app you'll have more tabs/pages here.
     For now just show the roster with dynamic characters. */
  return (
    <div style={{ minHeight:"100vh", padding:"24px", maxWidth:1400, margin:"0 auto" }}>
      <Roster
        charPriorities={charPriorities}
        onSetPriority={setCharPriority}
        customImages={customImages}
        onSetCustomImage={setCustomImage}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Root export
   ────────────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <CharactersProvider>
          <InnerApp />
        </CharactersProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}
