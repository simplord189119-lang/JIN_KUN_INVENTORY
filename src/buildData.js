/* ============================================================================
   BUILD_DATA — Wuthering Waves character build reference (through v3.5)
   ids match the `id` field in data.js exactly (underscore format) so this
   file can be looked up directly: BUILD_DATA.find(b => b.id === character.id)

   signature: '' means the character has no dedicated signature weapon
   (standard-banner 5-stars and all 4-stars). echoSet / teamComp are meta
   suggestions and will shift as new characters release — re-check
   periodically. Blank fields on very recent/unreleased characters mean
   no reliable info was available yet.
============================================================================ */

export const BUILD_DATA = [
  /* ---- Rover forms (player character — no dedicated signature weapon) ---- */
  { id: 'rover_aero', signature: "Bloodpact's Pledge", echoSet: 'Windward Pilgrimage', teamComp: ['Cartethyia', 'Ciaccona'] },
  { id: 'rover_havoc', signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Verina', 'Mortefi'] },
  { id: 'rover_spectro', signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Jinhsi', 'Shorekeeper'] },

  /* ---- 5-star limited / standard DPS & sub-DPS ---- */
  { id: 'jinhsi', signature: 'Ages of Harvest', echoSet: 'Empyrean Anthem', teamComp: ['Shorekeeper', 'Yuanwu'] },
  { id: 'changli', signature: 'Blazing Brilliance', echoSet: 'Molten Rift', teamComp: ['Shorekeeper', 'Mortefi'] },
  { id: 'camellya', signature: 'Red Spring', echoSet: 'Eternal Radiance', teamComp: ['Shorekeeper', 'Danjin'] },
  { id: 'carlotta', signature: 'The Last Dance', echoSet: 'Frosty Resolve', teamComp: ['Zhezhi', 'Shorekeeper'] },
  { id: 'zani', signature: 'Blazing Justice', echoSet: 'Empyrean Anthem', teamComp: ['Phoebe', 'Rover (Spectro)'] },
  { id: 'xiangli_yao', signature: "Verity's Handle", echoSet: 'Sierra Gale', teamComp: ['Shorekeeper', 'Yuanwu'] },
  { id: 'yinlin', signature: 'Stringmaster', echoSet: 'Moonlit Clouds', teamComp: ['Verina', 'Mortefi'] },
  { id: 'zhezhi', signature: 'Rime-Draped Sprouts', echoSet: 'Freezing Frost', teamComp: ['Carlotta', 'Shorekeeper'] },
  { id: 'brant', signature: 'Unflickering Valor', echoSet: 'Molten Rift', teamComp: ['Verina', 'Mortefi'] }, // unverified, double-check
  { id: 'cantarella', signature: 'Whispers of Sirens', echoSet: 'Rejuvenating Glow', teamComp: ['Shorekeeper', 'Youhu'] },
  { id: 'phrolova', signature: 'Lethean Elegy', echoSet: 'Eternal Radiance', teamComp: ['Shorekeeper', 'Yuanwu'] },
  { id: 'roccia', signature: 'Tragicomedy', echoSet: 'Eternal Radiance', teamComp: ['Danjin', 'Verina'] },
  { id: 'encore', signature: '', echoSet: 'Molten Rift', teamComp: ['Mortefi', 'Verina'] }, // standard-banner, no true signature
  { id: 'jiyan', signature: 'Verdant Summit', echoSet: 'Sierra Gale', teamComp: ['Verina', 'Mortefi'] },
  { id: 'calcharo', signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Verina', 'Mortefi'] }, // standard-banner, no true signature
  { id: 'lupa', signature: '', echoSet: 'Tidebreaking Courage', teamComp: ['Camellya', 'Verina'] }, // unverified, left blank
  { id: 'galbrena', signature: 'Lux & Umbra', echoSet: 'Molten Rift', teamComp: ['Verina', 'Mortefi'] },
  { id: 'phoebe', signature: 'Luminous Hymn', echoSet: 'Empyrean Anthem', teamComp: ['Zani', 'Rover (Spectro)'] },
  { id: 'lumi', signature: '', echoSet: 'Sierra Gale', teamComp: ['Xiangli Yao', 'Shorekeeper'] }, // no dedicated signature

  /* ---- 5-star supports / healers ---- */
  { id: 'shorekeeper', signature: 'Stellar Symphony', echoSet: 'Rejuvenating Glow', teamComp: ['Xiangli Yao', 'Jinhsi'] },
  { id: 'verina', signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Calcharo', 'Jiyan'] }, // standard-banner, no true signature

  /* ---- 4-star roster (no dedicated signature weapon in-game) ---- */
  { id: 'yangyang', signature: '', echoSet: 'Sierra Gale', teamComp: ['Jinhsi', 'Verina'] },
  { id: 'chixia', signature: '', echoSet: 'Molten Rift', teamComp: ['Encore', 'Baizhi'] },
  { id: 'baizhi', signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Encore', 'Chixia'] },
  { id: 'yuanwu', signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Jinhsi', 'Shorekeeper'] },
  { id: 'sanhua', signature: '', echoSet: 'Freezing Frost', teamComp: ['Calcharo', 'Encore'] },
  { id: 'jianxin', signature: '', echoSet: 'Rejuvenating Glow', teamComp: ['Jiyan', 'Verina'] },
  { id: 'mortefi', signature: '', echoSet: 'Moonlit Clouds', teamComp: ['Encore', 'Camellya'] },
  { id: 'danjin', signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Camellya', 'Verina'] },
  { id: 'lingyang', signature: '', echoSet: 'Freezing Frost', teamComp: ['Zhezhi', 'Baizhi'] },
  { id: 'taoqi', signature: '', echoSet: 'Sun-Sinking Eclipse', teamComp: ['Roccia', 'Baizhi'] },
  { id: 'youhu', signature: '', echoSet: 'Freezing Frost', teamComp: ['Cantarella', 'Shorekeeper'] },
  { id: 'aalto', signature: '', echoSet: 'Sierra Gale', teamComp: ['Cartethyia', 'Ciaccona'] },
  { id: 'buling', signature: '', echoSet: '', teamComp: [] },

  /* ---- v2.4+ additions ---- */
  { id: 'cartethyia', signature: "Defier's Thorn", echoSet: 'Windward Pilgrimage', teamComp: ['Ciaccona', 'Chisa'] },
  { id: 'ciaccona', signature: 'Woodland Aria', echoSet: 'Windward Pilgrimage', teamComp: ['Cartethyia', 'Chisa'] }, // fixed: was mislabeled 'Breaking News'

  /* ---- v2.7–2.8 additions ---- */
  { id: 'qiuyuan', signature: 'Emerald Sentence', echoSet: '', teamComp: [] },

  /* ---- v3.0+ additions ---- */
  { id: 'mornye', signature: 'Starfield Calibrator', echoSet: '', teamComp: ['Lucy', 'Rebecca'] },
  { id: 'sigrika', signature: 'Solsworn Ciphers', echoSet: '', teamComp: [] },
  { id: 'hiyuki', signature: 'Frostburn', echoSet: 'Freezing Frost', teamComp: [] },
  { id: 'denia', signature: 'Forged Dwarf Star', echoSet: '', teamComp: [] },
  { id: 'chisa', signature: 'Kumokiri', echoSet: '', teamComp: ['Cartethyia', 'Ciaccona'] },
  { id: 'iuno', signature: "Moongazer's Sigil", echoSet: '', teamComp: ['Augusta', 'Rover (Aero)'] },
  { id: 'augusta', signature: 'Thunderflare Dominion', echoSet: 'Crown of Valor', teamComp: ['Iuno', 'Mortefi'] },
  { id: 'luuk_herssen', signature: "Daybreaker's Spine", echoSet: '', teamComp: [] },
  { id: 'lynae', signature: 'Spectrum Blaster', echoSet: '', teamComp: [] },
  { id: 'aemeath', signature: 'Everbright Polestar', echoSet: '', teamComp: [] },

  /* ---- v3.4 additions (Cyberpunk: Edgerunners collab + rerun cast) ---- */
  { id: 'lucy', signature: 'Spectral Trigger', echoSet: 'Nightmare: Shattered Dreams and Vanished Ghosts', teamComp: ['Rebecca', 'Mornye'] },
  { id: 'rebecca', signature: 'Skull Thrasher', echoSet: 'Moonlit Clouds', teamComp: ['Lucy', 'Mornye'] },
  { id: 'lucilla', signature: 'Freeze Frame', echoSet: '', teamComp: ['Chisa'] },

  /* ---- v3.5 additions — very new, meta not established yet ---- */
  { id: 'yangyang_xuanling', signature: 'Azure Oath', echoSet: '', teamComp: [] }, // fixed: was mislabeled 'the Azure of Heaven'
  { id: 'suisui', signature: "Firstlight's Herald", echoSet: '', teamComp: [] },

  /* ---- announced, not yet released — element/weapon/signature unconfirmed ---- */
  { id: 'suoming', signature: '', echoSet: '', teamComp: [] },
  { id: 'jingran', signature: '', echoSet: '', teamComp: [] },
  { id: 'qingxiao', signature: '', echoSet: '', teamComp: [] },
  { id: 'hsin', signature: '', echoSet: '', teamComp: [] },
];
