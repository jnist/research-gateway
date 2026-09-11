export const PERIODIC_TABLE_LAYOUT = [
  ['H', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'He'],
  ['Li', 'Be', null, null, null, null, null, null, null, null, null, null, 'B', 'C', 'N', 'O', 'F', 'Ne'],
  ['Na', 'Mg', null, null, null, null, null, null, null, null, null, null, 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
  ['K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'],
  ['Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe'],
  ['Cs', 'Ba', 'La', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'],
  ['Fr', 'Ra', 'Ac', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'],
];

export const LANTHANIDE_LAYOUT = [null, null, 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', null];
export const VALID_SYMBOLS = new Set([...PERIODIC_TABLE_LAYOUT.flat(), ...LANTHANIDE_LAYOUT].filter(Boolean));
const symbols = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
export const ATOMIC_NUMBERS = Object.fromEntries(symbols.map((symbol, index) => [symbol, index + 1]));
const names = '氢 氦 锂 铍 硼 碳 氮 氧 氟 氖 钠 镁 铝 硅 磷 硫 氯 氩 钾 钙 钪 钛 钒 铬 锰 铁 钴 镍 铜 锌 镓 锗 砷 硒 溴 氪 铷 锶 钇 锆 铌 钼 锝 钌 铑 钯 银 镉 铟 锡 锑 碲 碘 氙 铯 钡 镧 铈 镨 钕 钷 钐 铕 钆 铽 镝 钬 铒 铥 镱 镥 铪 钽 钨 铼 锇 铱 铂 金 汞 铊 铅 铋 钋 砹 氡 钫 镭 锕'.split(' ');
export const ELEMENT_NAMES = Object.fromEntries(symbols.map((symbol, index) => [symbol, names[index] || symbol]));
export const ENGLISH_ELEMENT_NAMES = {
  H: 'Hydrogen', He: 'Helium', Li: 'Lithium', Be: 'Beryllium', B: 'Boron',
  C: 'Carbon', N: 'Nitrogen', O: 'Oxygen', F: 'Fluorine', Ne: 'Neon',
  Na: 'Sodium', Mg: 'Magnesium', Al: 'Aluminium', Si: 'Silicon', P: 'Phosphorus',
  S: 'Sulfur', Cl: 'Chlorine', Ar: 'Argon', K: 'Potassium', Ca: 'Calcium',
  Sc: 'Scandium', Ti: 'Titanium', V: 'Vanadium', Cr: 'Chromium', Mn: 'Manganese',
  Fe: 'Iron', Co: 'Cobalt', Ni: 'Nickel', Cu: 'Copper', Zn: 'Zinc',
  Ga: 'Gallium', Ge: 'Germanium', As: 'Arsenic', Se: 'Selenium', Br: 'Bromine',
  Kr: 'Krypton', Rb: 'Rubidium', Sr: 'Strontium', Y: 'Yttrium', Zr: 'Zirconium',
  Nb: 'Niobium', Mo: 'Molybdenum', Tc: 'Technetium', Ru: 'Ruthenium', Rh: 'Rhodium',
  Pd: 'Palladium', Ag: 'Silver', Cd: 'Cadmium', In: 'Indium', Sn: 'Tin',
  Sb: 'Antimony', Te: 'Tellurium', I: 'Iodine', Xe: 'Xenon', Cs: 'Caesium',
  Ba: 'Barium', La: 'Lanthanum', Ce: 'Cerium', Pr: 'Praseodymium', Nd: 'Neodymium',
  Pm: 'Promethium', Sm: 'Samarium', Eu: 'Europium', Gd: 'Gadolinium', Tb: 'Terbium',
  Dy: 'Dysprosium', Ho: 'Holmium', Er: 'Erbium', Tm: 'Thulium', Yb: 'Ytterbium',
  Lu: 'Lutetium', Hf: 'Hafnium', Ta: 'Tantalum', W: 'Tungsten', Re: 'Rhenium',
  Os: 'Osmium', Ir: 'Iridium', Pt: 'Platinum', Au: 'Gold', Hg: 'Mercury',
  Tl: 'Thallium', Pb: 'Lead', Bi: 'Bismuth', Po: 'Polonium', At: 'Astatine',
  Rn: 'Radon', Fr: 'Francium', Ra: 'Radium', Ac: 'Actinium', Th: 'Thorium',
  Pa: 'Protactinium', U: 'Uranium', Np: 'Neptunium', Pu: 'Plutonium', Am: 'Americium',
  Cm: 'Curium', Bk: 'Berkelium', Cf: 'Californium', Es: 'Einsteinium', Fm: 'Fermium',
  Md: 'Mendelevium', No: 'Nobelium', Lr: 'Lawrencium', Rf: 'Rutherfordium', Db: 'Dubnium',
  Sg: 'Seaborgium', Bh: 'Bohrium', Hs: 'Hassium', Mt: 'Meitnerium', Ds: 'Darmstadtium',
  Rg: 'Roentgenium', Cn: 'Copernicium', Nh: 'Nihonium', Fl: 'Flerovium', Mc: 'Moscovium',
  Lv: 'Livermorium', Ts: 'Tennessine', Og: 'Oganesson',
};

export function elementMatchesQuery(symbol, input) {
  const query = input.trim().toLowerCase();
  const aliases = { Al: 'aluminum', Cs: 'cesium', S: 'sulphur' };
  return [symbol, ELEMENT_NAMES[symbol], ENGLISH_ELEMENT_NAMES[symbol], aliases[symbol]]
    .some(value => value?.toLowerCase().includes(query));
}

export function elementCategory(symbol) {
  if (['B', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'Ge', 'As', 'Se', 'Br', 'Sb', 'Te', 'I'].includes(symbol)) return 'nonmetal';
  if (LANTHANIDE_LAYOUT.includes(symbol) || symbol === 'Y' || symbol === 'Sc') return 'rare-earth';
  return 'metal';
}
