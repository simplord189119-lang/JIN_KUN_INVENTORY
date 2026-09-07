/**
 * initialCharacters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed data. On first run (empty Firestore characters collection) this list is
 * bulk-written to Firestore so every user sees the same base roster.
 *
 * Structure per character
 * ───────────────────────
 * id        – kebab-case slug, used as the Firestore doc ID
 * name      – display name
 * element   – aero | glacio | fusion | electro | havoc | spectro
 * weapon    – broadblade | sword | pistols | gauntlets | rectifier
 * rarity    – 4 | 5
 * img       – CDN portrait URL (override via customImages in Firestore)
 * standard  – true if in the Standard Resonator pool
 * upcoming  – true if announced but not yet released
 * version   – patch string, e.g. "1.0", "2.1"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CDN = "https://cdn.prydwen.gg/wuthering-waves/characters";
const img = (slug) => `${CDN}/${slug}_icon.webp`;

const INITIAL_CHARACTERS = [
  // ── 5★ Standard ──────────────────────────────────────────────────────────
  { id:"calcharo",    name:"Calcharo",         element:"electro", weapon:"broadblade", rarity:5, standard:true, version:"1.0", img:img("calcharo") },
  { id:"verina",      name:"Verina",           element:"spectro", weapon:"rectifier",  rarity:5, standard:true, version:"1.0", img:img("verina") },
  { id:"encore",      name:"Encore",           element:"fusion",  weapon:"rectifier",  rarity:5, standard:true, version:"1.0", img:img("encore") },
  { id:"jianxin",     name:"Jianxin",          element:"aero",    weapon:"gauntlets",  rarity:5, standard:true, version:"1.0", img:img("jianxin") },
  { id:"lingyang",    name:"Lingyang",          element:"glacio",  weapon:"gauntlets",  rarity:5, standard:true, version:"1.0", img:img("lingyang") },

  // ── 5★ Limited ───────────────────────────────────────────────────────────
  { id:"jiyan",          name:"Jiyan",              element:"aero",    weapon:"broadblade", rarity:5, version:"1.0", img:img("jiyan") },
  { id:"yinlin",         name:"Yinlin",             element:"electro", weapon:"rectifier",  rarity:5, version:"1.1", img:img("yinlin") },
  { id:"jinhsi",         name:"Jinhsi",             element:"spectro", weapon:"broadblade", rarity:5, version:"1.2", img:img("jinhsi") },
  { id:"changli",        name:"Changli",            element:"fusion",  weapon:"sword",      rarity:5, version:"1.2", img:img("changli") },
  { id:"zhezhi",         name:"Zhezhi",             element:"glacio",  weapon:"rectifier",  rarity:5, version:"1.3", img:img("zhezhi") },
  { id:"xiangli-yao",    name:"Xiangli Yao",        element:"electro", weapon:"gauntlets",  rarity:5, version:"1.3", img:img("xiangli-yao") },
  { id:"camellya",       name:"Camellya",           element:"havoc",   weapon:"sword",      rarity:5, version:"1.4", img:img("camellya") },
  { id:"shorekeeper",    name:"The Shorekeeper",    element:"spectro", weapon:"rectifier",  rarity:5, version:"1.4", img:img("the-shorekeeper") },
  { id:"carlotta",       name:"Carlotta",           element:"glacio",  weapon:"pistols",    rarity:5, version:"2.0", img:img("carlotta") },
  { id:"roccia",         name:"Roccia",             element:"havoc",   weapon:"gauntlets",  rarity:5, version:"2.0", img:img("roccia") },
  { id:"phoebe",         name:"Phoebe",             element:"spectro", weapon:"rectifier",  rarity:5, version:"2.1", img:img("phoebe") },
  { id:"brant",          name:"Brant",              element:"fusion",  weapon:"broadblade", rarity:5, version:"2.1", img:img("brant") },
  { id:"cantarella",     name:"Cantarella",         element:"havoc",   weapon:"rectifier",  rarity:5, version:"2.2", img:img("cantarella") },
  { id:"cartethyia",     name:"Cartethyia",         element:"aero",    weapon:"sword",      rarity:5, version:"2.2", img:img("cartethyia") },
  { id:"zani",           name:"Zani",               element:"spectro", weapon:"gauntlets",  rarity:5, version:"2.3", img:img("zani") },
  { id:"phrolova",       name:"Phrolova",           element:"havoc",   weapon:"rectifier",  rarity:5, version:"2.3", img:img("phrolova") },
  { id:"augusta",        name:"Augusta",            element:"electro", weapon:"rectifier",  rarity:5, version:"2.4", img:img("augusta") },
  { id:"galbrena",       name:"Galbrena",           element:"fusion",  weapon:"sword",      rarity:5, version:"2.4", img:img("galbrena") },
  { id:"lupa",           name:"Lupa",               element:"fusion",  weapon:"pistols",    rarity:5, version:"2.5", img:img("lupa") },
  { id:"mornye",         name:"Mornye",             element:"fusion",  weapon:"gauntlets",  rarity:5, version:"2.5", img:img("mornye") },
  { id:"iuno",           name:"Iuno",               element:"aero",    weapon:"rectifier",  rarity:5, version:"2.6", img:img("iuno") },
  { id:"lucilla",        name:"Lucilla",            element:"glacio",  weapon:"sword",      rarity:5, version:"2.6", img:img("lucilla") },
  { id:"lucy",           name:"Lucy",               element:"spectro", weapon:"pistols",    rarity:5, version:"3.0", img:img("lucy") },
  { id:"sigrika",        name:"Sigrika",            element:"aero",    weapon:"broadblade", rarity:5, version:"3.0", img:img("sigrika") },
  { id:"luuk-herssen",   name:"Luuk Herssen",       element:"spectro", weapon:"sword",      rarity:5, version:"3.1", img:img("luuk-herssen") },
  { id:"lynae",          name:"Lynae",              element:"spectro", weapon:"pistols",    rarity:5, version:"3.1", img:img("lynae") },
  { id:"hiyuki",         name:"Hiyuki",             element:"glacio",  weapon:"rectifier",  rarity:5, version:"3.2", img:img("hiyuki") },
  { id:"denia",          name:"Denia",              element:"fusion",  weapon:"pistols",    rarity:5, version:"3.2", img:img("denia") },
  { id:"suisui",         name:"Suisui",             element:"glacio",  weapon:"sword",      rarity:5, version:"3.3", upcoming:true, img:img("suisui") },
  { id:"yangyang-xuanling", name:"Yangyang: Xuanling", element:"havoc", weapon:"rectifier", rarity:5, version:"3.3", upcoming:true, img:img("yangyang-xuanling") },

  // ── 4★ ───────────────────────────────────────────────────────────────────
  { id:"aalto",    name:"Aalto",    element:"aero",    weapon:"pistols",    rarity:4, version:"1.0", img:img("aalto") },
  { id:"baizhi",   name:"Baizhi",   element:"glacio",  weapon:"rectifier",  rarity:4, version:"1.0", img:img("baizhi") },
  { id:"chixia",   name:"Chixia",   element:"fusion",  weapon:"pistols",    rarity:4, version:"1.0", img:img("chixia") },
  { id:"danjin",   name:"Danjin",   element:"havoc",   weapon:"sword",      rarity:4, version:"1.0", img:img("danjin") },
  { id:"mortefi",  name:"Mortefi",  element:"fusion",  weapon:"pistols",    rarity:4, version:"1.0", img:img("mortefi") },
  { id:"sanhua",   name:"Sanhua",   element:"glacio",  weapon:"sword",      rarity:4, version:"1.0", img:img("sanhua") },
  { id:"taoqi",    name:"Taoqi",    element:"havoc",   weapon:"broadblade", rarity:4, version:"1.0", img:img("taoqi") },
  { id:"yangyang", name:"Yangyang", element:"aero",    weapon:"sword",      rarity:4, version:"1.0", img:img("yangyang") },
  { id:"yuanwu",   name:"Yuanwu",   element:"electro", weapon:"gauntlets",  rarity:4, version:"1.0", img:img("yuanwu") },
  { id:"youhu",    name:"Youhu",    element:"glacio",  weapon:"pistols",    rarity:4, version:"1.1", img:img("youhu") },
  { id:"chisa",    name:"Chisa",    element:"havoc",   weapon:"gauntlets",  rarity:4, version:"1.2", img:img("chisa") },
  { id:"buling",   name:"Buling",   element:"electro", weapon:"pistols",    rarity:4, version:"1.3", img:img("buling") },
  { id:"ciaccona", name:"Ciaccona", element:"aero",    weapon:"rectifier",  rarity:4, version:"1.4", img:img("ciaccona") },
  { id:"qiuyuan",  name:"Qiuyuan",  element:"aero",    weapon:"gauntlets",  rarity:4, version:"2.0", img:img("qiuyuan") },
  { id:"lumi",     name:"Lumi",     element:"electro", weapon:"sword",      rarity:4, version:"2.1", img:img("lumi") },
  { id:"aemeath",  name:"Aemeath",  element:"fusion",  weapon:"broadblade", rarity:4, version:"2.2", img:img("aemeath") },
  { id:"rebecca",  name:"Rebecca",  element:"electro", weapon:"gauntlets",  rarity:4, version:"2.3", img:img("rebecca") },
];

export default INITIAL_CHARACTERS;
