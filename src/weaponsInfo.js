/* ============================================================================
   WEAPON_INFO — per-weapon "owner" + crit/buff reference, keyed by the same
   `id` used in weaponsData.js. Verified against Game8's 5-star weapon stat
   tables (base ATK, substat, and full passive text) as of July 2026.

   Standard weapons (the 5 non-signature 5-stars) aren't tied to one
   character, so `ownerName` is left empty for those — App.jsx's DetailModal
   already has a fallback ("Not character-specific / not set.") for that case.

   A few very-new/unreleased weapons (Lucilla, Lucy, Rebecca, Suisui,
   Yangyang: Xuanling) don't have confirmed passive text publicly yet, so
   `buff` is left blank rather than guessed — fill in once Kuro publishes
   the numbers.
============================================================================ */

export const WEAPON_INFO = [
  // --- Standard 5-Star Weapons ---
  {
    id: 'standard_sword',
    ownerName: '',
    buff: 'Crit Rate +24.3%. Stormy Resolution: +12.8% Energy Regen. Casting Resonance Skill grants +6% ATK, stacking up to 2 times for 10s.',
  },
  {
    id: 'standard_rectifier',
    ownerName: '',
    buff: 'ATK +53.9%. Stormy Resolution: +12.8% Energy Regen. Basic Attack DMG grants +3.2% Basic Attack DMG Bonus, stacking up to 5 times for 8s (triggers once per 0.5s).',
  },
  {
    id: 'standard_pistol',
    ownerName: '',
    buff: 'Crit Rate +24.3%. Stormy Resolution: +12.8% Energy Regen. Casting Outro Skill grants the incoming Resonator +10% ATK for 14s.',
  },
  {
    id: 'standard_broadblade',
    ownerName: '',
    buff: 'ATK +36.4%. Incision: +12.8% Energy Regen. Casting Resonance Skill grants +7% Resonance Liberation DMG, stacking up to 3 times for 12s.',
  },
  {
    id: 'standard_gauntlet',
    ownerName: '',
    buff: "ATK +36.4%. Stormy Resolution: +12.8% Energy Regen. Hitting with Resonance Skill grants +10% Basic Attack DMG for 8s; hitting with Basic Attack grants +10% Resonance Skill DMG for 8s.",
  },

  // --- Glacio ---
  {
    id: 'sig_carlotta',
    ownerName: 'Carlotta',
    buff: "Crit DMG +72%. Silent Eulogy: +12% ATK. Casting Intro Skill or Resonance Liberation grants +48% Resonance Skill DMG Bonus for 5s.",
  },
  {
    id: 'sig_hiyuki',
    ownerName: 'Hiyuki',
    buff: "Crit Rate +24.3%. Self No More: +12% ATK. Applying Glacio Chafe amplifies Glacio DMG by 28% and lets Liberation DMG ignore 10% DEF; while on-field, amplifies nearby Glacio Chafe DMG by 20% for 6s.",
  },
  {
    id: 'sig_lucilla',
    ownerName: 'Lucilla',
    buff: '', // Not yet publicly confirmed — Lucilla is the only Rectifier user who applies Glacio Chafe, so the weapon is built around that.
  },
  {
    id: 'sig_suisui',
    ownerName: 'Suisui',
    buff: '', // Unreleased as of writing (Version 3.5) — no passive data published yet.
  },
  {
    id: 'sig_zhezhi',
    ownerName: 'Zhezhi',
    buff: "Crit DMG +72%. Panorama: +12% ATK. Resonance Skill grants +12% Basic Attack DMG, stacking up to 3 times for 6s. At 3 stacks, casting Outro Skill consumes them for +52% DMG Bonus to off-field Basic Attacks for 27s.",
  },

  // --- Aero ---
  {
    id: 'sig_cartethyia',
    ownerName: 'Cartethyia',
    buff: "HP +72.2%. A Free Knight's Tarantella: +12% Max HP. After Intro Skill or Basic Attacks, ignores 8% of the target's DEF; targets with Aero Erosion take 20% more damage.",
  },
  {
    id: 'sig_ciaccona',
    ownerName: 'Ciaccona',
    buff: "Crit Rate +36%. Lingering Summer Tune: +12% ATK. Inflicting Aero Erosion grants +24% Aero DMG Bonus for 10s; hitting eroded targets lowers their Aero RES by 10% for 20s.",
  },
  {
    id: 'sig_iuno',
    ownerName: 'Iuno',
    buff: "Crit Rate +36%. Plenilune Radiance: +12% ATK. Intro Skill or Liberation grants +20% Liberation DMG for 15s. Gaining a Shield lets Liberation DMG ignore 7.2% DEF, stacking up to 5 times.",
  },
  {
    id: 'sig_jiyan',
    ownerName: 'Jiyan',
    buff: "Crit DMG +48.6%. Swordsworn: +12% DMG Bonus. Intro Skill or Liberation grants +24% Heavy Attack DMG Bonus, stacking up to 2 times for 14s.",
  },
  {
    id: 'sig_qiuyuan',
    ownerName: 'Qiuyuan',
    buff: "Crit Rate +24.3%. When A Heart Settles: +12% ATK. Echo Skill cast shortly after Intro Skill/Basic Attack grants a stacking Heavy Attack DMG buff (up to 2 stacks); Intro Skill also grants the team +20% Echo Skill DMG for 30s.",
  },
  {
    id: 'sig_sigrika',
    ownerName: 'Sigrika',
    buff: "Crit DMG +48.6%. Sunward: +12% ATK. Intro Skill or Echo Skill grants +32% Echo Skill DMG Amplification for 15s; Echo Skill DMG ignores 10% Aero RES for 6s.",
  },
  {
    id: 'sig_rover_aero',
    ownerName: 'Rover (Aero)',
    buff: "Energy Regen +38.8%. Harmonious Vibrancy: providing healing grants +10% Resonance Skill DMG for 6s. When Rover: Aero casts Resonance Skill, nearby Aero DMG is amplified +10% for 30s.",
  },

  // --- Electro ---
  {
    id: 'sig_augusta',
    ownerName: 'Augusta',
    buff: "Crit Rate +12.1%. Thunderblaze Eminence: +12% ATK. Intro Skill or Resonance Skill grants +20% Heavy Attack DMG for 15s. Gaining a Shield lets Heavy Attack DMG ignore 7.2% DEF, stacking up to 5 times.",
  },
  {
    id: 'sig_rebecca',
    ownerName: 'Rebecca',
    buff: '', // Not yet publicly confirmed — main stat is a notably high Crit DMG roll.
  },
  {
    id: 'sig_xiangli_yao',
    ownerName: 'Xiangli Yao',
    buff: "Crit Rate +24.3%. Ad Veritatem: +12% Attribute DMG Bonus. Casting Liberation grants +48% Liberation DMG for 8s, extendable by 5s per Resonance Skill cast (up to 3 extensions).",
  },
  {
    id: 'sig_yinlin',
    ownerName: 'Yinlin',
    buff: "Crit Rate +35.9%. Electric Amplification: +12% DMG Bonus. Resonance Skill DMG grants +12% ATK, stacking up to 2 times for 5s; while off-field, gains an extra +12% ATK.",
  },

  // --- Fusion ---
  {
    id: 'sig_aemeath',
    ownerName: 'Aemeath',
    buff: "Crit Rate +24.3%. Starchaser: +12% All-Attribute DMG Bonus. Inflicting the relevant Fusion status lets Liberation DMG ignore 32% DEF and 10% Fusion RES for 8s.",
  },
  {
    id: 'sig_changli',
    ownerName: 'Changli',
    buff: "Crit DMG +48.6%. Crimson Phoenix: +12% ATK. Dealing damage or casting Resonance Skill builds Searing Feather stacks, each adding +4% Resonance Skill DMG (up to 14 stacks).",
  },
  {
    id: 'sig_denia',
    ownerName: 'Denia',
    buff: "Crit Rate +36%. Dissolution: +12% ATK. Inflicting Fusion Burst grants +36% Liberation DMG for 5s; while active, teammates who also inflict Fusion Burst gain +24% ATK for 15s.",
  },
  {
    id: 'sig_galbrena',
    ownerName: 'Galbrena',
    buff: "Crit DMG +48.6%. To Fire She Returns: +12% ATK. Echo Skill DMG grants +24% Heavy Attack DMG Amplification for 6s, and vice versa; while both are active, damage ignores 8% DEF.",
  },
  {
    id: 'sig_mornye',
    ownerName: 'Mornye',
    buff: "Energy Regen +77%. Definite Solution: +16% DEF. Casting Liberation restores 8 Concerto Energy (once per 20s). Healing a teammate grants nearby allies +20% Crit DMG for 4s.",
  },

  // --- Havoc ---
  {
    id: 'sig_camellya',
    ownerName: 'Camellya',
    buff: "Crit Rate +24.3%. Beyond the Cycle: +12% ATK. Basic Attack DMG grants +10% Basic Attack DMG, stacking up to 3 times for 14s; consuming Concerto Energy grants +40% Basic Attack DMG for 10s.",
  },
  {
    id: 'sig_cantarella',
    ownerName: 'Cantarella',
    buff: "Crit DMG +72%. From the Deep: +12% ATK. Echo Skill cast shortly after Intro Skill/Basic Attack builds stacks that grant +40% Basic Attack DMG at 1 stack and ignore 12% Havoc RES at 2 stacks.",
  },
  {
    id: 'sig_chisa',
    ownerName: 'Chisa',
    buff: "Crit Rate +36%. Lifethread: +12% ATK. Intro Skill or inflicting Negative Statuses grants +8% Liberation DMG, stacking up to 3 times for 15s. At max stacks, teammates' Negative Status hits grant the team +24% All-Attribute DMG for 15s.",
  },
  {
    id: 'sig_phrolova',
    ownerName: 'Phrolova',
    buff: "Crit Rate +24.3%. Underworld Requiem: +12% ATK. After Echo Skill DMG, gains +32% Resonance Skill DMG, +32% Echo Skill DMG Amplification, and ignores 8% DEF for 12s.",
  },
  {
    id: 'sig_roccia',
    ownerName: 'Roccia',
    buff: "Crit Rate +24.3%. Fool's Warble: +12% ATK. Basic Attack or Intro Skill grants +48% Heavy Attack DMG Bonus for 3s.",
  },
  {
    id: 'sig_yangyang_xuanling',
    ownerName: 'Yangyang: Xuanling',
    buff: '', // Unreleased as of writing (Version 3.5 Phase 1) — no passive data published yet.
  },

  // --- Spectro ---
  {
    id: 'sig_jinhsi',
    ownerName: 'Jinhsi',
    buff: "Crit Rate +24.3%. Divine Blessing: +12% Attribute DMG Bonus. Casting Intro Skill and casting Resonance Skill each independently grant a stacking +24% Resonance Skill DMG buff for 12s.",
  },
  {
    id: 'sig_lucy',
    ownerName: 'Lucy',
    buff: '', // Not yet publicly confirmed.
  },
  {
    id: 'sig_luuk_herssen',
    ownerName: 'Luuk Herssen',
    buff: "Crit Rate +24.3%. Suturing Dayline: +12% ATK. Basic Attack DMG grants +20% Spectro DMG Bonus for 4s. Inflicting Tune Strain: Shifting grants +20% Basic Attack DMG Amplification and ignores 10% DEF for 6s.",
  },
  {
    id: 'sig_lynae',
    ownerName: 'Lynae',
    buff: "Crit Rate +24.3%. Attendance Exemption Protocol: +12% ATK. Intro Skill or landing a Basic Attack grants +36% Basic Attack DMG for 4s. Inflicting certain Tune effects during Basic Attacks grants the team +8% all DMG, stacking up to 3 times for 30s.",
  },
  {
    id: 'sig_phoebe',
    ownerName: 'Phoebe',
    buff: "Crit Rate +36%. Homebuilder's Anthem: +12% ATK. Damaging Spectro-Frazzled enemies grants +14% Basic/Heavy Attack DMG, stacking up to 3 times for 6s; casting Outro Skill amplifies nearby Spectro Frazzle DMG by 30% for 30s.",
  },
  {
    id: 'sig_shorekeeper',
    ownerName: 'The Shorekeeper',
    buff: "Energy Regen +77%. Astral Evolvement: +12% HP. Casting Liberation restores 8 Concerto Energy (once per 20s). Casting a healing Resonance Skill grants nearby teammates +14% ATK for 30s.",
  },
  {
    id: 'sig_zani',
    ownerName: 'Zani',
    buff: "Crit DMG +48.6%. Darkness Breaker: +12% ATK. Basic Attack hits ignore 8% DEF and amplify Spectro Frazzle DMG dealt by 50% for 6s.",
  },
];
