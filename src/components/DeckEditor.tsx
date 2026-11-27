import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Copy,
  FileUp,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { THEME_LIST } from '../data/themes';
import { ExportMode, FeudDeck, FeudRound } from '../types/feud';
import { buildSlidePreviewList } from '../utils/pptxGenerator';

interface DeckEditorProps {
  deck: FeudDeck;
  onChangeDeck: (next: FeudDeck) => void;
  onGoToPreview: () => void;
  onGoToStage: () => void;
}

export function DeckEditor({
  deck,
  onChangeDeck,
  onGoToPreview,
  onGoToStage,
}: DeckEditorProps) {
  const [selectedTarget, setSelectedTarget] = useState<'fast_money' | string>(
    deck.rounds[0]?.id ?? 'fast_money'
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeRound =
    selectedTarget === 'fast_money'
      ? null
      : deck.rounds.find((r) => r.id === selectedTarget) ?? deck.rounds[0] ?? null;

  const totalSlides = buildSlidePreviewList(deck).length;

  const updateField = <K extends keyof FeudDeck>(key: K, value: FeudDeck[K]) => {
    onChangeDeck({ ...deck, [key]: value });
  };

  const updateRound = (roundId: string, updater: (r: FeudRound) => FeudRound) => {
    onChangeDeck({
      ...deck,
      rounds: deck.rounds.map((r) => (r.id === roundId ? updater(r) : r)),
    });
  };

  const handleAddRound = () => {
    const newId = `round-${Date.now()}`;
    const newRound: FeudRound = {
      id: newId,
      title: `Round ${deck.rounds.length + 1}`,
      question: 'Name something people always forget when traveling.',
      multiplier: 1,
      answers: [
        { id: `ans-${Date.now()}-1`, text: 'Toothbrush / Toiletries', points: 35 },
        { id: `ans-${Date.now()}-2`, text: 'Phone charger', points: 28 },
        { id: `ans-${Date.now()}-3`, text: 'Passport / ID', points: 19 },
        { id: `ans-${Date.now()}-4`, text: 'Underwear / Socks', points: 11 },
        { id: `ans-${Date.now()}-5`, text: 'Headphones', points: 7 },
      ],
    };
    onChangeDeck({
      ...deck,
      rounds: [...deck.rounds, newRound],
    });
    setSelectedTarget(newId);
  };

  const handleDuplicateRound = (round: FeudRound) => {
    const newId = `round-${Date.now()}`;
    const copy: FeudRound = {
      ...round,
      id: newId,
      title: `${round.title} (Copy)`,
      answers: round.answers.map((a, idx) => ({
        ...a,
        id: `ans-${Date.now()}-${idx}`,
      })),
    };
    const idx = deck.rounds.findIndex((r) => r.id === round.id);
    const nextRounds = [...deck.rounds];
    nextRounds.splice(idx + 1, 0, copy);
    onChangeDeck({ ...deck, rounds: nextRounds });
    setSelectedTarget(newId);
  };

  const handleDeleteRound = (roundId: string) => {
    if (deck.rounds.length <= 1) return;
    const idx = deck.rounds.findIndex((r) => r.id === roundId);
    const nextRounds = deck.rounds.filter((r) => r.id !== roundId);
    onChangeDeck({ ...deck, rounds: nextRounds });
    const fallback = nextRounds[Math.max(0, idx - 1)]?.id ?? 'fast_money';
    setSelectedTarget(fallback);
  };

  const handleMoveRound = (index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= deck.rounds.length) return;
    const nextRounds = [...deck.rounds];
    const [item] = nextRounds.splice(index, 1);
    nextRounds.splice(targetIdx, 0, item);
    onChangeDeck({ ...deck, rounds: nextRounds });
  };

  const handleAddAnswer = (roundId: string) => {
    updateRound(roundId, (round) => {
      if (round.answers.length >= 8) return round;
      return {
        ...round,
        answers: [
          ...round.answers,
          {
            id: `ans-${Date.now()}`,
            text: '',
            points: 5,
          },
        ],
      };
    });
  };

  const handleMoveAnswer = (roundId: string, index: number, dir: -1 | 1) => {
    updateRound(roundId, (round) => {
      const targetIdx = index + dir;
      if (targetIdx < 0 || targetIdx >= round.answers.length) return round;
      const nextAnswers = [...round.answers];
      const [item] = nextAnswers.splice(index, 1);
      nextAnswers.splice(targetIdx, 0, item);
      return { ...round, answers: nextAnswers };
    });
  };

  const handleSortAnswers = (roundId: string) => {
    updateRound(roundId, (round) => ({
      ...round,
      answers: [...round.answers].sort((a, b) => b.points - a.points),
    }));
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(deck, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(deck.showTitle || 'family-feud').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FeudDeck;
        if (!parsed || !Array.isArray(parsed.rounds) || parsed.rounds.length === 0) {
          setImportError('Invalid deck file: missing rounds array.');
          return;
        }
        onChangeDeck(parsed);
        setSelectedTarget(parsed.rounds[0].id);
      } catch {
        setImportError('Could not read JSON file. Please check formatting.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Sidebar */}
        <aside className="space-y-6">
          {/* Show & Team Config */}
          <section className="rounded-xl border border-slate-800 bg-[#131C31] p-5">
            <h2 className="font-display text-sm font-bold text-slate-100">
              Show & Teams
            </h2>
            <div className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="show-title"
                  className="block text-xs font-medium text-slate-400"
                >
                  Show Title
                </label>
                <input
                  id="show-title"
                  type="text"
                  value={deck.showTitle}
                  onChange={(e) => updateField('showTitle', e.target.value)}
                  placeholder="FAMILY FEUD"
                  className="mt-1 w-full rounded-lg border border-slate-700/80 bg-[#0B1120] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="show-subtitle"
                  className="block text-xs font-medium text-slate-400"
                >
                  Event / Subtitle
                </label>
                <input
                  id="show-subtitle"
                  type="text"
                  value={deck.subtitle}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  placeholder="Year-End Party Edition"
                  className="mt-1 w-full rounded-lg border border-slate-700/80 bg-[#0B1120] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="team-one"
                    className="block text-xs font-medium text-slate-400"
                  >
                    Team 1
                  </label>
                  <input
                    id="team-one"
                    type="text"
                    value={deck.teamOneName}
                    onChange={(e) => updateField('teamOneName', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/80 bg-[#0B1120] px-2.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="team-two"
                    className="block text-xs font-medium text-slate-400"
                  >
                    Team 2
                  </label>
                  <input
                    id="team-two"
                    type="text"
                    value={deck.teamTwoName}
                    onChange={(e) => updateField('teamTwoName', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700/80 bg-[#0B1120] px-2.5 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Rounds List */}
          <section className="rounded-xl border border-slate-800 bg-[#131C31] p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-bold text-slate-100">
                Survey Rounds
              </h2>
              <button
                type="button"
                onClick={handleAddRound}
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add Round</span>
              </button>
            </div>

            <div className="mt-3 space-y-1.5">
              {deck.rounds.map((round, idx) => {
                const isSelected = activeRound?.id === round.id && selectedTarget !== 'fast_money';
                return (
                  <div
                    key={round.id}
                    className={`group flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-slate-800/80 bg-[#0B1120]/70 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTarget(round.id)}
                      className="min-w-0 flex-1 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-100 truncate">
                          {round.title || `Round ${idx + 1}`}
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono-num text-amber-400 shrink-0">
                          {round.multiplier}x
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono-num text-slate-400 shrink-0">
                          {round.answers.length} ans
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {round.question || 'Untitled question'}
                      </p>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveRound(idx, -1)}
                        disabled={idx === 0}
                        aria-label={`Move ${round.title} up`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveRound(idx, 1)}
                        disabled={idx === deck.rounds.length - 1}
                        aria-label={`Move ${round.title} down`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {deck.includeFastMoney && (
                <button
                  type="button"
                  onClick={() => setSelectedTarget('fast_money')}
                  className={`mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selectedTarget === 'fast_money'
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-slate-800/80 bg-[#0B1120]/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Fast Money Finale
                    </div>
                    <div className="text-xs text-slate-400">
                      5 rapid questions · 200 pt target
                    </div>
                  </div>
                  <span className="font-mono-num text-xs text-amber-400">
                    Bonus
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* PowerPoint Settings */}
          <section className="rounded-xl border border-slate-800 bg-[#131C31] p-5 space-y-4">
            <h2 className="font-display text-sm font-bold text-slate-100">
              PowerPoint Theme & Layout
            </h2>

            <div>
              <span className="block text-xs font-medium text-slate-400">
                Slide Color Theme
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {THEME_LIST.map((theme) => {
                  const active = deck.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateField('themeId', theme.id)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                          : 'border-slate-800 bg-[#0B1120] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
                        style={{ backgroundColor: theme.bgHex }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{theme.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-400">
                PowerPoint Slide Mode
              </span>
              <div className="mt-2 space-y-1.5">
                {(
                  [
                    {
                      id: 'host_and_board',
                      label: 'Host & Board',
                      desc: 'Question + Hidden Board + Answer Key',
                    },
                    {
                      id: 'progressive_reveal',
                      label: 'Click-Advance Reveal',
                      desc: 'Reveals 1 answer per slide click',
                    },
                    {
                      id: 'board_only',
                      label: 'Answer Key Only',
                      desc: '1 slide per round with all answers',
                    },
                  ] as { id: ExportMode; label: string; desc: string }[]
                ).map((mode) => {
                  const active = deck.exportMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateField('exportMode', mode.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-800 bg-[#0B1120] hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-slate-100">
                        {mode.label}
                      </div>
                      <div className="text-[11px] text-slate-400">{mode.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800 pt-3">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Include Rules Slide</span>
                <input
                  type="checkbox"
                  checked={deck.includeRulesSlide}
                  onChange={(e) =>
                    updateField('includeRulesSlide', e.target.checked)
                  }
                  className="h-4 w-4 accent-amber-500 rounded"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Include Fast Money Finale</span>
                <input
                  type="checkbox"
                  checked={deck.includeFastMoney}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateField('includeFastMoney', checked);
                    if (!checked && selectedTarget === 'fast_money') {
                      setSelectedTarget(deck.rounds[0]?.id ?? '');
                    }
                  }}
                  className="h-4 w-4 accent-amber-500 rounded"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
              >
                <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Load JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </div>
            {importError && (
              <p className="text-xs text-red-400">{importError}</p>
            )}
          </section>
        </aside>

        {/* Main Editor Workspace */}
        <main className="space-y-6">
          {/* Summary / Quick Navigation Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#131C31] px-6 py-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="font-display font-bold text-slate-100">
                {deck.showTitle || 'Untitled Show'}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num text-xs text-slate-400">
                {deck.rounds.length} Rounds
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num text-xs text-amber-400">
                {totalSlides} PowerPoint Slides
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onGoToPreview}
                className="rounded-lg border border-slate-700 bg-slate-800/70 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Preview Slides
              </button>
              <button
                type="button"
                onClick={onGoToStage}
                className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/25 whitespace-nowrap shrink-0"
              >
                Open Live Stage
              </button>
            </div>
          </div>

          {selectedTarget === 'fast_money' && deck.includeFastMoney ? (
            /* Fast Money Editor */
            <section className="rounded-xl border border-slate-800 bg-[#131C31] p-6">
              <div className="border-b border-slate-800 pb-4">
                <h1 className="font-display text-2xl font-bold text-slate-50">
                  Fast Money Questions
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Configure up to 5 rapid-fire bonus questions and their top survey answer for the finale slides and Live Stage.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {deck.fastMoneyQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-[#0B1120] p-4 md:grid-cols-[36px_1fr_200px_96px]"
                  >
                    <div className="flex items-center justify-center font-mono-num text-sm font-bold text-amber-400">
                      {idx + 1}
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400">
                        Prompt
                      </label>
                      <input
                        type="text"
                        value={q.prompt}
                        onChange={(e) => {
                          const next = [...deck.fastMoneyQuestions];
                          next[idx] = { ...q, prompt: e.target.value };
                          updateField('fastMoneyQuestions', next);
                        }}
                        className="mt-1 w-full rounded-md border border-slate-700/80 bg-[#131C31] px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400">
                        #1 Survey Answer
                      </label>
                      <input
                        type="text"
                        value={q.topAnswer}
                        onChange={(e) => {
                          const next = [...deck.fastMoneyQuestions];
                          next[idx] = { ...q, topAnswer: e.target.value };
                          updateField('fastMoneyQuestions', next);
                        }}
                        className="mt-1 w-full rounded-md border border-slate-700/80 bg-[#131C31] px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400">
                        Top Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.topPoints}
                        onChange={(e) => {
                          const next = [...deck.fastMoneyQuestions];
                          next[idx] = {
                            ...q,
                            topPoints: Math.max(0, Number(e.target.value) || 0),
                          };
                          updateField('fastMoneyQuestions', next);
                        }}
                        className="mt-1 w-full rounded-md border border-slate-700/80 bg-[#131C31] px-3 py-2 text-right font-mono-num text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : activeRound ? (
            /* Active Round Editor */
            <section className="rounded-xl border border-slate-800 bg-[#131C31] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={activeRound.title}
                    onChange={(e) =>
                      updateRound(activeRound.id, (r) => ({
                        ...r,
                        title: e.target.value,
                      }))
                    }
                    aria-label="Round title"
                    className="w-44 rounded-lg border border-slate-700/80 bg-[#0B1120] px-3 py-2 font-display text-lg font-bold text-slate-50 focus:border-amber-500 focus:outline-none"
                  />

                  <div
                    role="group"
                    aria-label="Point multiplier"
                    className="inline-flex items-center rounded-lg border border-slate-800 bg-[#0B1120] p-1"
                  >
                    {([1, 2, 3] as const).map((mult) => {
                      const active = activeRound.multiplier === mult;
                      return (
                        <button
                          key={mult}
                          type="button"
                          onClick={() =>
                            updateRound(activeRound.id, (r) => ({
                              ...r,
                              multiplier: mult,
                            }))
                          }
                          className={`rounded-md px-3 py-1.5 font-mono-num text-xs font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-400 hover:text-slate-100'
                          }`}
                        >
                          {mult}x Points
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateRound(activeRound)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRound(activeRound.id)}
                    disabled={deck.rounds.length <= 1}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-950/60 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Survey Question */}
              <div className="mt-5">
                <label
                  htmlFor="survey-question"
                  className="block text-xs font-medium text-slate-400"
                >
                  Survey Question
                </label>
                <textarea
                  id="survey-question"
                  rows={2}
                  value={activeRound.question}
                  onChange={(e) =>
                    updateRound(activeRound.id, (r) => ({
                      ...r,
                      question: e.target.value,
                    }))
                  }
                  placeholder="Enter the survey question for this round..."
                  className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-[#0B1120] px-4 py-3 font-display text-lg font-semibold text-slate-50 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Answers List */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">
                      Survey Answers ({activeRound.answers.length}/8)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      Raw Total:{' '}
                      {activeRound.answers.reduce((s, a) => s + a.points, 0)} pts
                    </span>
                    {activeRound.multiplier > 1 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num text-amber-400">
                          Board Total:{' '}
                          {activeRound.answers.reduce((s, a) => s + a.points, 0) *
                            activeRound.multiplier}{' '}
                          pts
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSortAnswers(activeRound.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 whitespace-nowrap"
                    >
                      <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sort by Points</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAnswer(activeRound.id)}
                      disabled={activeRound.answers.length >= 8}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add Answer</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {activeRound.answers.map((ans, idx) => (
                    <div
                      key={ans.id}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-[#0B1120] px-3 py-2"
                    >
                      <span className="w-6 text-center font-mono-num text-sm font-bold text-amber-400">
                        {idx + 1}
                      </span>

                      <input
                        type="text"
                        value={ans.text}
                        onChange={(e) =>
                          updateRound(activeRound.id, (r) => ({
                            ...r,
                            answers: r.answers.map((a) =>
                              a.id === ans.id ? { ...a, text: e.target.value } : a
                            ),
                          }))
                        }
                        placeholder={`Answer #${idx + 1}`}
                        className="min-w-0 flex-1 rounded-md border border-slate-700/70 bg-[#131C31] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={ans.points}
                          aria-label={`Points for answer ${idx + 1}`}
                          onChange={(e) =>
                            updateRound(activeRound.id, (r) => ({
                              ...r,
                              answers: r.answers.map((a) =>
                                a.id === ans.id
                                  ? {
                                      ...a,
                                      points: Math.max(
                                        0,
                                        Number(e.target.value) || 0
                                      ),
                                    }
                                  : a
                              ),
                            }))
                          }
                          className="w-20 rounded-md border border-slate-700/70 bg-[#131C31] px-2.5 py-2 text-right font-mono-num text-sm font-semibold text-amber-300 focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-500">pts</span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveAnswer(activeRound.id, idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move answer up"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAnswer(activeRound.id, idx, 1)}
                          disabled={idx === activeRound.answers.length - 1}
                          aria-label="Move answer down"
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateRound(activeRound.id, (r) => ({
                              ...r,
                              answers:
                                r.answers.length <= 1
                                  ? r.answers
                                  : r.answers.filter((a) => a.id !== ans.id),
                            }))
                          }
                          disabled={activeRound.answers.length <= 1}
                          aria-label="Remove answer"
                          className="rounded p-1.5 text-slate-400 hover:bg-red-950/60 hover:text-red-300 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
