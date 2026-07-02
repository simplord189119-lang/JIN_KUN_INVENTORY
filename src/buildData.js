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
============================================================================ */

export const BUILD_DATA = {
  /* ---- Rover forms (player character — no dedicated signature weapon) ---- */
  'rover-aero': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Cartethyia', 'Ciaccona'],
  },
  'rover-havoc': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Sun-Sinking Eclipse',
    teamComp: ['Verina', 'Mortefi'],
  },
  'rover-spectro': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Jinhsi', 'Shorekeeper'],
  },

  /* ---- 5-star limited / standard DPS & sub-DPS ---- */
  'jinhsi': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: "Verity's Handle",
    echoSet: 'Empyrean Anthem',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  'changli': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Blazing Brilliance',
    echoSet: 'Molten Rift',
    teamComp: ['Shorekeeper', 'Mortefi'],
  },
  'camellya': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Red Spring',
    echoSet: 'Eternal Radiance',
    teamComp: ['Shorekeeper', 'Danjin'],
  },
  'carlotta': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Frosty Resolve',
    teamComp: ['Zhezhi', 'Shorekeeper'],
  },
  'zani': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Blazing Justice',
    echoSet: 'Empyrean Anthem',
    teamComp: ['Phoebe', 'Rover (Spectro)'],
  },
  'xiangli-yao': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Sierra Gale',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  'yinlin': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Stringmaster',
    echoSet: "Moonlit Clouds",
    teamComp: ['Verina', 'Mortefi'],
  },
  'zhezhi': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Freezing Frost',
    teamComp: ['Carlotta', 'Shorekeeper'],
  },
  'brant': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Molten Rift',
    teamComp: ['Verina', 'Mortefi'],
  },
  'cantarella': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Whispers of Sirens',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Shorekeeper', 'Youhu'],
  },
  'phrolova': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Lethean Elegy',
    echoSet: 'Eternal Radiance',
    teamComp: ['Shorekeeper', 'Yuanwu'],
  },
  'roccia': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Eternal Radiance',
    teamComp: ['Danjin', 'Verina'],
  },
  'encore': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Emerald of Genesis',
    echoSet: 'Molten Rift',
    teamComp: ['Mortefi', 'Verina'],
  },
  'jiyan': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Verdant Summit',
    echoSet: 'Sierra Gale',
    teamComp: ['Verina', 'Mortefi'],
  },
  'calcharo': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Moonlit Clouds',
    teamComp: ['Verina', 'Mortefi'],
  },
  'lupa': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Wildfire Mark',
    echoSet: 'Tidebreaking Courage',
    teamComp: ['Camellya', 'Verina'],
  },
  'galbrena': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Molten Rift',
    teamComp: ['Verina', 'Mortefi'],
  },
  'phoebe': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Empyrean Anthem',
    teamComp: ['Zani', 'Rover (Spectro)'],
  },
  'lumi': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Sierra Gale',
    teamComp: ['Xiangli Yao', 'Shorekeeper'],
  },

  /* ---- 5-star supports / healers ---- */
  'the-shorekeeper': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Stellar Symphony',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Xiangli Yao', 'Jinhsi'],
  },
  'verina': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    // Standard-banner character — no dedicated signature weapon exists for
    // her; Stellar Symphony (Shorekeeper's signature) is her best-in-slot pick.
    signature: '',
    echoSet: 'Rejuvenating Glow',
    teamComp: ['Calcharo', 'Jiyan'],
  },

  /* ---- 4-star roster (no dedicated signature weapon in-game) ---- */
  'yangyang': { signature: '', echoSet: 'Sierra Gale', teamComp: ['Jinhsi', 'Verina'] },
  'chixia': { signature: '', echoSet: 'Molten Rift', teamComp: ['Encore', 'Baizhi'] },
  'baizhi': { signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Encore', 'Chixia'] },
  'yuanwu': { signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Jinhsi', 'Shorekeeper'] },
  'sanhua': { signature: '', echoSet: 'Freezing Frost', teamComp: ['Calcharo', 'Encore'] },
  'jianxin': { signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Jiyan', 'Verina'] },
  'mortefi': { signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Encore', 'Camellya'] },
  'danjin': { signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Camellya', 'Verina'] },
  'lingyang': { signature: '', echoSet: 'Freezing Frost', teamComp: ['Zhezhi', 'Baizhi'] },
  'taoqi': { signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Roccia', 'Baizhi'] },
  'youhu': { signature: '', echoSet: 'Freezing Frost', teamComp: ['Cantarella', 'Shorekeeper'] },
  'aalto': { signature: '', echoSet: 'Sierra Gale', teamComp: ['Cartethyia', 'Ciaccona'] },
  'buling': { signature: '', echoSet: '', teamComp: [] },

  /* ---- v2.4+ additions (verified via current build guides, July 2026) ---- */
  'cartethyia': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: "Defier's Thorn",
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Ciaccona', 'Chisa'],
  },
  'ciaccona': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Windward Pilgrimage',
    teamComp: ['Cartethyia', 'Rover (Aero)'],
  },

  /* ---- v2.7–2.8 additions ---- */
  'qiuyuan': { signature: '', echoSet: '', teamComp: [] },

  /* ---- v3.0+ additions ---- */
  'mornye': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Starfield Calibrator',
    echoSet: '',
    teamComp: ['Lucy', 'Rebecca'],
  },
  'sigrika': { signature: '', echoSet: '', teamComp: [] },
  'hiyuki': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Frostburn',
    echoSet: 'Freezing Frost',
    teamComp: [],
  },
  'denia': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Forged Dwarf Star',
    echoSet: '',
    teamComp: [],
  },
  'chisa': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Kumokiri',
    echoSet: '',
    teamComp: ['Cartethyia', 'Ciaccona'],
  },
  'iuno': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: "Moongazer's Sigil",
    echoSet: '',
    teamComp: ['Augusta', 'Rover (Aero)'],
  },
  'augusta': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: 'Thunderflare Dominion',
    echoSet: 'Crown of Valor',
    teamComp: ['Iuno', 'Mortefi'],
  },
  'luuk-herssen': { signature: '', echoSet: '', teamComp: [] },
  'lynae': { signature: '', echoSet: '', teamComp: [] },
  'aemeath': { signature: '', echoSet: '', teamComp: [] },

  /* ---- v3.4 additions (Cyberpunk: Edgerunners collab + rerun cast) ---- */
  'lucy': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Nightmare: Shattered Dreams and Vanished Ghosts',
    teamComp: ['Rebecca', 'Mornye'],
  },
  'rebecca': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: 'Moonlit Clouds',
    teamComp: ['Lucy', 'Mornye'],
  },
  'lucilla': {
    // characterImage: '', weaponImage: '', echoSetImage: ''
    signature: '',
    echoSet: '',
    teamComp: ['Chisa', ''],
  },

  /* ---- v3.5 additions — not yet released at time of writing; no meta exists ---- */
  'yangyang-xuanling': { signature: '', echoSet: '', teamComp: [] },
  'suisui': { signature: '', echoSet: '', teamComp: [] },
};
