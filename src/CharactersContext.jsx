import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { CHARACTERS as STATIC_CHARACTERS } from "./data.js";

/* ============================================================================
   ADMIN GATE
   Only this one Firebase Auth UID may add/edit/delete characters or confirm
   roster updates. This constant is checked client-side (to show/hide the
   admin toolbar) AND must be mirrored in firestore.rules — the client-side
   check alone is not security, it's just UI; Firestore enforces the real
   restriction.

   HOW TO FIND YOUR UID:
   1. Log into your own account on the deployed site.
   2. Open the browser console and run: firebase.auth().currentUser?.uid
      — or, easier: go to the Firebase Console → Authentication → Users tab,
      find the row for your account (its email will look like
      "yourusername@users.jinkuninventory.app"), and copy the "User UID"
      column value.
   3. Paste it below AND into firestore.rules where indicated.
============================================================================ */
export const ADMIN_UID = "PASTE_YOUR_FIREBASE_UID_HERE";

const CharactersCtx = createContext(null);

/* Firestore doc shape (collection: "characters", doc id = slug):
     id, name, element ("Aero"...), weaponType ("Sword"...), rarity (4|5),
     image, standard (bool), upcoming (bool), version ("3.5"), createdAt, updatedAt
   This matches data.js's existing field names exactly (element/weaponType/
   image), unlike the old zip's lowercase element/weapon/img — so the rest
   of App.jsx (ElementBadge, WeaponBadge, Portrait, RosterGrid, DetailModal)
   works completely unchanged against dynamic characters. */

export function CharactersProvider({ children }) {
  const [characters, setCharacters] = useState(STATIC_CHARACTERS); // instant, non-empty first paint
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(auth.currentUser?.uid || null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");

  const isAdmin = !!uid && uid === ADMIN_UID;

  // Track auth uid locally too (App.jsx already tracks it, but this context
  // is usable independently and shouldn't rely on prop-drilling for the gate).
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid || null));
    return () => unsub();
  }, []);

  // Real-time listener on the "characters" collection. On first-ever run
  // (empty collection — brand new Firestore project), seed it once from the
  // existing static data.js roster so nothing is lost and every future
  // change becomes dynamic/shared instead of requiring a redeploy.
  useEffect(() => {
    const colRef = collection(db, "characters");
    const unsub = onSnapshot(
      colRef,
      async (snap) => {
        if (snap.empty) {
          try {
            const batch = writeBatch(db);
            STATIC_CHARACTERS.forEach((c) => {
              batch.set(doc(db, "characters", c.id), {
                ...c,
                standard: !!c.standard,
                upcoming: !!c.upcoming,
                version: c.version || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
            // onSnapshot fires again automatically once the batch commits.
          } catch {
            // Seeding failed (e.g. rules not deployed yet) — fall back to
            // the static list so the app still works, just not dynamically.
            setCharacters(STATIC_CHARACTERS);
            setLoading(false);
          }
          return;
        }
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.version || "").localeCompare(b.version || "") || a.name.localeCompare(b.name));
        setCharacters(list);
        setLoading(false);
      },
      () => {
        // Firestore read failed (offline, rules, etc.) — degrade to static.
        setCharacters(STATIC_CHARACTERS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const addCharacter = useCallback(async (char) => {
    if (!isAdmin) throw new Error("Not authorized.");
    const id = char.id || char.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await setDoc(doc(db, "characters", id), {
      ...char,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  }, [isAdmin]);

  const updateCharacter = useCallback(async (id, patch) => {
    if (!isAdmin) throw new Error("Not authorized.");
    await setDoc(doc(db, "characters", id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  }, [isAdmin]);

  const deleteCharacter = useCallback(async (id) => {
    if (!isAdmin) throw new Error("Not authorized.");
    await deleteDoc(doc(db, "characters", id));
  }, [isAdmin]);

  /* Best-effort external sync. The exact Hakushin WW endpoint/shape is NOT
     independently verified — their documented API wrapper explicitly does
     not cover Wuthering Waves, so this may 404, CORS-fail, or return a
     different shape than expected. It's wrapped defensively: any failure
     surfaces a clear error instead of crashing, and nothing is written to
     Firestore until you review + confirm the diff in SyncConfirmModal. */
  const checkForUpdates = useCallback(async () => {
    setSyncBusy(true);
    setSyncError("");
    try {
      const res = await fetch("https://api.hakush.in/ww/data/en/character.json");
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const raw = await res.json();
      const entries = Array.isArray(raw) ? raw : Object.values(raw || {});
      const known = new Set(characters.map((c) => c.id));
      const candidates = entries
        .map((e) => {
          const name = e.name || e.charName || e.EN || e.en;
          if (!name) return null;
          const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          if (known.has(id)) return null;
          return {
            id,
            name,
            element: e.element || e.attribute || "",
            weaponType: e.weapon || e.weaponType || "",
            rarity: Number(e.rarity || e.star || 5),
            image: e.icon || e.image || "",
            upcoming: true,
            version: e.version || "",
          };
        })
        .filter(Boolean);
      return candidates; // caller (SyncConfirmModal) shows these for review
    } catch (err) {
      setSyncError(
        err.message === "Failed to fetch"
          ? "Couldn't reach the Hakushin API — it may not support Wuthering Waves at this endpoint, or the request was blocked by CORS."
          : `Sync failed: ${err.message}`
      );
      return [];
    } finally {
      setSyncBusy(false);
    }
  }, [characters]);

  const confirmAddCharacters = useCallback(async (picked) => {
    if (!isAdmin) throw new Error("Not authorized.");
    const batch = writeBatch(db);
    picked.forEach((c) => {
      batch.set(doc(db, "characters", c.id), {
        ...c,
        upcoming: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }, [isAdmin]);

  const value = useMemo(() => ({
    characters, loading, isAdmin,
    addCharacter, updateCharacter, deleteCharacter,
    checkForUpdates, confirmAddCharacters, syncBusy, syncError,
  }), [characters, loading, isAdmin, addCharacter, updateCharacter, deleteCharacter, checkForUpdates, confirmAddCharacters, syncBusy, syncError]);

  return <CharactersCtx.Provider value={value}>{children}</CharactersCtx.Provider>;
}

export function useCharacters() {
  const ctx = useContext(CharactersCtx);
  if (!ctx) throw new Error("useCharacters must be used inside <CharactersProvider>");
  return ctx;
}
