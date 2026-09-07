# Dynamic Character System — Integration Guide

## What these files add

| File | Purpose |
|---|---|
| `src/data/initialCharacters.js` | Full roster seed (50+ characters) |
| `src/contexts/CharactersContext.jsx` | Firestore real-time listener + CRUD + Hakushin API sync |
| `src/components/admin/CharacterFormModal.jsx` | Add / Edit modal with element/weapon pickers |
| `src/components/admin/SyncConfirmModal.jsx` | "Check for Updates" diff & confirm UI |
| `src/pages/Roster.jsx` | Dynamic roster with admin toolbar |
| `src/App.jsx` | Root with all providers wired |
| `firestore.rules` | Security rules — deploy these |

---

## Step-by-step integration

### 1 · Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules
```

### 2 · Install packages (if not already in your project)

```bash
npm install firebase           # already installed per package.json
```

No new npm packages are needed — everything uses Firebase v10 + existing deps.

### 3 · Drop the files in

Copy the files to your existing `src/` folder structure.  
The directory layout expected:

```
src/
  data/initialCharacters.js
  contexts/
    CharactersContext.jsx
    AuthContext.jsx       ← your existing file, unchanged
  components/admin/
    CharacterFormModal.jsx
    SyncConfirmModal.jsx
  pages/
    Roster.jsx            ← replaces your old static Roster.jsx
  App.jsx                 ← merge the provider wrapping into your existing App.jsx
```

### 4 · Wrap your app with CharactersProvider

In your existing `App.jsx`, wrap `<CharactersProvider>` **inside** your existing
`<AuthProvider>`:

```jsx
import { CharactersProvider } from "./contexts/CharactersContext";

// …existing providers…
<AuthProvider>
  <AppProvider>                   {/* your existing app-state context */}
    <CharactersProvider>          {/* ← add this */}
      {/* your existing page routing / layout */}
    </CharactersProvider>
  </AppProvider>
</AuthProvider>
```

### 5 · Update the Roster page import

Replace any static character import in your router/tab logic with the new
`Roster.jsx`.  Pass down four props:

```jsx
<Roster
  charPriorities={charPriorities}
  onSetPriority={setCharPriority}
  customImages={customImages}
  onSetCustomImage={setCustomImage}
/>
```

---

## How the auto-update works

1. User clicks **"Check for Updates"** in the Roster toolbar.
2. `CharactersContext.checkForUpdates()` fetches:
   `https://api.hakush.in/ww/data/en/character.json`
3. The response is normalised and diffed against the current Firestore collection.
4. A modal shows only characters that aren't already in your DB.
5. User ticks which ones to add → clicks **Confirm**.
6. Selected characters are written to Firestore as `upcoming: true`.
7. All users see them instantly (real-time listener).
8. When the banner drops, click **Mark Released** on the card.

---

## Adding a character manually

Click **+ Add Resonator** in the roster toolbar.  
The modal auto-fills the Prydwen CDN portrait URL when you leave the name field.

---

## Firestore data structure

```
characters/
  {slug}/
    id:        "cartethyia"
    name:      "Cartethyia"
    element:   "aero"
    weapon:    "sword"
    rarity:    5
    img:       "https://cdn.prydwen.gg/…"
    standard:  false
    upcoming:  false
    version:   "2.2"
    createdAt: <timestamp>
    updatedAt: <timestamp>

users/
  {uid}/
    config:  { charPriorities, weaponPriorities, customImages, settings }
    pulls:   [ { id, name, rarity, time, bannerId } ]
```

---

## Firestore rules note

The shipped `firestore.rules` allow **any signed-in user** to add/edit/delete
characters.  If you want only yourself to be able to manage the roster, add
your UID to the rules:

```
allow write: if request.auth.uid == "YOUR_UID_HERE";
```
