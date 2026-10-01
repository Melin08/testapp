import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Shield, Heart, Skull, Zap, Swords, BookOpen, Scroll,
  Save, Download, Upload, Plus, Trash2, ChevronDown, ChevronUp,
  Search, Eye, EyeOff, RotateCcw, Bed, Coffee, Sparkles, ExternalLink
} from 'lucide-react';
import { CharacterSheet, StatKey, Weapon, Spell, Trait, DiceRollLog } from './types';
import {
  STAT_CONFIG, SKILLS_LIST, CONDITIONS_LIST, DND_CLASSES,
  DND_RACES_CATALOG, BUILTIN_SPELLS, BUILTIN_TRAITS
} from './constants';

const STORAGE_KEY = 'dnd5e_character_roster_clean';
const ACTIVE_ID_KEY = 'dnd5e_active_char_id';

const createDefaultSheet = (): CharacterSheet => ({
  id: 'char_' + Date.now(),
  name: 'Valeros the Brave',
  charClass: 'Fighter',
  race: 'Human',
  background: 'Soldier',
  alignment: 'Neutral Good',
  level: 3,
  exp: '900 XP',
  inspiration: 'None',
  speed: 30,
  hitDiceCur: 3,
  hitDiceMax: 3,
  ac: 16,
  curHp: 28,
  maxHp: 28,
  tempHp: 0,
  deathSucc: 0,
  deathFail: 0,
  classPtsCur: 1,
  classPtsMax: 1,
  exhaustion: 0,
  avatar: '',
  stats: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
  saveProficiencies: { str: true, con: true, dex: false, int: false, wis: false, cha: false },
  skills: {
    athl: { p: true, e: false },
    perc: { p: true, e: false },
    surv: { p: true, e: false }
  },
  coins: { cp: 15, sp: 8, gp: 45, pp: 0 },
  spellAbility: 'INT',
  spellDc: '13',
  spellAtkBonus: '+5',
  preparedCur: 2,
  preparedMax: 4,
  spellConcentration: 'None',
  slots: {
    1: { cur: 3, max: 4 },
    2: { cur: 2, max: 2 },
    3: { cur: 0, max: 0 },
    4: { cur: 0, max: 0 },
    5: { cur: 0, max: 0 },
    6: { cur: 0, max: 0 },
    7: { cur: 0, max: 0 },
    8: { cur: 0, max: 0 },
    9: { cur: 0, max: 0 }
  },
  weapons: [
    { id: 'w1', name: 'Longsword', atk: 'Melee', dmg: '1d8 + 3 slashing', notes: 'Versatile (1d10)' },
    { id: 'w2', name: 'Heavy Crossbow', atk: 'Ranged', dmg: '1d10 + 2 piercing', notes: 'Range 100/400, Loading, Two-handed' }
  ],
  spells: [...BUILTIN_SPELLS.slice(0, 2)],
  traits: [...BUILTIN_TRAITS.slice(0, 1)],
  conditions: [],
  blurredPills: [],
  otherProfs: 'All armor, shields, simple and martial weapons.\nLanguages: Common, Dwarvish.\nVehicles (land).',
  inventory: "Explorer's Pack, Chain Mail, Longsword, Heavy Crossbow, 20 bolts, iron pot, pouch with 45gp.",
  campaignNotes: 'Currently investigating the ruins of Phandelver. Looking for the lost mine map.',
  personalityTraits: 'I can stare down a hell hound without flinching. I face problems head-on.',
  ideals: 'Greater Good. Our lot is to lay down our lives in defense of others.',
  bonds: 'Those who fight beside me are those worth dying for.',
  flaws: 'My pride will probably lead to my destruction.',
  backstory: 'Former soldier of the Neverwinter guard who answered the call of adventure.',
  npcList: 'Gundren Rockseeker (Dwarf employer, missing)\nSildar Hallwinter (Allied warrior)',
  updatedAt: Date.now()
});

export default function App() {
  const [sheet, setSheet] = useState<CharacterSheet>(() => {
    try {
      const savedRoster = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedRoster) {
        const roster = JSON.parse(savedRoster);
        if (activeId && roster[activeId]) return roster[activeId];
        const firstKey = Object.keys(roster)[0];
        if (firstKey) return roster[firstKey];
      }
    } catch {
      // fallback
    }
    return createDefaultSheet();
  });

  const [activeTab, setActiveTab] = useState<'stats' | 'journal'>('stats');
  const [journalSubTab, setJournalSubTab] = useState<'notes' | 'personality' | 'npcs'>('notes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showHpModal, setShowHpModal] = useState(false);
  const [hpModalAmount, setHpModalAmount] = useState<number | ''>('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [showTraitModal, setShowTraitModal] = useState(false);
  const [spellSearchQuery, setSpellSearchQuery] = useState('');
  const [traitSearchQuery, setTraitSearchQuery] = useState('');
  const [spellFilterBook, setSpellFilterBook] = useState('');

  // Dropdown states
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showRaceDropdown, setShowRaceDropdown] = useState(false);

  // Dice History
  const [diceRolls, setDiceRolls] = useState<DiceRollLog[]>([]);
  const [latestRoll, setLatestRoll] = useState<number | string>('-');

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Auto-Save effect
  useEffect(() => {
    try {
      const savedRoster = localStorage.getItem(STORAGE_KEY);
      const roster = savedRoster ? JSON.parse(savedRoster) : {};
      roster[sheet.id] = { ...sheet, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
      localStorage.setItem(ACTIVE_ID_KEY, sheet.id);
    } catch (e) {
      console.warn('Auto-save error', e);
    }
  }, [sheet]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  }, []);

  // Proficiency bonus computed: 1 + ceil(level / 4)
  const profBonus = useMemo(() => Math.ceil(1 + (Number(sheet.level) || 1) / 4), [sheet.level]);

  // Stat Modifiers
  const statMods = useMemo(() => {
    const mods: Record<StatKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    (Object.keys(sheet.stats) as StatKey[]).forEach((key) => {
      mods[key] = Math.floor(((sheet.stats[key] ?? 10) - 10) / 2);
    });
    return mods;
  }, [sheet.stats]);

  // Passive perception and insight
  const passivePerception = useMemo(() => {
    const wisMod = statMods.wis;
    const isProf = sheet.skills.perc?.p;
    const isExp = sheet.skills.perc?.e;
    let total = wisMod;
    if (isProf) total += profBonus;
    if (isExp) total += profBonus;
    return 10 + total;
  }, [statMods.wis, sheet.skills.perc, profBonus]);

  const passiveInsight = useMemo(() => {
    const wisMod = statMods.wis;
    const isProf = sheet.skills.ins?.p;
    const isExp = sheet.skills.ins?.e;
    let total = wisMod;
    if (isProf) total += profBonus;
    if (isExp) total += profBonus;
    return 10 + total;
  }, [statMods.wis, sheet.skills.ins, profBonus]);

  // Dice rolling helper
  const rollDice = (sides: number, label?: string, modifier = 0) => {
    const natural = Math.floor(Math.random() * sides) + 1;
    const total = natural + modifier;
    const sign = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    const desc = label ? `${label} (1d${sides} ${sign})` : `1d${sides}`;
    const logItem: DiceRollLog = {
      id: Math.random().toString(),
      desc,
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setLatestRoll(total);
    setDiceRolls(prev => [logItem, ...prev.slice(0, 24)]);
  };

  // Field updates
  const updateField = <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => {
    setSheet(prev => ({ ...prev, [key]: value }));
  };

  const updateStat = (key: StatKey, value: number) => {
    setSheet(prev => ({
      ...prev,
      stats: { ...prev.stats, [key]: value }
    }));
  };

  const toggleSaveProficiency = (key: StatKey) => {
    setSheet(prev => ({
      ...prev,
      saveProficiencies: { ...prev.saveProficiencies, [key]: !prev.saveProficiencies[key] }
    }));
  };

  const toggleSkillProf = (skillKey: string) => {
    setSheet(prev => {
      const current = prev.skills[skillKey] || { p: false, e: false };
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillKey]: { ...current, p: !current.p }
        }
      };
    });
  };

  const toggleSkillExp = (skillKey: string) => {
    setSheet(prev => {
      const current = prev.skills[skillKey] || { p: false, e: false };
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillKey]: { ...current, e: !current.e }
        }
      };
    });
  };

  const toggleCondition = (cond: string) => {
    setSheet(prev => {
      const exists = prev.conditions.includes(cond);
      return {
        ...prev,
        conditions: exists ? prev.conditions.filter(c => c !== cond) : [...prev.conditions, cond]
      };
    });
  };

  const toggleBlurPill = (id: string) => {
    setSheet(prev => {
      const exists = prev.blurredPills.includes(id);
      return {
        ...prev,
        blurredPills: exists ? prev.blurredPills.filter(p => p !== id) : [...prev.blurredPills, id]
      };
    });
  };

  // HP Adjuster
  const handleHpAction = (action: 'damage' | 'heal' | 'temp') => {
    const amt = typeof hpModalAmount === 'number' ? hpModalAmount : 0;
    if (amt <= 0) return;

    setSheet(prev => {
      let curHp = prev.curHp;
      let tempHp = prev.tempHp;
      const maxHp = prev.maxHp;

      if (action === 'damage') {
        let remainingDmg = amt;
        if (tempHp > 0) {
          if (tempHp >= remainingDmg) {
            tempHp -= remainingDmg;
            remainingDmg = 0;
          } else {
            remainingDmg -= tempHp;
            tempHp = 0;
          }
        }
        curHp = Math.max(0, curHp - remainingDmg);
        showToast(`Took ${amt} damage!`);
      } else if (action === 'heal') {
        curHp = Math.min(maxHp, curHp + amt);
        showToast(`Healed for ${amt} HP!`);
      } else if (action === 'temp') {
        tempHp = Math.max(tempHp, amt);
        showToast(`Gained ${amt} Temp HP!`);
      }

      return { ...prev, curHp, tempHp };
    });

    setHpModalAmount('');
    setShowHpModal(false);
  };

  // Rest engines
  const handleShortRest = () => {
    if (sheet.hitDiceCur <= 0) {
      alert('You have no Hit Dice remaining for a short rest!');
      return;
    }
    const conMod = statMods.con;
    const dieRoll = Math.floor(Math.random() * 8) + 1;
    const regainedHp = Math.max(1, dieRoll + conMod);
    setSheet(prev => ({
      ...prev,
      curHp: Math.min(prev.maxHp, prev.curHp + regainedHp),
      hitDiceCur: Math.max(0, prev.hitDiceCur - 1)
    }));
    rollDice(8, 'Short Rest Hit Die', conMod);
    showToast(`Spent 1 Hit Die: +${regainedHp} HP!`);
  };

  const handleLongRest = () => {
    if (!window.confirm('Take a Long Rest? HP restored to max, spell slots and class points refilled, death saves reset, and up to half hit dice regained.')) return;
    setSheet(prev => {
      const regainedDice = Math.max(1, Math.floor(prev.hitDiceMax / 2));
      const newSlots: Record<number, { cur: number; max: number }> = {};
      Object.keys(prev.slots).forEach(lvlStr => {
        const lvl = Number(lvlStr);
        newSlots[lvl] = { cur: prev.slots[lvl].max, max: prev.slots[lvl].max };
      });
      return {
        ...prev,
        curHp: prev.maxHp,
        tempHp: 0,
        deathSucc: 0,
        deathFail: 0,
        classPtsCur: prev.classPtsMax,
        hitDiceCur: Math.min(prev.hitDiceMax, prev.hitDiceCur + regainedDice),
        slots: newSlots
      };
    });
    showToast('Long Rest Complete!');
  };

  // Avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        updateField('avatar', event.target.result);
        showToast('Portrait Updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Backup & Restore
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(sheet, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(sheet.name || 'character').toLowerCase().replace(/\s+/g, '_')}_sheet.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Character JSON Exported!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.stats && parsed.name) {
          setSheet({ ...parsed, id: parsed.id || 'char_' + Date.now() });
          showToast('Character Restored!');
        } else {
          alert('Invalid character backup file.');
        }
      } catch {
        alert('Could not parse character file.');
      }
    };
    reader.readAsText(file);
  };

  // Filtered spells in Compendium Modal
  const compendiumSpells = useMemo(() => {
    const q = spellSearchQuery.toLowerCase().trim();
    if (!q) return BUILTIN_SPELLS;
    return BUILTIN_SPELLS.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.classesTag && s.classesTag.toLowerCase().includes(q)) ||
      (s.schoolTag && s.schoolTag.toLowerCase().includes(q)) ||
      s.type.toLowerCase().includes(q)
    );
  }, [spellSearchQuery]);

  // Filtered spells in local spellbook
  const displayedSpellbook = useMemo(() => {
    const q = spellFilterBook.toLowerCase().trim();
    if (!q) return sheet.spells;
    return sheet.spells.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q)
    );
  }, [sheet.spells, spellFilterBook]);

  return (
    <div className="min-h-screen bg-[#07090e] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.15),rgba(255,255,255,0))] text-slate-100 p-3 sm:p-6 md:p-8 font-sans">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-2 rounded-full shadow-2xl border border-emerald-400 text-sm tracking-wide flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-[#0d121d] border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-8 backdrop-blur-md">
        {/* Top Header Utility Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-red-500 font-black">⚔</span>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              D&amp;D 5e Character Sheet
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-[#090e17] border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Compendium:</span>
              <a
                href="https://dnd5e.wikidot.com/"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                Wikidot <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-700">/</span>
              <a
                href="https://roll20.net/compendium/dnd5e/Weapons#content"
                target="_blank"
                rel="noreferrer"
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
              >
                Weapons <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </header>

        {/* Action Controls & Rest Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#090e17]/60 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Sheet Saved!')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-red-950 transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition active:scale-95"
            >
              Roster
            </button>
            <button
              onClick={() => {
                if (window.confirm('Create a new blank character?')) {
                  const newChar = createDefaultSheet();
                  newChar.id = 'char_' + Date.now();
                  newChar.name = 'New Hero';
                  setSheet(newChar);
                  showToast('New Sheet Created!');
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg transition active:scale-95"
            >
              New
            </button>
          </div>

          {/* Rests */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShortRest}
              className="bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-400 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95"
              title="Spend hit dice to recover HP"
            >
              <Coffee className="w-3.5 h-3.5" /> Short Rest
            </button>
            <button
              onClick={handleLongRest}
              className="bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95"
              title="Full recovery of HP, spell slots, class points"
            >
              <Bed className="w-3.5 h-3.5" /> Long Rest
            </button>
          </div>

          {/* Backup / Restore */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> Backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" /> Restore
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
          </div>
        </div>

        {/* Character Name & Portrait Banner */}
        <div className="flex items-center gap-4 mb-6">
          <div
            onClick={() => avatarInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 hover:border-red-500 transition cursor-pointer overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative group"
            title="Click to upload character portrait"
          >
            {sheet.avatar ? (
              <img src={sheet.avatar} alt="Character Portrait" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-500 group-hover:text-red-400">
                <Shield className="w-7 h-7" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={sheet.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Character Name"
              className="w-full text-2xl sm:text-3xl font-black bg-transparent border-b-2 border-slate-800 focus:border-red-500 outline-none px-1 py-1 text-white placeholder-slate-600 transition"
            />
          </div>
        </div>

        {/* Main Tab Controls */}
        <div className="flex gap-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-red-600 text-white shadow'
                : 'bg-[#090e17] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-4 h-4" /> Stats &amp; Equipment
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'journal'
                ? 'bg-red-600 text-white shadow'
                : 'bg-[#090e17] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scroll className="w-4 h-4" /> Notes &amp; Lore
          </button>
        </div>

        {/* TAB 1: STATS & EQUIPMENT */}
        {activeTab === 'stats' && (
          <div>
            {/* Meta Pill Rows */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              {/* Class Dropdown */}
              <div className="relative bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Class</span>
                <input
                  type="text"
                  value={sheet.charClass}
                  onFocus={() => setShowClassDropdown(true)}
                  onChange={(e) => updateField('charClass', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none w-full"
                  placeholder="Select..."
                />
                {showClassDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#131b2a] border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                    {DND_CLASSES.filter(c => c.toLowerCase().includes(sheet.charClass.toLowerCase())).map(cls => (
                      <div
                        key={cls}
                        onClick={() => {
                          updateField('charClass', cls);
                          setShowClassDropdown(false);
                        }}
                        className="px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                      >
                        {cls}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Race Dropdown */}
              <div className="relative bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Race</span>
                <input
                  type="text"
                  value={sheet.race}
                  onFocus={() => setShowRaceDropdown(true)}
                  onChange={(e) => updateField('race', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none w-full"
                  placeholder="Select..."
                />
                {showRaceDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#131b2a] border border-slate-700 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                    {DND_RACES_CATALOG.map(group => (
                      <div key={group.race}>
                        <div className="px-3 py-1 text-[10px] uppercase font-black text-slate-500 bg-[#090e17] sticky top-0">
                          {group.race}
                        </div>
                        {group.subraces.map(sub => (
                          <div
                            key={sub}
                            onClick={() => {
                              updateField('race', sub);
                              setShowRaceDropdown(false);
                            }}
                            className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                          >
                            {sub}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Background */}
              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Background</span>
                <input
                  type="text"
                  value={sheet.background}
                  onChange={(e) => updateField('background', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none"
                  placeholder="e.g. Soldier"
                />
              </div>

              {/* Alignment */}
              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Alignment</span>
                <input
                  type="text"
                  value={sheet.alignment}
                  onChange={(e) => updateField('alignment', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none"
                  placeholder="e.g. Chaotic Good"
                />
              </div>

              {/* Level */}
              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Level</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={sheet.level}
                  onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                  className="bg-transparent font-black text-sm text-red-400 outline-none"
                />
              </div>
            </div>

            {/* Meta Row 2: XP, Prof, Inspiration, Speed, Hit Dice */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Experience</span>
                <input
                  type="text"
                  value={sheet.exp}
                  onChange={(e) => updateField('exp', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none"
                  placeholder="0 XP"
                />
              </div>

              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Proficiency</span>
                <span className="font-black text-sm text-sky-400">+{profBonus}</span>
              </div>

              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Inspiration</span>
                <input
                  type="text"
                  value={sheet.inspiration}
                  onChange={(e) => updateField('inspiration', e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none"
                  placeholder="None"
                />
              </div>

              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Speed (ft)</span>
                <input
                  type="number"
                  value={sheet.speed}
                  onChange={(e) => updateField('speed', parseInt(e.target.value) || 30)}
                  className="bg-transparent font-bold text-sm text-slate-200 outline-none"
                />
              </div>

              <div className="bg-[#090e17] border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hit Dice</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={sheet.hitDiceCur}
                    onChange={(e) => updateField('hitDiceCur', parseInt(e.target.value) || 0)}
                    className="w-10 bg-transparent font-black text-sm text-white outline-none"
                  />
                  <span className="text-slate-600 font-bold">/</span>
                  <input
                    type="number"
                    value={sheet.hitDiceMax}
                    onChange={(e) => updateField('hitDiceMax', parseInt(e.target.value) || 1)}
                    className="w-10 bg-transparent font-black text-sm text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Vitals HUD Cards (AC, HP, Death Saves, Class Points) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Armor Class */}
              <div className="bg-[#131b2a] border border-slate-800 border-l-4 border-l-sky-500 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Defense</span>
                  <h4 className="font-extrabold text-white text-sm">Armor Class</h4>
                  <span className="text-xs text-slate-400">Base Protection</span>
                </div>
                <input
                  type="number"
                  value={sheet.ac}
                  onChange={(e) => updateField('ac', parseInt(e.target.value) || 10)}
                  className="w-16 h-12 text-center text-2xl font-black bg-[#090e17] border border-slate-800 rounded-lg text-sky-400 outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Hit Points Card with ± Button */}
              <div className="bg-[#131b2a] border border-slate-800 border-l-4 border-l-red-500 rounded-xl p-4 shadow-sm relative flex flex-col justify-between">
                <button
                  type="button"
                  onClick={() => setShowHpModal(true)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center font-bold text-sm transition active:scale-90"
                  title="Damage / Heal Calculator"
                >
                  ±
                </button>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Vitality</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      value={sheet.curHp}
                      onChange={(e) => updateField('curHp', parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-lg font-black text-red-400 bg-transparent outline-none"
                    />
                    <span className="text-slate-600 font-bold px-1">/</span>
                    <input
                      type="number"
                      value={sheet.maxHp}
                      onChange={(e) => updateField('maxHp', parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-lg font-black text-slate-300 bg-transparent outline-none"
                    />
                  </div>
                  {sheet.tempHp > 0 && (
                    <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md border border-sky-500/30">
                      +{sheet.tempHp}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 mt-1">Hit Points (Cur / Max)</span>
              </div>

              {/* Death Saves */}
              <div className="bg-[#131b2a] border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Mortality</span>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Succ</span>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={sheet.deathSucc}
                      onChange={(e) => updateField('deathSucc', Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-10 text-center font-black text-emerald-400 bg-[#090e17] border border-slate-800 rounded py-0.5 outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-red-400 uppercase">Fail</span>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={sheet.deathFail}
                      onChange={(e) => updateField('deathFail', Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-10 text-center font-black text-red-400 bg-[#090e17] border border-slate-800 rounded py-0.5 outline-none"
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">Death Saving Throws</span>
              </div>

              {/* Class Points / Resources */}
              <div className="bg-[#131b2a] border border-slate-800 border-l-4 border-l-purple-500 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Power</span>
                <div className="flex items-center gap-1 my-1">
                  <div className="flex items-center bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1">
                    <input
                      type="number"
                      value={sheet.classPtsCur}
                      onChange={(e) => updateField('classPtsCur', parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-lg font-black text-purple-400 bg-transparent outline-none"
                    />
                    <span className="text-slate-600 font-bold px-1">/</span>
                    <input
                      type="number"
                      value={sheet.classPtsMax}
                      onChange={(e) => updateField('classPtsMax', parseInt(e.target.value) || 0)}
                      className="w-10 text-center text-lg font-black text-slate-300 bg-transparent outline-none"
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400">Ki, Rages, Sorcery Pts</span>
              </div>
            </div>

            {/* Split Column Layout: Attributes/Skills vs Combat/Equipment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column (5 Cols): Attributes & Skills */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-500" /> Attributes
                  </h3>
                  <div className="space-y-2">
                    {(Object.keys(STAT_CONFIG) as StatKey[]).map(key => {
                      const cfg = STAT_CONFIG[key];
                      const score = sheet.stats[key] ?? 10;
                      const mod = statMods[key];
                      const isProf = sheet.saveProficiencies[key];
                      const saveTotal = isProf ? mod + profBonus : mod;

                      return (
                        <div
                          key={key}
                          className={`bg-[#131b2a] border border-slate-800 ${cfg.borderClass} border-l-4 rounded-xl p-2.5 flex items-center justify-between shadow-sm transition hover:translate-x-1`}
                        >
                          <div className="w-20">
                            <div className={`font-black text-base ${cfg.textClass}`}>{cfg.label}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">{cfg.full}</div>
                          </div>

                          <div className="bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1">
                            <input
                              type="number"
                              value={score}
                              onChange={(e) => updateStat(key, parseInt(e.target.value) || 10)}
                              className="w-10 text-center font-black text-white bg-transparent outline-none"
                            />
                          </div>

                          <div className={`w-11 h-9 rounded-lg flex items-center justify-center font-black text-sm border ${cfg.bgClass} border-slate-700/60 ${cfg.textClass}`}>
                            {mod >= 0 ? `+${mod}` : mod}
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 font-semibold select-none">
                              <input
                                type="checkbox"
                                checked={isProf}
                                onChange={() => toggleSaveProficiency(key)}
                                className="accent-red-500 w-3.5 h-3.5 rounded"
                              />
                              Save
                            </label>
                            <span className="font-extrabold text-slate-200 w-6 text-center">
                              {saveTotal >= 0 ? `+${saveTotal}` : saveTotal}
                            </span>
                            <button
                              onClick={() => rollDice(20, `${cfg.label} Save`, saveTotal)}
                              className="w-7 h-7 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center shadow transition active:scale-95"
                              title={`Roll ${cfg.full} Save`}
                            >
                              d20
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Passive Senses Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Passive Perception</span>
                    <span className="text-xl font-black text-white mt-0.5">{passivePerception}</span>
                  </div>
                  <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Passive Insight</span>
                    <span className="text-xl font-black text-white mt-0.5">{passiveInsight}</span>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-lg font-extrabold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-500" /> Skills
                  </h3>
                  <div className="space-y-1.5">
                    {SKILLS_LIST.map(skill => {
                      const skillState = sheet.skills[skill.key] || { p: false, e: false };
                      const statMod = statMods[skill.stat];
                      let total = statMod;
                      if (skillState.p) total += profBonus;
                      if (skillState.e) total += profBonus;

                      return (
                        <div
                          key={skill.key}
                          className="bg-[#131b2a] border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-2">
                            {/* Proficiency bubble */}
                            <button
                              type="button"
                              onClick={() => toggleSkillProf(skill.key)}
                              className={`w-3.5 h-3.5 rounded-full border border-slate-600 transition flex items-center justify-center ${
                                skillState.p ? 'bg-red-500 border-red-500 shadow-sm shadow-red-500' : 'bg-transparent'
                              }`}
                              title="Proficiency"
                            />
                            {/* Expertise bubble */}
                            <button
                              type="button"
                              onClick={() => toggleSkillExp(skill.key)}
                              className={`w-3.5 h-3.5 rounded-full border border-slate-600 transition flex items-center justify-center ${
                                skillState.e ? 'bg-purple-500 border-purple-500 shadow-sm shadow-purple-500' : 'bg-transparent'
                              }`}
                              title="Expertise"
                            />
                            <span className="font-semibold text-slate-200">
                              {skill.label}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold text-slate-500 bg-slate-900 px-1 py-0.5 rounded">
                              {skill.stat}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white w-6 text-right">
                              {total >= 0 ? `+${total}` : total}
                            </span>
                            <button
                              onClick={() => rollDice(20, skill.label, total)}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white font-bold text-[10px] flex items-center justify-center transition active:scale-95"
                              title={`Roll ${skill.label}`}
                            >
                              d20
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols): Dice Roller, Weapons, Conditions, Proficiencies */}
              <div className="lg:col-span-7 space-y-6">
                {/* Dice Roller */}
                <div className="bg-[#131b2a] border border-slate-800 rounded-2xl p-4 shadow-sm">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                    Quick Dice Roller
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {[20, 12, 10, 8, 6, 4].map(sides => (
                      <button
                        key={sides}
                        onClick={() => rollDice(sides)}
                        className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-3.5 py-2 rounded-lg shadow-md transition active:scale-95"
                      >
                        1d{sides}
                      </button>
                    ))}
                    <div className="ml-auto bg-gradient-to-r from-red-600 to-red-800 px-5 py-1.5 rounded-xl border border-red-400/40 shadow-lg text-center min-w-[70px]">
                      <span className="text-xl font-black text-white">{latestRoll}</span>
                    </div>
                  </div>

                  {/* Dice History */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Roll Log
                    </span>
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-xs">
                      {diceRolls.length === 0 ? (
                        <span className="text-slate-600 italic text-xs">No rolls logged yet.</span>
                      ) : (
                        diceRolls.map(log => (
                          <div key={log.id} className="flex justify-between bg-[#090e17] px-2.5 py-1 rounded border border-slate-800/80">
                            <span className="text-slate-400">{log.desc} <small className="text-slate-600">({log.time})</small></span>
                            <span className="font-extrabold text-red-400">{log.total}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Currency Bar */}
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <span>CP</span>
                    <input
                      type="number"
                      value={sheet.coins.cp}
                      onChange={(e) => updateField('coins', { ...sheet.coins, cp: parseInt(e.target.value) || 0 })}
                      className="w-14 bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-white font-extrabold text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <span>SP</span>
                    <input
                      type="number"
                      value={sheet.coins.sp}
                      onChange={(e) => updateField('coins', { ...sheet.coins, sp: parseInt(e.target.value) || 0 })}
                      className="w-14 bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-white font-extrabold text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span>GP</span>
                    <input
                      type="number"
                      value={sheet.coins.gp}
                      onChange={(e) => updateField('coins', { ...sheet.coins, gp: parseInt(e.target.value) || 0 })}
                      className="w-14 bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-white font-extrabold text-center outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                    <span>PP</span>
                    <input
                      type="number"
                      value={sheet.coins.pp}
                      onChange={(e) => updateField('coins', { ...sheet.coins, pp: parseInt(e.target.value) || 0 })}
                      className="w-14 bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-white font-extrabold text-center outline-none"
                    />
                  </div>
                </div>

                {/* Weapons & Attacks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Swords className="w-5 h-5 text-red-500" /> Weapons &amp; Attacks
                    </h3>
                    <button
                      onClick={() => {
                        const newWeapon: Weapon = {
                          id: 'w_' + Date.now(),
                          name: 'New Weapon',
                          atk: 'Melee',
                          dmg: '1d6',
                          notes: ''
                        };
                        updateField('weapons', [...sheet.weapons, newWeapon]);
                      }}
                      className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Weapon
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sheet.weapons.map((wpn, idx) => (
                      <div
                        key={wpn.id || idx}
                        className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={wpn.name}
                          onChange={(e) => {
                            const updated = [...sheet.weapons];
                            updated[idx].name = e.target.value;
                            updateField('weapons', updated);
                          }}
                          placeholder="Weapon name..."
                          className="sm:col-span-4 bg-[#090e17] border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm font-bold text-white outline-none"
                        />
                        <input
                          type="text"
                          value={wpn.atk}
                          onChange={(e) => {
                            const updated = [...sheet.weapons];
                            updated[idx].atk = e.target.value;
                            updateField('weapons', updated);
                          }}
                          placeholder="Type / Atk"
                          className="sm:col-span-2 bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-sky-400 text-center uppercase outline-none"
                        />
                        <input
                          type="text"
                          value={wpn.dmg}
                          onChange={(e) => {
                            const updated = [...sheet.weapons];
                            updated[idx].dmg = e.target.value;
                            updateField('weapons', updated);
                          }}
                          placeholder="Damage"
                          className="sm:col-span-2 bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-red-400 text-center outline-none"
                        />
                        <input
                          type="text"
                          value={wpn.notes}
                          onChange={(e) => {
                            const updated = [...sheet.weapons];
                            updated[idx].notes = e.target.value;
                            updateField('weapons', updated);
                          }}
                          placeholder="Properties / Notes"
                          className="sm:col-span-3 bg-[#090e17] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none"
                        />
                        <button
                          onClick={() => {
                            const updated = sheet.weapons.filter((_, i) => i !== idx);
                            updateField('weapons', updated);
                          }}
                          className="sm:col-span-1 text-slate-500 hover:text-red-400 p-1 flex justify-center transition"
                          title="Delete weapon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditions Tracker */}
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-white">Conditions Tracker</span>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-red-400 uppercase">Exhaustion:</span>
                      <input
                        type="number"
                        min={0}
                        max={6}
                        value={sheet.exhaustion}
                        onChange={(e) => updateField('exhaustion', Math.min(6, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-10 bg-[#090e17] border border-slate-800 rounded text-center font-bold text-red-400 py-0.5 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CONDITIONS_LIST.map(cond => {
                      const isActive = sheet.conditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cond)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                            isActive
                              ? 'bg-red-500/20 border-red-500 text-red-300 shadow-sm shadow-red-950'
                              : 'bg-[#090e17] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cond}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Proficiencies & Resistances */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    Proficiencies, Languages &amp; Resistances
                  </h4>
                  <textarea
                    rows={4}
                    value={sheet.otherProfs}
                    onChange={(e) => updateField('otherProfs', e.target.value)}
                    placeholder="Armor, weapons, tools, languages, damage resistances, immunities..."
                    className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-200 outline-none focus:border-red-500 transition resize-y"
                  />
                </div>

                {/* Inventory */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    Equipment &amp; Inventory
                  </h4>
                  <textarea
                    rows={5}
                    value={sheet.inventory}
                    onChange={(e) => updateField('inventory', e.target.value)}
                    placeholder="Detailed inventory, magic items, containers, quest gear..."
                    className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs leading-relaxed text-slate-200 outline-none focus:border-red-500 transition resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Abilities & Features Section */}
            <div className="mt-12 pt-8 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" /> Features, Abilities &amp; Traits
                </h3>
                <button
                  onClick={() => setShowTraitModal(true)}
                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Ability
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sheet.traits.length === 0 ? (
                  <p className="col-span-full text-slate-500 italic text-sm py-4">No abilities added yet. Click &quot;+ Add Ability&quot; to browse or add custom powers.</p>
                ) : (
                  sheet.traits.map((trait, idx) => (
                    <div
                      key={trait.id || idx}
                      className="bg-[#131b2a] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <input
                            type="text"
                            value={trait.name}
                            onChange={(e) => {
                              const updated = [...sheet.traits];
                              updated[idx].name = e.target.value;
                              updateField('traits', updated);
                            }}
                            className="bg-transparent font-extrabold text-base text-white outline-none w-full"
                          />
                          <button
                            onClick={() => {
                              const updated = sheet.traits.filter((_, i) => i !== idx);
                              updateField('traits', updated);
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Delete ability"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={trait.type}
                          onChange={(e) => {
                            const updated = [...sheet.traits];
                            updated[idx].type = e.target.value;
                            updateField('traits', updated);
                          }}
                          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded outline-none mb-2"
                        />
                        <textarea
                          rows={trait.isExpanded ? 6 : 3}
                          value={trait.desc}
                          onChange={(e) => {
                            const updated = [...sheet.traits];
                            updated[idx].desc = e.target.value;
                            updateField('traits', updated);
                          }}
                          placeholder="Ability rules and effects..."
                          className="w-full bg-[#090e17] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none resize-y leading-relaxed"
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...sheet.traits];
                            updated[idx].isExpanded = !updated[idx].isExpanded;
                            updateField('traits', updated);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-red-400 flex items-center gap-1"
                        >
                          {trait.isExpanded ? (
                            <>Collapse <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Expand <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Spells & Interactive Spell Slots Section */}
            <div className="mt-12 pt-8 border-t border-slate-800">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  <BookOpen className="w-6 h-6 text-red-500" /> Spellcasting
                </h3>
              </div>

              {/* Spell Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8">
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Spell Ability</span>
                  <input
                    type="text"
                    value={sheet.spellAbility}
                    onChange={(e) => updateField('spellAbility', e.target.value)}
                    className="w-full text-center bg-transparent font-black text-base text-sky-400 outline-none uppercase"
                  />
                </div>
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Save DC</span>
                  <input
                    type="text"
                    value={sheet.spellDc}
                    onChange={(e) => updateField('spellDc', e.target.value)}
                    className="w-full text-center bg-transparent font-black text-base text-white outline-none"
                  />
                </div>
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Atk Bonus</span>
                  <input
                    type="text"
                    value={sheet.spellAtkBonus}
                    onChange={(e) => updateField('spellAtkBonus', e.target.value)}
                    className="w-full text-center bg-transparent font-black text-base text-white outline-none"
                  />
                </div>
                <div className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Prepared</span>
                  <div className="flex items-center justify-center gap-1 font-black text-base">
                    <input
                      type="number"
                      value={sheet.preparedCur}
                      onChange={(e) => updateField('preparedCur', parseInt(e.target.value) || 0)}
                      className="w-8 text-center bg-transparent text-white outline-none"
                    />
                    <span className="text-slate-600">/</span>
                    <input
                      type="number"
                      value={sheet.preparedMax}
                      onChange={(e) => updateField('preparedMax', parseInt(e.target.value) || 0)}
                      className="w-8 text-center bg-transparent text-slate-400 outline-none"
                    />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-[#131b2a] border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">Concentration</span>
                  <input
                    type="text"
                    value={sheet.spellConcentration}
                    onChange={(e) => updateField('spellConcentration', e.target.value)}
                    className="w-full text-center bg-transparent font-bold text-xs text-amber-400 outline-none truncate"
                  />
                </div>
              </div>

              {/* Interactive Spell Slots (Levels 1 to 9) with clickable bubble pips */}
              <div className="mb-8">
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center block mb-3">
                  Spell Slots (Click Pips to Cast or Recover)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
                    const slotData = sheet.slots[lvl] || { cur: 0, max: 0 };
                    const suffix = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'][lvl - 1];

                    return (
                      <div
                        key={lvl}
                        className="bg-[#131b2a] border border-slate-800 rounded-xl p-2 flex flex-col items-center justify-between min-h-[115px] shadow-sm"
                      >
                        <span className="text-[10px] font-black uppercase text-slate-400">{suffix}</span>

                        {/* Interactive Pips */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 my-2 min-h-[22px]">
                          {slotData.max === 0 ? (
                            <span className="text-[9px] text-slate-600 italic">None</span>
                          ) : (
                            Array.from({ length: slotData.max }).map((_, pipIdx) => {
                              const isFilled = pipIdx < slotData.cur;
                              return (
                                <button
                                  key={pipIdx}
                                  type="button"
                                  onClick={() => {
                                    const newCur = isFilled ? pipIdx : Math.max(slotData.cur, pipIdx + 1);
                                    updateField('slots', {
                                      ...sheet.slots,
                                      [lvl]: { ...slotData, cur: newCur }
                                    });
                                  }}
                                  className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer ${
                                    isFilled
                                      ? 'bg-sky-400 border-sky-300 shadow-sm shadow-sky-400 scale-105'
                                      : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                                  }`}
                                  title={isFilled ? 'Click to expend slot' : 'Click to restore slot'}
                                />
                              );
                            })
                          )}
                        </div>

                        {/* Direct Number inputs */}
                        <div className="flex items-center justify-center bg-[#090e17] border border-slate-800 rounded px-1.5 py-0.5 text-xs">
                          <input
                            type="number"
                            min={0}
                            value={slotData.cur}
                            onChange={(e) => {
                              const newCur = parseInt(e.target.value) || 0;
                              updateField('slots', {
                                ...sheet.slots,
                                [lvl]: { ...slotData, cur: newCur }
                              });
                            }}
                            className="w-5 text-center font-bold text-white bg-transparent outline-none"
                          />
                          <span className="text-slate-600">/</span>
                          <input
                            type="number"
                            min={0}
                            value={slotData.max}
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value) || 0;
                              updateField('slots', {
                                ...sheet.slots,
                                [lvl]: { ...slotData, max: newMax }
                              });
                            }}
                            className="w-5 text-center font-bold text-slate-400 bg-transparent outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spell List */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={spellFilterBook}
                        onChange={(e) => setSpellFilterBook(e.target.value)}
                        placeholder="Filter known spells..."
                        className="w-full bg-[#090e17] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSpellModal(true)}
                    className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Spell
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedSpellbook.length === 0 ? (
                    <p className="col-span-full text-slate-500 italic text-sm text-center py-6">
                      No spells match your filter. Click &quot;+ Add Spell&quot; to expand your spellbook!
                    </p>
                  ) : (
                    displayedSpellbook.map((spell, idx) => (
                      <div
                        key={spell.id || idx}
                        className="bg-[#131b2a] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <input
                              type="text"
                              value={spell.name}
                              onChange={(e) => {
                                const updated = [...sheet.spells];
                                updated[idx].name = e.target.value;
                                updateField('spells', updated);
                              }}
                              className="bg-transparent font-extrabold text-base text-white outline-none w-full"
                            />
                            <button
                              onClick={() => {
                                const updated = sheet.spells.filter((_, i) => i !== idx);
                                updateField('spells', updated);
                              }}
                              className="text-slate-500 hover:text-red-400 p-1"
                              title="Delete spell"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-2 mb-3">
                            <input
                              type="text"
                              value={spell.type}
                              onChange={(e) => {
                                const updated = [...sheet.spells];
                                updated[idx].type = e.target.value;
                                updateField('spells', updated);
                              }}
                              placeholder="Level"
                              className="bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-[11px] font-black text-sky-400 text-center uppercase outline-none"
                            />
                            <input
                              type="text"
                              value={spell.casting_time}
                              onChange={(e) => {
                                const updated = [...sheet.spells];
                                updated[idx].casting_time = e.target.value;
                                updateField('spells', updated);
                              }}
                              placeholder="Time"
                              className="bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300 text-center outline-none"
                            />
                            <input
                              type="text"
                              value={spell.range}
                              onChange={(e) => {
                                const updated = [...sheet.spells];
                                updated[idx].range = e.target.value;
                                updateField('spells', updated);
                              }}
                              placeholder="Range"
                              className="bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300 text-center outline-none"
                            />
                            <input
                              type="text"
                              value={spell.duration}
                              onChange={(e) => {
                                const updated = [...sheet.spells];
                                updated[idx].duration = e.target.value;
                                updateField('spells', updated);
                              }}
                              placeholder="Duration"
                              className="bg-[#090e17] border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-300 text-center outline-none"
                            />
                          </div>

                          <textarea
                            rows={3}
                            value={spell.desc}
                            onChange={(e) => {
                              const updated = [...sheet.spells];
                              updated[idx].desc = e.target.value;
                              updateField('spells', updated);
                            }}
                            placeholder="Spell details, damage formula, target rules..."
                            className="w-full bg-[#090e17] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none resize-y leading-relaxed"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NOTES & LORE */}
        {activeTab === 'journal' && (
          <div>
            <div className="flex gap-2 border-b border-slate-800 mb-6 pb-2">
              <button
                onClick={() => setJournalSubTab('notes')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  journalSubTab === 'notes'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#090e17] text-slate-400 hover:text-white'
                }`}
              >
                Campaign Notes
              </button>
              <button
                onClick={() => setJournalSubTab('personality')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  journalSubTab === 'personality'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#090e17] text-slate-400 hover:text-white'
                }`}
              >
                Personality &amp; Lore
              </button>
              <button
                onClick={() => setJournalSubTab('npcs')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  journalSubTab === 'npcs'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#090e17] text-slate-400 hover:text-white'
                }`}
              >
                NPCs &amp; Contacts
              </button>
            </div>

            {journalSubTab === 'notes' && (
              <div>
                <h3 className="text-base font-extrabold text-white mb-2">Campaign Log &amp; Quests</h3>
                <textarea
                  rows={16}
                  value={sheet.campaignNotes}
                  onChange={(e) => updateField('campaignNotes', e.target.value)}
                  placeholder="Record your adventures, tavern rumors, maps, dungeon clues, active quests..."
                  className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-4 text-sm leading-relaxed text-slate-200 outline-none focus:border-red-500 transition resize-y font-mono"
                />
              </div>
            )}

            {journalSubTab === 'personality' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-1.5">Personality Traits</h4>
                    <textarea
                      rows={4}
                      value={sheet.personalityTraits}
                      onChange={(e) => updateField('personalityTraits', e.target.value)}
                      className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-red-500 transition resize-y"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-1.5">Ideals</h4>
                    <textarea
                      rows={4}
                      value={sheet.ideals}
                      onChange={(e) => updateField('ideals', e.target.value)}
                      className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-red-500 transition resize-y"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-1.5">Bonds</h4>
                    <textarea
                      rows={4}
                      value={sheet.bonds}
                      onChange={(e) => updateField('bonds', e.target.value)}
                      className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-red-500 transition resize-y"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-1.5">Flaws</h4>
                    <textarea
                      rows={4}
                      value={sheet.flaws}
                      onChange={(e) => updateField('flaws', e.target.value)}
                      className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-red-500 transition resize-y"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 mb-1.5">Character Backstory</h4>
                  <textarea
                    rows={8}
                    value={sheet.backstory}
                    onChange={(e) => updateField('backstory', e.target.value)}
                    placeholder="Where was your character born? Who trained them? What dark or noble secret drives them?"
                    className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-4 text-xs leading-relaxed text-slate-200 outline-none focus:border-red-500 transition resize-y"
                  />
                </div>
              </div>
            )}

            {journalSubTab === 'npcs' && (
              <div>
                <h3 className="text-base font-extrabold text-white mb-2">NPCs, Factions &amp; Allies</h3>
                <textarea
                  rows={16}
                  value={sheet.npcList}
                  onChange={(e) => updateField('npcList', e.target.value)}
                  placeholder="Names, affiliations, attitudes, contacts, debts..."
                  className="w-full bg-[#090e17] border border-slate-800 rounded-xl p-4 text-sm leading-relaxed text-slate-200 outline-none focus:border-red-500 transition resize-y font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">5e Sheet System</span>
            <span>•</span>
            <span>Auto-saving to LocalStorage</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://dnd5e.wikidot.com/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-red-400 transition"
            >
              5e SRD Reference
            </a>
          </div>
        </footer>
      </div>

      {/* HP ADJUST MODAL */}
      {showHpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d121d] border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Adjust Hit Points</h3>
              <button
                onClick={() => setShowHpModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={hpModalAmount}
                  onChange={(e) => setHpModalAmount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                  placeholder="Enter HP amount..."
                  className="w-full bg-[#090e17] border border-slate-700 rounded-xl py-3 px-4 text-center font-black text-2xl text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleHpAction('damage')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition shadow active:scale-95"
                >
                  💥 Take Damage
                </button>
                <button
                  type="button"
                  onClick={() => handleHpAction('heal')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition shadow active:scale-95"
                >
                  💚 Heal HP
                </button>
                <button
                  type="button"
                  onClick={() => handleHpAction('temp')}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition shadow active:scale-95"
                >
                  🛡 Add Temp HP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d121d] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Saved Characters</h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {(() => {
                const rosterStr = localStorage.getItem(STORAGE_KEY);
                const roster = rosterStr ? JSON.parse(rosterStr) : {};
                const keys = Object.keys(roster);
                if (keys.length === 0) {
                  return <p className="text-slate-500 italic text-sm">No characters found in storage.</p>;
                }
                return keys.map(k => {
                  const char = roster[k];
                  const isActive = char.id === sheet.id;
                  return (
                    <div
                      key={k}
                      className="bg-[#131b2a] border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-sm text-white">{char.name || 'Unnamed'}</div>
                        <div className="text-xs text-slate-400">{char.charClass} (Lvl {char.level})</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSheet(char);
                            setShowLoadModal(false);
                            showToast(`Loaded ${char.name}!`);
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 hover:bg-red-500 text-white'
                          }`}
                        >
                          {isActive ? 'Active' : 'Load'}
                        </button>
                        {keys.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${char.name}?`)) {
                                delete roster[k];
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
                                if (isActive) {
                                  const nextKey = Object.keys(roster)[0];
                                  if (nextKey) setSheet(roster[nextKey]);
                                }
                                setShowLoadModal(false);
                              }
                            }}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* SPELL COMPENDIUM MODAL */}
      {showSpellModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d121d] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">5e Spells Compendium</h3>
              <button
                onClick={() => setShowSpellModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={spellSearchQuery}
                  onChange={(e) => setSpellSearchQuery(e.target.value)}
                  placeholder="Search spells (e.g. Fireball, Shield)..."
                  className="w-full bg-[#090e17] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                />
              </div>
              <button
                onClick={() => {
                  const custom: Spell = {
                    id: 'sp_' + Date.now(),
                    name: 'New Custom Spell',
                    type: 'Level 1',
                    casting_time: '1 Action',
                    range: '30 ft',
                    duration: 'Instantaneous',
                    desc: ''
                  };
                  updateField('spells', [...sheet.spells, custom]);
                  setShowSpellModal(false);
                  showToast('Custom Spell Added!');
                }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0"
              >
                + Custom
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {compendiumSpells.map(s => (
                <div
                  key={s.name}
                  className="bg-[#131b2a] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-sm text-white">{s.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {s.type}
                      </span>
                      {s.schoolTag && (
                        <span className="bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {s.schoolTag}
                        </span>
                      )}
                      {s.classesTag && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {s.classesTag}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newSpell: Spell = { ...s, id: 'sp_' + Date.now() };
                      updateField('spells', [...sheet.spells, newSpell]);
                      setShowSpellModal(false);
                      showToast(`Added ${s.name}!`);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 transition"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRAITS & FEATURES COMPENDIUM MODAL */}
      {showTraitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d121d] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">5e Features &amp; Abilities</h3>
              <button
                onClick={() => setShowTraitModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={traitSearchQuery}
                  onChange={(e) => setTraitSearchQuery(e.target.value)}
                  placeholder="Search abilities (e.g. Rage, Action Surge)..."
                  className="w-full bg-[#090e17] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                />
              </div>
              <button
                onClick={() => {
                  const custom: Trait = {
                    id: 'tr_' + Date.now(),
                    name: 'New Custom Ability',
                    type: 'Feature',
                    desc: '',
                    isExpanded: true
                  };
                  updateField('traits', [...sheet.traits, custom]);
                  setShowTraitModal(false);
                  showToast('Custom Ability Added!');
                }}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0"
              >
                + Custom
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {BUILTIN_TRAITS.filter(t =>
                t.name.toLowerCase().includes(traitSearchQuery.toLowerCase()) ||
                (t.classes && t.classes.some(c => c.toLowerCase().includes(traitSearchQuery.toLowerCase())))
              ).map(t => (
                <div
                  key={t.name}
                  className="bg-[#131b2a] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-sm text-white">{t.name}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {t.type}
                      </span>
                      {t.classes?.map(c => (
                        <span key={c} className="text-[10px] text-slate-500 font-semibold">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newTrait: Trait = { ...t, id: 'tr_' + Date.now(), isExpanded: true };
                      updateField('traits', [...sheet.traits, newTrait]);
                      setShowTraitModal(false);
                      showToast(`Added ${t.name}!`);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 transition"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
