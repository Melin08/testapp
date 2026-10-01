export type StatKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface Weapon {
  id: string;
  name: string;
  atk: string;
  dmg: string;
  notes: string;
}

export interface Spell {
  id: string;
  name: string;
  type: string;
  casting_time: string;
  range: string;
  duration: string;
  desc: string;
  schoolTag?: string;
  classesTag?: string;
  levelTag?: string;
  url?: string;
}

export interface Trait {
  id: string;
  name: string;
  type: string;
  desc: string;
  isExpanded?: boolean;
  classes?: string[];
  races?: string[];
  url?: string;
}

export interface DiceRollLog {
  id: string;
  desc: string;
  total: number;
  time: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  charClass: string;
  race: string;
  background: string;
  alignment: string;
  level: number;
  exp: string;
  inspiration: string;
  speed: number;
  hitDiceCur: number;
  hitDiceMax: number;
  ac: number;
  curHp: number;
  maxHp: number;
  tempHp: number;
  deathSucc: number;
  deathFail: number;
  classPtsCur: number;
  classPtsMax: number;
  exhaustion: number;
  avatar: string;
  
  // Stats & saves
  stats: Record<StatKey, number>;
  saveProficiencies: Record<StatKey, boolean>;
  
  // Skill states: p = proficient, e = expertise
  skills: Record<string, { p: boolean; e: boolean }>;
  
  // Coins
  coins: { cp: number; sp: number; gp: number; pp: number };
  
  // Spellcasting basics
  spellAbility: string;
  spellDc: string;
  spellAtkBonus: string;
  preparedCur: number;
  preparedMax: number;
  spellConcentration: string;
  
  // Slots: levels 1 to 9 [cur, max]
  slots: Record<number, { cur: number; max: number }>;
  
  // Lists
  weapons: Weapon[];
  spells: Spell[];
  traits: Trait[];
  conditions: string[];
  blurredPills: string[];
  
  // Notes & Text
  otherProfs: string;
  inventory: string;
  campaignNotes: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  npcList: string;
  
  updatedAt: number;
}
