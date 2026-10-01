import { StatKey, Spell, Trait } from './types';

export const STAT_CONFIG: Record<StatKey, { label: string; full: string; color: string; borderClass: string; bgClass: string; textClass: string }> = {
  str: { label: 'STR', full: 'Strength', color: '#f87171', borderClass: 'border-l-red-500', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
  dex: { label: 'DEX', full: 'Dexterity', color: '#34d399', borderClass: 'border-l-emerald-500', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  con: { label: 'CON', full: 'Constitution', color: '#fb923c', borderClass: 'border-l-orange-500', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
  int: { label: 'INT', full: 'Intelligence', color: '#60a5fa', borderClass: 'border-l-blue-500', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400' },
  wis: { label: 'WIS', full: 'Wisdom', color: '#c084fc', borderClass: 'border-l-purple-500', bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  cha: { label: 'CHA', full: 'Charisma', color: '#facc15', borderClass: 'border-l-yellow-500', bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400' }
};

export const SKILLS_LIST: Array<{ key: string; label: string; stat: StatKey }> = [
  { key: 'acro', label: 'Acrobatics', stat: 'dex' },
  { key: 'anim', label: 'Animal Handling', stat: 'wis' },
  { key: 'arca', label: 'Arcana', stat: 'int' },
  { key: 'athl', label: 'Athletics', stat: 'str' },
  { key: 'dec', label: 'Deception', stat: 'cha' },
  { key: 'hist', label: 'History', stat: 'int' },
  { key: 'ins', label: 'Insight', stat: 'wis' },
  { key: 'intm', label: 'Intimidation', stat: 'cha' },
  { key: 'inv', label: 'Investigation', stat: 'int' },
  { key: 'med', label: 'Medicine', stat: 'wis' },
  { key: 'nat', label: 'Nature', stat: 'int' },
  { key: 'perc', label: 'Perception', stat: 'wis' },
  { key: 'perf', label: 'Performance', stat: 'cha' },
  { key: 'pers', label: 'Persuasion', stat: 'cha' },
  { key: 'rel', label: 'Religion', stat: 'int' },
  { key: 'slt', label: 'Sleight of Hand', stat: 'dex' },
  { key: 'ste', label: 'Stealth', stat: 'dex' },
  { key: 'surv', label: 'Survival', stat: 'wis' }
];

export const CONDITIONS_LIST = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
  'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned',
  'Prone', 'Restrained', 'Stunned', 'Unconscious'
];

export const DND_CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard', 'Artificer', 'Blood Hunter'
];

export const DND_RACES_CATALOG = [
  { race: 'Dragonborn', subraces: ['Black Dragonborn', 'Blue Dragonborn', 'Gold Dragonborn', 'Red Dragonborn', 'Silver Dragonborn'] },
  { race: 'Dwarf', subraces: ['Hill Dwarf', 'Mountain Dwarf', 'Duergar'] },
  { race: 'Elf', subraces: ['High Elf', 'Wood Elf', 'Dark Elf (Drow)', 'Eladrin'] },
  { race: 'Gnome', subraces: ['Forest Gnome', 'Rock Gnome', 'Deep Gnome'] },
  { race: 'Half-Elf', subraces: ['Half-Elf (Standard)', 'Half-Elf (Drow)', 'Half-Elf (Wood)'] },
  { race: 'Half-Orc', subraces: ['Half-Orc'] },
  { race: 'Halfling', subraces: ['Lightfoot Halfling', 'Stout Halfling', 'Ghostwise'] },
  { race: 'Human', subraces: ['Standard Human', 'Variant Human'] },
  { race: 'Tiefling', subraces: ['Bloodline of Asmodeus', 'Bloodline of Mephistopheles', 'Feral Tiefling'] },
  { race: 'Aasimar', subraces: ['Protector Aasimar', 'Scourge Aasimar', 'Fallen Aasimar'] },
  { race: 'Goliath', subraces: ['Goliath'] },
  { race: 'Tabaxi', subraces: ['Tabaxi'] },
  { race: 'Warforged', subraces: ['Warforged'] }
];

export const BUILTIN_SPELLS: Spell[] = [
  { id: 'b_hm', name: "Hunter's Mark", type: 'Level 1', casting_time: '1 Bonus Action', range: '90 ft', duration: 'Concentration, up to 1 hr', desc: 'Mark your quarry to deal an extra 1d6 weapon damage whenever you hit it.', schoolTag: 'Divination', classesTag: 'Ranger' },
  { id: 'b_sh', name: 'Shield', type: 'Level 1', casting_time: '1 Reaction', range: 'Self', duration: '1 round', desc: '+5 AC bonus until your next turn and take no magic missile damage.', schoolTag: 'Abjuration', classesTag: 'Sorcerer, Wizard' },
  { id: 'b_fb', name: 'Fireball', type: 'Level 3', casting_time: '1 Action', range: '150 ft', duration: 'Instantaneous', desc: 'A 20-foot radius burst of flame deals 8d6 fire damage on failed Dexterity save (half on success).', schoolTag: 'Evocation', classesTag: 'Sorcerer, Wizard' },
  { id: 'b_cw', name: 'Cure Wounds', type: 'Level 1', casting_time: '1 Action', range: 'Touch', duration: 'Instantaneous', desc: 'A creature you touch regains 1d8 + spellcasting modifier hit points.', schoolTag: 'Evocation', classesTag: 'Bard, Cleric, Druid, Paladin, Ranger' },
  { id: 'b_ms', name: 'Misty Step', type: 'Level 2', casting_time: '1 Bonus Action', range: 'Self', duration: 'Instantaneous', desc: 'Surrounded by silver mist, you teleport up to 30 feet to an unoccupied space you can see.', schoolTag: 'Conjuration', classesTag: 'Sorcerer, Warlock, Wizard' }
];

export const BUILTIN_TRAITS: Trait[] = [
  { id: 't_as', name: 'Action Surge', type: 'Class Feature', desc: 'On your turn, you can take one additional action on top of your regular action and possible bonus action. Once used, you must finish a short or long rest before using it again.', classes: ['Fighter'] },
  { id: 't_sa', name: 'Sneak Attack', type: 'Class Feature', desc: 'Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the roll or an ally within 5 ft.', classes: ['Rogue'] },
  { id: 't_rg', name: 'Rage', type: 'Class Feature', desc: 'In combat, you fight with primal ferocity. You gain advantage on Strength checks and saves, melee damage bonus, and resistance to bludgeoning, piercing, and slashing damage.', classes: ['Barbarian'] }
];
