/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DeckEditor } from './components/DeckEditor';
import { LiveStage } from './components/LiveStage';
import { SlidePreview } from './components/SlidePreview';
import { StarterPacks } from './components/StarterPacks';
import { TopBar } from './components/TopBar';
import { createDeckFromPack, STARTER_PACKS } from './data/starterPacks';
import { AppView, FeudDeck, StarterPack } from './types/feud';
import { generateFeudPptx } from './utils/pptxGenerator';

const STORAGE_KEY = 'feuddeck_studio_v1';

function loadInitialDeck(): FeudDeck {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FeudDeck;
      if (parsed && Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default pack
  }
  return createDeckFromPack(STARTER_PACKS[0]);
}

export default function App() {
  const [deck, setDeck] = useState<FeudDeck>(() => loadInitialDeck());
  const [activeView, setActiveView] = useState<AppView>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // Ignore storage quota issues
    }
  }, [deck]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const handleExportPptx = async () => {
    setIsExporting(true);
    try {
      const fileName = await generateFeudPptx(deck);
      setNotice(`Downloaded ${fileName}`);
    } catch (err) {
      console.error('PPTX export error:', err);
      setNotice('Could not generate PowerPoint file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadPack = (pack: StarterPack) => {
    setDeck(createDeckFromPack(pack));
    setActiveView('editor');
    setNotice(`Loaded "${pack.title}" into editor.`);
  };

  const handleAppendPack = (pack: StarterPack) => {
    const stamped = Date.now();
    const extraRounds = pack.rounds.map((r, rIdx) => ({
      ...r,
      id: `round-${stamped}-${rIdx}`,
      title: `Round ${deck.rounds.length + rIdx + 1}`,
      answers: r.answers.map((a, aIdx) => ({
        ...a,
        id: `ans-${stamped}-${rIdx}-${aIdx}`,
      })),
    }));
    setDeck((prev) => ({
      ...prev,
      rounds: [...prev.rounds, ...extraRounds],
    }));
    setActiveView('editor');
    setNotice(`Added ${extraRounds.length} rounds from "${pack.title}".`);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onExportPptx={handleExportPptx}
        isExporting={isExporting}
      />

      {notice && (
        <div
          role="status"
          className="mx-auto mt-4 max-w-[1440px] px-6"
        >
          <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-medium text-amber-300 hover:text-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeView === 'editor' && (
        <DeckEditor
          deck={deck}
          onChangeDeck={setDeck}
          onGoToPreview={() => setActiveView('preview')}
          onGoToStage={() => setActiveView('stage')}
        />
      )}

      {activeView === 'preview' && (
        <SlidePreview
          deck={deck}
          onExportPptx={handleExportPptx}
          isExporting={isExporting}
        />
      )}

      {activeView === 'packs' && (
        <StarterPacks
          onLoadPack={handleLoadPack}
          onAppendPack={handleAppendPack}
        />
      )}

      {activeView === 'stage' && <LiveStage deck={deck} />}
    </div>
  );
}
