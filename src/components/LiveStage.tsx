import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { BROADCAST_THEMES } from '../data/themes';
import { FeudDeck } from '../types/feud';
import { soundFx } from '../utils/soundFx';

interface LiveStageProps {
  deck: FeudDeck;
}

interface FastMoneyEntry {
  p1Answer: string;
  p1Points: number;
  p2Answer: string;
  p2Points: number;
}

export function LiveStage({ deck }: LiveStageProps) {
  const theme = BROADCAST_THEMES[deck.themeId];
  const [mode, setMode] = useState<'rounds' | 'fast_money'>('rounds');
  const [roundIdx, setRoundIdx] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [strikes, setStrikes] = useState(0);
  const [strikeOverlayCount, setStrikeOverlayCount] = useState<number | null>(null);
  const [teamOneScore, setTeamOneScore] = useState(0);
  const [teamTwoScore, setTeamTwoScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [potAwarded, setPotAwarded] = useState(false);

  // 5-Second Player Turn Timer State
  const [turnSeconds, setTurnSeconds] = useState(5);
  const [turnRunning, setTurnRunning] = useState(false);
  const [autoStrikeOnTimeout, setAutoStrikeOnTimeout] = useState(true);

  // Fast Money State
  const [fmEntries, setFmEntries] = useState<Record<string, FastMoneyEntry>>({});
  const [fmDuration, setFmDuration] = useState<20 | 25>(20);
  const [fmSeconds, setFmSeconds] = useState(20);
  const [fmRunning, setFmRunning] = useState(false);

  const safeRoundIdx = Math.min(roundIdx, Math.max(0, deck.rounds.length - 1));
  const currentRound = deck.rounds[safeRoundIdx];

  useEffect(() => {
    soundFx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Clear round board when switching rounds
  const goToRound = useCallback((nextIdx: number) => {
    setRoundIdx(nextIdx);
    setRevealedIds({});
    setStrikes(0);
    setPotAwarded(false);
    setTurnRunning(false);
    setTurnSeconds(5);
  }, []);

  const roundPot = currentRound
    ? currentRound.answers.reduce(
        (sum, ans) => (revealedIds[ans.id] ? sum + ans.points : sum),
        0
      ) * currentRound.multiplier
    : 0;

  const toggleAnswer = useCallback(
    (ansId: string) => {
      setRevealedIds((prev) => {
        const nextVal = !prev[ansId];
        if (nextVal) {
          soundFx.playDing();
          setTurnRunning(false);
          setTurnSeconds(5);
        }
        return { ...prev, [ansId]: nextVal };
      });
    },
    []
  );

  const triggerStrike = useCallback(() => {
    soundFx.playStrike();
    setTurnRunning(false);
    setTurnSeconds(5);
    setStrikes((prev) => {
      const next = Math.min(3, prev + 1);
      setStrikeOverlayCount(next);
      return next;
    });
  }, []);

  const toggleTurnTimer = useCallback(() => {
    setTurnRunning((prev) => {
      if (prev) return false;
      setTurnSeconds((sec) => (sec === 0 ? 5 : sec));
      soundFx.playTick();
      return true;
    });
  }, []);

  const resetTurnTimer = useCallback(() => {
    setTurnRunning(false);
    setTurnSeconds(5);
  }, []);

  useEffect(() => {
    if (!turnRunning || mode !== 'rounds' || turnSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      const next = turnSeconds - 1;
      setTurnSeconds(next);
      if (next === 0) {
        setTurnRunning(false);
        if (autoStrikeOnTimeout) {
          soundFx.playStrike();
          setStrikes((s) => {
            const nextStrike = Math.min(3, s + 1);
            setStrikeOverlayCount(nextStrike);
            return nextStrike;
          });
        } else {
          soundFx.playStrike();
        }
      } else {
        soundFx.playTick();
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [turnRunning, turnSeconds, mode, autoStrikeOnTimeout]);

  useEffect(() => {
    if (strikeOverlayCount === null) return;
    const timer = window.setTimeout(() => {
      setStrikeOverlayCount(null);
    }, 950);
    return () => window.clearTimeout(timer);
  }, [strikeOverlayCount]);

  // Keyboard shortcuts for host (1-8 flip answers, X adds strike, T toggles 5s turn timer)
  useEffect(() => {
    if (mode !== 'rounds' || !currentRound) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key >= '1' && e.key <= '8') {
        const idx = Number(e.key) - 1;
        const ans = currentRound.answers[idx];
        if (ans) {
          toggleAnswer(ans.id);
        }
      } else if (e.key === 'x' || e.key === 'X') {
        triggerStrike();
      } else if (e.key === 't' || e.key === 'T') {
        toggleTurnTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, currentRound, toggleAnswer, triggerStrike, toggleTurnTimer]);

  // Fast Money Countdown Timer
  useEffect(() => {
    if (!fmRunning) return;
    const interval = window.setInterval(() => {
      setFmSeconds((prev) => {
        if (prev <= 1) {
          setFmRunning(false);
          soundFx.playStrike();
          return 0;
        }
        if (prev <= 6) {
          soundFx.playTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [fmRunning]);

  const handleAwardPot = (team: 1 | 2) => {
    if (roundPot <= 0) return;
    soundFx.playWinRound();
    if (team === 1) {
      setTeamOneScore((s) => s + roundPot);
    } else {
      setTeamTwoScore((s) => s + roundPot);
    }
    setPotAwarded(true);
  };

  const handleRevealAll = () => {
    if (!currentRound) return;
    soundFx.playDing();
    const all: Record<string, boolean> = {};
    currentRound.answers.forEach((a) => {
      all[a.id] = true;
    });
    setRevealedIds(all);
  };

  const handleResetBoard = () => {
    setRevealedIds({});
    setStrikes(0);
    setPotAwarded(false);
    setTurnRunning(false);
    setTurnSeconds(5);
  };

  const handleResetGame = () => {
    setTeamOneScore(0);
    setTeamTwoScore(0);
    goToRound(0);
    setFmEntries({});
    setFmRunning(false);
    setFmSeconds(fmDuration);
  };

  const fmTotal = deck.fastMoneyQuestions.reduce((sum, q) => {
    const entry = fmEntries[q.id];
    return sum + (entry?.p1Points ?? 0) + (entry?.p2Points ?? 0);
  }, 0);

  return (
    <div
      className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6"
      style={{ backgroundColor: theme.bgHex, color: theme.textHex }}
    >
      <div className="mx-auto max-w-[1320px] space-y-5">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/25 px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Stage Mode"
              className="inline-flex rounded-lg border border-white/15 bg-black/30 p-1"
            >
              <button
                type="button"
                onClick={() => setMode('rounds')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'rounds'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Main Rounds
              </button>
              {deck.includeFastMoney && (
                <button
                  type="button"
                  onClick={() => setMode('fast_money')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    mode === 'fast_money'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fast Money
                </button>
              )}
            </div>

            {mode === 'rounds' && currentRound && (
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => goToRound(Math.max(0, safeRoundIdx - 1))}
                  disabled={safeRoundIdx === 0}
                  aria-label="Previous round"
                  className="rounded-lg border border-white/15 bg-black/30 p-2 text-slate-200 hover:bg-white/10 disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-mono-num text-xs font-semibold">
                  Round {safeRoundIdx + 1} / {deck.rounds.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    goToRound(Math.min(deck.rounds.length - 1, safeRoundIdx + 1))
                  }
                  disabled={safeRoundIdx === deck.rounds.length - 1}
                  aria-label="Next round"
                  className="rounded-lg border border-white/15 bg-black/30 p-2 text-slate-200 hover:bg-white/10 disabled:opacity-35"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetGame}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Match</span>
            </button>
          </div>
        </div>

        {/* Scoreboard Bar */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px_1fr]">
          {/* Team 1 */}
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `1.5px solid ${theme.tileBorderHex}`,
            }}
          >
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold">
                {deck.teamOneName}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTeamOneScore((s) => Math.max(0, s - 10))}
                  className="rounded border border-white/20 px-2 py-0.5 font-mono-num text-xs hover:bg-white/10"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setTeamOneScore((s) => s + 10)}
                  className="rounded border border-white/20 px-2 py-0.5 font-mono-num text-xs hover:bg-white/10"
                >
                  +10
                </button>
                {mode === 'rounds' && (
                  <button
                    type="button"
                    onClick={() => handleAwardPot(1)}
                    disabled={roundPot === 0}
                    className="ml-1 inline-flex items-center gap-1 rounded bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Trophy className="h-3 w-3" aria-hidden="true" />
                    <span>Award Pot</span>
                  </button>
                )}
              </div>
            </div>
            <div className="font-mono-num text-4xl font-bold tracking-tight">
              {teamOneScore}
            </div>
          </div>

          {/* Center Pot */}
          <div
            className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: theme.accentHex }}
            >
              {mode === 'rounds'
                ? `Round Pot${currentRound && currentRound.multiplier > 1 ? ` · ${currentRound.multiplier}x` : ''}`
                : 'Fast Money Total'}
            </span>
            <span
              className="mt-0.5 font-mono-num text-4xl font-extrabold"
              style={{ color: theme.accentHex }}
            >
              {mode === 'rounds' ? roundPot : fmTotal}
            </span>
            {mode === 'rounds' && potAwarded && (
              <span className="mt-0.5 text-[11px] font-medium text-emerald-300">
                Points awarded
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div
            className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `1.5px solid ${theme.tileBorderHex}`,
            }}
          >
            <div className="font-mono-num text-4xl font-bold tracking-tight">
              {teamTwoScore}
            </div>
            <div className="min-w-0 text-right">
              <div className="truncate font-display text-lg font-bold">
                {deck.teamTwoName}
              </div>
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                {mode === 'rounds' && (
                  <button
                    type="button"
                    onClick={() => handleAwardPot(2)}
                    disabled={roundPot === 0}
                    className="mr-1 inline-flex items-center gap-1 rounded bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-40 whitespace-nowrap"
                  >
                    <Trophy className="h-3 w-3" aria-hidden="true" />
                    <span>Award Pot</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTeamTwoScore((s) => Math.max(0, s - 10))}
                  className="rounded border border-white/20 px-2 py-0.5 font-mono-num text-xs hover:bg-white/10"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setTeamTwoScore((s) => s + 10)}
                  className="rounded border border-white/20 px-2 py-0.5 font-mono-num text-xs hover:bg-white/10"
                >
                  +10
                </button>
              </div>
            </div>
          </div>
        </div>

        {mode === 'rounds' && currentRound ? (
          <>
            {/* Question Banner */}
            <div className="rounded-xl border border-white/15 bg-black/25 px-6 py-5 text-center">
              <div
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: theme.accentHex }}
              >
                {currentRound.title}
                {currentRound.multiplier > 1
                  ? ` · ${currentRound.multiplier}x Multiplier`
                  : ''}
              </div>
              <h1 className="mt-1.5 font-display text-2xl font-bold sm:text-3xl text-balance">
                {currentRound.question}
              </h1>
            </div>

            {/* 8-Slot Interactive Feud Board */}
            <div
              className="rounded-2xl p-4 sm:p-6 shadow-2xl"
              style={{
                backgroundColor: theme.surfaceHex,
                border: `3px solid ${theme.accentHex}`,
              }}
            >
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:grid-rows-4 md:grid-flow-col">
                {Array.from({ length: 8 }).map((_, slotIdx) => {
                  const ans = currentRound.answers[slotIdx];
                  if (!ans) {
                    return (
                      <div
                        key={`empty-${slotIdx}`}
                        className="h-20 rounded-xl opacity-45"
                        style={{
                          backgroundColor: theme.bgHex,
                          border: `1px solid ${theme.tileBorderHex}`,
                        }}
                      />
                    );
                  }

                  const isRevealed = Boolean(revealedIds[ans.id]);

                  return (
                    <button
                      key={ans.id}
                      type="button"
                      onClick={() => toggleAnswer(ans.id)}
                      className="perspective-1000 group h-20 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
                    >
                      <div
                        className={`transform-style-3d relative h-full w-full transition-transform duration-300 ${
                          isRevealed ? 'rotate-x-180' : ''
                        }`}
                      >
                        {/* Front (Hidden Number Tile) */}
                        <div
                          className="backface-hidden absolute inset-0 flex items-center justify-center rounded-xl transition-colors group-hover:brightness-110"
                          style={{
                            backgroundColor: theme.tileHex,
                            border: `2px solid ${theme.tileBorderHex}`,
                          }}
                        >
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-full font-mono-num text-xl font-extrabold"
                            style={{
                              backgroundColor: theme.surfaceHex,
                              border: `2px solid ${theme.accentHex}`,
                            }}
                          >
                            {slotIdx + 1}
                          </span>
                        </div>

                        {/* Back (Revealed Answer + Points) */}
                        <div
                          className="backface-hidden rotate-x-180 absolute inset-0 flex items-center justify-between rounded-xl px-4"
                          style={{
                            backgroundColor: theme.tileRevealedHex,
                            border: `2px solid ${theme.accentHex}`,
                          }}
                        >
                          <span className="truncate font-display text-lg font-bold sm:text-xl">
                            {slotIdx + 1}. {ans.text}
                          </span>
                          <span
                            className="ml-3 shrink-0 rounded-lg px-3.5 py-2 font-mono-num text-xl font-extrabold"
                            style={{
                              backgroundColor: theme.accentHex,
                              color: theme.accentTextHex,
                            }}
                          >
                            {ans.points}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Host Strikes, 5s Turn Timer & Board Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-black/25 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2" aria-label={`Strikes: ${strikes} of 3`}>
                  {[1, 2, 3].map((n) => {
                    const active = strikes >= n;
                    return (
                      <div
                        key={n}
                        className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 font-display text-2xl font-extrabold transition-colors ${
                          active
                            ? 'border-red-500 bg-red-600 text-white'
                            : 'border-white/20 bg-black/30 text-white/25'
                        }`}
                      >
                        X
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={triggerStrike}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 whitespace-nowrap"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Strike (X)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStrikes(0)}
                  className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap"
                >
                  Clear Strikes
                </button>
              </div>

              {/* 5-Second Player Turn Timer */}
              <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-white/15 bg-black/35 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Timer
                    className={`h-4 w-4 ${
                      turnSeconds === 0
                        ? 'text-red-400'
                        : turnRunning
                          ? 'text-amber-400'
                          : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    aria-live="polite"
                    className={`min-w-[68px] font-mono-num text-lg font-extrabold ${
                      turnSeconds === 0
                        ? 'text-red-400'
                        : turnSeconds <= 2 && turnRunning
                          ? 'text-amber-300'
                          : 'text-slate-100'
                    }`}
                  >
                    {turnSeconds === 0 ? 'TIME UP' : `0${turnSeconds}s`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleTurnTimer}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap"
                >
                  {turnRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{turnSeconds === 0 ? 'Restart 5s' : 'Start 5s'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetTurnTimer}
                  aria-label="Reset 5-second turn timer"
                  className="rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap"
                >
                  Reset
                </button>

                <label className="flex items-center gap-1.5 pl-1 text-xs text-slate-300 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={autoStrikeOnTimeout}
                    onChange={(e) => setAutoStrikeOnTimeout(e.target.checked)}
                    className="h-3.5 w-3.5 accent-amber-500 rounded"
                  />
                  <span>Auto-X</span>
                </label>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="hidden text-xs text-slate-400 2xl:inline">
                  Keys: 1–8 flip · X strike · T 5s timer
                </span>
                <button
                  type="button"
                  onClick={handleRevealAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-xs font-medium text-slate-100 hover:bg-white/10 whitespace-nowrap"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  <span>Reveal All</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetBoard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/30 px-3.5 py-2.5 text-xs font-medium text-slate-100 hover:bg-white/10 whitespace-nowrap"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Reset Board</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Fast Money Live Stage */
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-black/30 px-6 py-4">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Fast Money Bonus Round
                </h2>
                <p className="text-sm text-slate-300">
                  Target: 200 combined points across Player 1 & Player 2.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-white/15 bg-black/40 p-1">
                  {([20, 25] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setFmRunning(false);
                        setFmDuration(sec);
                        setFmSeconds(sec);
                      }}
                      className={`rounded-md px-2.5 py-1 font-mono-num text-xs font-semibold ${
                        fmDuration === sec
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-300'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>

                <div
                  className={`min-w-[80px] rounded-lg border px-4 py-2 text-center font-mono-num text-2xl font-extrabold ${
                    fmSeconds <= 5 && fmSeconds > 0
                      ? 'border-red-500 bg-red-600/20 text-red-300'
                      : 'border-amber-500/50 bg-black/40 text-amber-400'
                  }`}
                >
                  {String(fmSeconds).padStart(2, '0')}s
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (fmSeconds === 0) setFmSeconds(fmDuration);
                    setFmRunning((r) => !r);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  {fmRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Start Timer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div
              className="rounded-xl p-5 space-y-3"
              style={{
                backgroundColor: theme.surfaceHex,
                border: `2px solid ${theme.accentHex}`,
              }}
            >
              {deck.fastMoneyQuestions.map((q, idx) => {
                const entry = fmEntries[q.id] ?? {
                  p1Answer: '',
                  p1Points: 0,
                  p2Answer: '',
                  p2Points: 0,
                };
                const updateEntry = (patch: Partial<FastMoneyEntry>) => {
                  setFmEntries((prev) => ({
                    ...prev,
                    [q.id]: { ...entry, ...patch },
                  }));
                };

                return (
                  <div
                    key={q.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-white/15 bg-black/25 p-3.5 lg:grid-cols-[1.2fr_1fr_80px_1fr_80px]"
                  >
                    <div className="flex flex-col justify-center">
                      <div className="text-sm font-semibold">
                        {idx + 1}. {q.prompt}
                      </div>
                      <div className="text-xs text-amber-300/80">
                        Top survey: {q.topAnswer} ({q.topPoints} pts)
                      </div>
                    </div>

                    <input
                      type="text"
                      value={entry.p1Answer}
                      onChange={(e) => updateEntry({ p1Answer: e.target.value })}
                      placeholder="Player 1 answer"
                      className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={entry.p1Points}
                      onChange={(e) =>
                        updateEntry({
                          p1Points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      aria-label={`Player 1 points question ${idx + 1}`}
                      className="rounded-md border border-white/15 bg-black/40 px-2.5 py-2 text-right font-mono-num text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                    />

                    <input
                      type="text"
                      value={entry.p2Answer}
                      onChange={(e) => updateEntry({ p2Answer: e.target.value })}
                      placeholder="Player 2 answer"
                      className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={entry.p2Points}
                      onChange={(e) =>
                        updateEntry({
                          p2Points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      aria-label={`Player 2 points question ${idx + 1}`}
                      className="rounded-md border border-white/15 bg-black/40 px-2.5 py-2 text-right font-mono-num text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2 text-sm font-semibold">
                <span>
                  {fmTotal >= 200
                    ? '200+ Points Reached — Fast Money Winner!'
                    : `${Math.max(0, 200 - fmTotal)} points needed for 200`}
                </span>
                <span className="font-mono-num text-xl text-amber-400">
                  {fmTotal} / 200
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full-Screen Strike Flash Overlay */}
      {strikeOverlayCount !== null && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-none"
        >
          <div className="flex items-center gap-6">
            {Array.from({ length: strikeOverlayCount }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-36 w-36 sm:h-48 sm:w-48 items-center justify-center rounded-2xl border-4 border-red-400 bg-red-600 shadow-2xl"
              >
                <span className="font-display text-8xl sm:text-9xl font-extrabold text-white">
                  X
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
