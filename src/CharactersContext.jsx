/**
 * CharactersContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the character roster.
 *
 * Features
 * ────────
 * 1. Real-time Firestore listener  →  all users see edits instantly
 * 2. Auto-seed on first launch      →  seeds INITIAL_CHARACTERS if collection empty
 * 3. Add / Edit / Delete            →  full CRUD via CharacterFormModal
 * 4. Remote sync                    →  "Check for Updates" fetches the
 *    Hakushin community API and surfaces new/changed characters to confirm
 *
 * Firestore collection: `characters`
 * Firestore doc ID    : character slug  (e.g. "cartethyia")
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import {
  collection, doc, onSnapshot,
  setDoc, updateDoc, deleteDoc,
  writeBatch, query, orderBy,
  serverTimestamp, getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import INITIAL_CHARACTERS from "../data/initialCharacters";

/* ── Hakushin community API ── */
const HAKUSHIN_URL =
  "https://api.hakush.in/ww/data/en/character.json";

/* ── element / weapon lookup tables for API normalisation ── */
const EL_MAP = {
  aero: "aero", glacio: "glacio", fusion: "fusion",
  electro: "electro", havoc: "havoc", spectro: "spectro",
  wind: "aero", ice: "glacio", fire: "fusion",
  thunder: "electro", dark: "havoc", light: "spectro",
};
const WPN_MAP = {
  broadblade: "broadblade", sword: "sword", pistols: "pistols",
  gauntlets: "gauntlets", rectifier: "rectifier",
  broadSword: "broadblade", handgun: "pistols",
};
function normaliseElement(raw = "") { return EL_MAP[raw.toLowerCase()] ?? raw.toLowerCase(); }
function normaliseWeapon(raw = "")  { return WPN_MAP[raw.toLowerCase()] ?? raw.toLowerCase(); }

/* ── slug helper ── */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/* ── Context ── */
const CharactersCtx = createContext(null);
export const useCharacters = () => useContext(CharactersCtx);

/* ─────────────────────────────────────────────────────────────────────────── */

export function CharactersProvider({ children }) {
  const [characters, setCharacters]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [seeding, setSeeding]         = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncResults, setSyncResults] = useState(null); // { newChars, updatedChars }
  const [error, setError]             = useState(null);

  const colRef = collection(db, "characters");

  /* ── 1. Real-time listener ─────────────────────────────────────────────── */
  useEffect(() => {
    const q = query(colRef, orderBy("rarity", "desc"), orderBy("name", "asc"));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          // First run — seed the collection
          await seedInitialData();
        } else {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCharacters(docs);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Characters listener error:", err);
        setError("Could not reach the character database. Check your Firebase rules.");
        setLoading(false);
      }
    );

    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 2. Seed initial data ──────────────────────────────────────────────── */
  async function seedInitialData() {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      INITIAL_CHARACTERS.forEach((char) => {
        const ref = doc(db, "characters", char.id);
        batch.set(ref, {
          ...char,
          standard:  char.standard  ?? false,
          upcoming:  char.upcoming  ?? false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Seed error:", err);
      setError("Failed to seed initial character data.");
    } finally {
      setSeeding(false);
    }
  }

  /* ── 3. Add character ──────────────────────────────────────────────────── */
  const addCharacter = useCallback(async (charData) => {
    const id = charData.id || toSlug(charData.name);
    await setDoc(doc(db, "characters", id), {
      ...charData,
      id,
      standard:  charData.standard  ?? false,
      upcoming:  charData.upcoming  ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  }, []);

  /* ── 4. Update character ───────────────────────────────────────────────── */
  const updateCharacter = useCallback(async (id, updates) => {
    await updateDoc(doc(db, "characters", id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }, []);

  /* ── 5. Delete character ───────────────────────────────────────────────── */
  const deleteCharacter = useCallback(async (id) => {
    await deleteDoc(doc(db, "characters", id));
  }, []);

  /* ── 6. Mark upcoming → released ──────────────────────────────────────── */
  const markReleased = useCallback(async (id) => {
    await updateDoc(doc(db, "characters", id), {
      upcoming:  false,
      updatedAt: serverTimestamp(),
    });
  }, []);

  /* ── 7. Remote sync: Hakushin API ──────────────────────────────────────── */
  const checkForUpdates = useCallback(async () => {
    setSyncing(true);
    setSyncResults(null);
    setError(null);

    try {
      /* Fetch remote character list */
      const res  = await fetch(HAKUSHIN_URL);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const raw  = await res.json();

      /* Snapshot current Firestore IDs */
      const snap        = await getDocs(colRef);
      const existingIds = new Set(snap.docs.map((d) => d.id));

      /* Parse Hakushin response
         Format: { [id]: { name, element, weapon, rarity, ... } } */
      const remoteChars = Object.entries(raw)
        .map(([_apiId, data]) => {
          const name = data.name ?? data.Name ?? "";
          if (!name) return null;

          const id      = toSlug(name);
          const element = normaliseElement(data.element ?? data.Element ?? "");
          const weapon  = normaliseWeapon(data.weapon  ?? data.Weapon  ?? "");
          const rarity  = Number(data.rarity ?? data.Rarity ?? data.quality ?? 4);

          return { id, name, element, weapon, rarity };
        })
        .filter(Boolean);

      /* Diff: find genuinely new characters not in Firestore */
      const newChars = remoteChars.filter(
        (c) =>
          !existingIds.has(c.id) &&
          c.element && c.weapon &&
          [4, 5].includes(c.rarity)
      );

      setSyncResults({ newChars, total: remoteChars.length });
    } catch (err) {
      console.error("Sync error:", err);
      setError(
        `Could not reach the update API: ${err.message}. ` +
        `You can still add characters manually.`
      );
      setSyncResults({ newChars: [], total: 0 });
    } finally {
      setSyncing(false);
    }
  }, []);

  /* ── 8. Confirm and write new characters from sync ─────────────────────── */
  const confirmNewCharacters = useCallback(async (selectedChars) => {
    if (!selectedChars.length) return;
    const batch = writeBatch(db);
    selectedChars.forEach((char) => {
      const ref = doc(db, "characters", char.id);
      batch.set(ref, {
        ...char,
        standard:  false,
        upcoming:  true,    // newly confirmed = upcoming until released
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    setSyncResults(null);
  }, []);

  /* ─────────────────────────────────────────────────────────────────────── */
  const value = {
    characters,
    loading,
    seeding,
    syncing,
    syncResults,
    error,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    markReleased,
    checkForUpdates,
    confirmNewCharacters,
    clearSyncResults: () => setSyncResults(null),
    clearError:       () => setError(null),
  };

  return (
    <CharactersCtx.Provider value={value}>
      {children}
    </CharactersCtx.Provider>
  );
}
