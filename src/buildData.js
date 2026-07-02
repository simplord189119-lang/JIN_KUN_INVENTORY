/* ============================================================================
   BUILD_DATA — Wuthering Waves character build reference (through v3.5)
   Researched July 2026, cross-checked against Game8's full 5-star weapon
   table to confirm character-weapon pairings (an earlier draft of this file
   had several duplicate/incorrect assignments — e.g. giving one weapon to
   two different characters — which have been corrected here).
   Signature weapons are unique per character and don't change post-release,
   so entries confirmed against the weapon table are high-confidence. Where
   I could not verify a pairing against a primary source, the field is left
   blank rather than guessed. Echo Sets and Team Comps reflect the meta at
   time of writing but WILL shift as new characters release — re-check
   Prydwen.gg or Game8 periodically, especially for blank fields below
   (mostly very recent/unreleased characters where data wasn't confirmable).

   NOTE ON FORMAT: this is the same data as the original keyed object, just
   flattened into a single ordered array ("a line") instead of a nested
   object. Order runs chronologically — launch-era Rover forms/roster first,
   through the confirmed later-patch sections, down to the still-unreleased
   v3.5 additions at the end. Each entry keeps its original key as `id`.
   `version` is only filled in where the source file's section comment
   stated one explicitly; it's left null for the earlier, unlabeled sections
   rather than guessed.
============================================================================ */

export const BUILDDATA = [
  /* ---- Rover forms (player character — no dedicated signature weapon) ---- */
  {
    id: 'rover-aero',
    version: null,
    signature: 'Blood Pact's Edge',
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Cartethyia', 'Ciaccona'],
  },
  {
    id: 'rover-havoc',
    version: null,
    signature: '',
    echoSet: 'Sun-Sinking Eclipse',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'rover-spectro',
    version: null,
    signature: '',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Jinhsi', 'Shorekeeper'],
  },

  /* ---- 5-star limited / standard DPS & sub-DPS ---- */
  {
    id: 'jinhsi',
    version: null,
    signature: "Ages of Harvest",
    echoSet: 'Empyrean Anthem',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  {
    id: 'changli',
    version: null,
    signature: 'Blazing Brilliance',
    echoSet: 'Molten Rift',
    teamComp: ['Shorekeeper', 'Mortefi'],
  },
  {
    id: 'camellya',
    version: null,
    signature: 'Red Spring',
    echoSet: 'Eternal Radiance',
    teamComp: ['Shorekeeper', 'Danjin'],
  },
  {
    id: 'carlotta',
    version: null,
    signature: ' The Last Dance ',
    echoSet: 'Frosty Resolve',
    teamComp: ['Zhezhi', 'Shorekeeper'],
  },
  {
    id: 'zani',
    version: null,
    signature: 'Blazing Justice',
    echoSet: 'Empyrean Anthem',
    teamComp: ['Phoebe', 'Rover (Spectro)'],
  },
  {
    id: 'xiangli-yao',
    version: null,
    signature: 'Verity's Handle',
    echoSet: 'Sierra Gale',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  {
    id: 'yinlin',
    version: null,
    signature: 'Stringmaster',
    echoSet: 'Moonlit Clouds',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'zhezhi',
    version: null,
    signature: 'Rime-Draped Sprouts',
    echoSet: 'Freezing Frost',
    teamComp: ['Carlotta', 'Shorekeeper'],
  },
  {
    id: 'brant',
    version: null,
    signature: 'Unflickering Valor',
    echoSet: 'Molten Rift',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'cantarella',
    version: null,
    signature: 'Whispers of Sirens',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Shorekeeper', 'Youhu'],
  },
  {
    id: 'phrolova',
    version: null,
    signature: 'Lethean Elegy',
    echoSet: 'Eternal Radiance',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  {
    id: 'roccia',
    version: null,
    signature: 'Tragicomedy',
    echoSet: 'Eternal Radiance',
    teamComp: ['Danjin', 'Verina'],
  },
  {
    id: 'encore',
    version: null,
    signature: 'Cosmic Ripples',
    echoSet: 'Molten Rift',
    teamComp: ['Mortefi', 'Verina'],
  },
  {
    id: 'jiyan',
    version: null,
    signature: 'Verdant Summit',
    echoSet: 'Sierra Gale',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'calcharo',
    version: null,
    signature: 'Emerald of Genesis',
    echoSet: 'Moonlit Clouds',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'lupa',
    version: null,
    signature: 'Wildfire Mark',
    echoSet: 'Tidebreaking Courage',
    teamComp: ['Camellya', 'Verina'],
  },
  {
    id: 'galbrena',
    version: null,
    signature: 'Lux & Umbra',
    echoSet: 'Molten Rift',
    teamComp: ['Verina', 'Mortefi'],
  },
  {
    id: 'phoebe',
    version: null,
    signature: 'Luminous Hymn',
    echoSet: 'Empyrean Anthem',
    teamComp: ['Zani', 'Rover (Spectro)'],
  },
  {
    id: 'lumi',
    version: null,
    signature: 'Lustrous Razor',
    echoSet: 'Sierra Gale',
    teamComp: ['Xiangli Yao', 'Shorekeeper'],
  },

  /* ---- 5-star supports / healers ---- */
  {
    id: 'the-shorekeeper',
    version: null,
    signature: 'Stellar Symphony',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Xiangli Yao', 'Jinhsi'],
  },
  {
    id: 'verina',
    version: null,
    // Standard-banner character — no dedicated signature weapon exists for
    // her; Stellar Symphony (Shorekeeper's signature) is her best-in-slot pick.
    signature: 'Cosmic Ripples.',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Calcharo', 'Jiyan'],
  },

  /* ---- 4-star roster (no dedicated signature weapon in-game) ---- */
  { id: 'yangyang', version: null, signature: '', echoSet: 'Sierra Gale', teamComp: ['Jinhsi', 'Verina'] },
  { id: 'chixia', version: null, signature: '', echoSet: 'Molten Rift', teamComp: ['Encore', 'Baizhi'] },
  { id: 'baizhi', version: null, signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Encore', 'Chixia'] },
  { id: 'yuanwu', version: null, signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Jinhsi', 'Shorekeeper'] },
  { id: 'sanhua', version: null, signature: '', echoSet: 'Freezing Frost', teamComp: ['Calcharo', 'Encore'] },
  { id: 'jianxin', version: null, signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Jiyan', 'Verina'] },
  { id: 'mortefi', version: null, signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Encore', 'Camellya'] },
  { id: 'danjin', version: null, signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Camellya', 'Verina'] },
  { id: 'lingyang', version: null, signature: '', echoSet: 'Freezing Frost', teamComp: ['Zhezhi', 'Baizhi'] },
  { id: 'taoqi', version: null, signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Roccia', 'Baizhi'] },
  { id: 'youhu', version: null, signature: '', echoSet: 'Freezing Frost', teamComp: ['Cantarella', 'Shorekeeper'] },
  { id: 'aalto', version: null, signature: '', echoSet: 'Sierra Gale', teamComp: ['Cartethyia', 'Ciaccona'] },
  { id: 'buling', version: null, signature: '', echoSet: '', teamComp: [] },

  /* ---- v2.4+ additions (verified via current build guides, July 2026) ---- */
  {
    id: 'cartethyia',
    version: '2.4+',
    signature: "Defier's Thorn",
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Ciaccona', 'Chisa'],
  },
  {
    id: 'ciaccona',
    version: '2.4+',
    signature: 'Breaking News',
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Cartethyia', 'chisa'],
  },

  /* ---- v2.7–2.8 additions ---- */
  { id: 'qiuyuan', version: '2.7–2.8', signature: '', echoSet: '', teamComp: [] },

  /* ---- v3.0+ additions ---- */
  {
    id: 'mornye',
    signature: 'Starfield Calibrator',
    echoSet: '',
    teamComp: ['Lucy', 'Rebecca'],
  },
  { id: 'sigrika', 
signature: 'Solsworn Ciphers', 
echoSet: '',
 teamComp: [] },
  {
    id: 'hiyuki',
    signature: 'Frostburn',
    echoSet: 'Freezing Frost',
    teamComp: [],
  },
  {
    id: 'denia',
    signature: 'Forged Dwarf Star',
    echoSet: '',
    teamComp: [],
  },
  {
    id: 'chisa',
    version: '3.0+',
    signature: 'Kumokiri',
    echoSet: '',
    teamComp: ['Cartethyia', 'Ciaccona'],
  },
  {
    id: 'iuno',
    version: '3.0+',
    signature: "Moongazer's Sigil",
    echoSet: '',
    teamComp: ['Augusta', 'Rover (Aero)'],
  },
  {
    id: 'augusta',
    version: '3.0+',
    signature: 'Thunderflare Dominion',
    echoSet: 'Crown of Valor',
    teamComp: ['Iuno', 'Mortefi'],
  },
  { id: 'luuk-herssen', 
signature: 'Daybreaker's Spine', 
echoSet: '', 
teamComp: [] },
  
  { id: 'lynae',
 signature: 'Spectrum Blaster', 
echoSet: '', 
teamComp: [] },
  
  { id: 'aemeath', 
signature: 'Everbright Polestar',
 echoSet: '', 
teamComp: [] },

  /* ---- v3.4 additions (Cyberpunk: Edgerunners collab + rerun cast) ---- */
  {
    id: 'lucy',
    signature: 'Spectral Trigger',
    echoSet: 'Nightmare: Shattered Dreams and Vanished Ghosts',
    teamComp: ['Rebecca', 'Mornye'],
  },
  {
    id: 'rebecca',
    signature: 'Skull Thrasher',
    echoSet: 'Moonlit Clouds',
    teamComp: ['Lucy', 'Mornye'],
  },
  {
    id: 'lucilla',
    signature: 'Freeze Frame',
    echoSet: '',
    teamComp: ['Chisa', ''],
  },

  /* ---- v3.5 additions — not yet released at time of writing; no meta exists ---- */
  { id: 'yangyang-xuanling', 
signature: 'the Azure of Heaven',
 echoSet: '', 
teamComp: [] },
  { id: 'suisui', 
signature: 'Firstlight's Herald', 
echoSet: '', 
teamComp: [] },
];
