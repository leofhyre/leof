import PptxGenJS from 'pptxgenjs';
import { BROADCAST_THEMES } from '../data/themes';
import { FeudDeck, FeudRound, SlidePreviewItem } from '../types/feud';

function hex(color: string): string {
  return color.replace('#', '').toUpperCase();
}

function buildRoundNotes(round: FeudRound, roundIdx: number): string {
  const header = `ROUND ${roundIdx + 1}: ${round.title} (${round.multiplier}x Multiplier)\nQuestion: ${round.question}\n\nHOST ANSWER KEY:\n`;
  const lines = round.answers.map(
    (ans, idx) => `${idx + 1}. ${ans.text} — ${ans.points} pts`
  );
  const rawTotal = round.answers.reduce((sum, a) => sum + a.points, 0);
  return `${header}${lines.join('\n')}\n\nRaw Total: ${rawTotal} pts | With ${round.multiplier}x Multiplier: ${rawTotal * round.multiplier} pts`;
}

export function buildSlidePreviewList(deck: FeudDeck): SlidePreviewItem[] {
  const slides: SlidePreviewItem[] = [];
  let num = 1;

  // 1. Title Slide
  slides.push({
    id: 'slide-title',
    slideNumber: num++,
    kind: 'title',
    label: 'Title Slide',
    title: deck.showTitle || 'FAMILY FEUD',
    subtitle: deck.subtitle || 'Custom Edition',
    notes: `Welcome Slide\nMatchup: ${deck.teamOneName} vs ${deck.teamTwoName}\nTotal Rounds: ${deck.rounds.length}`,
  });

  // 2. Rules Slide (optional)
  if (deck.includeRulesSlide) {
    slides.push({
      id: 'slide-rules',
      slideNumber: num++,
      kind: 'rules',
      label: 'Game Rules',
      title: 'How to Play',
      subtitle: 'Official Survey Rules & Scoring',
      notes:
        'Explain the 4 steps before starting Round 1:\n1. Face-Off at the podium\n2. Play or Pass\n3. Three Strikes & Steal\n4. Point Multipliers in later rounds',
    });
  }

  // 3. Round Slides
  deck.rounds.forEach((round, rIdx) => {
    const roundNotes = buildRoundNotes(round, rIdx);
    const roundLabel = `${round.title || `Round ${rIdx + 1}`}`;

    if (deck.exportMode === 'host_and_board') {
      slides.push({
        id: `slide-r${rIdx}-intro`,
        slideNumber: num++,
        kind: 'round_intro',
        label: `${roundLabel} · Question`,
        title: roundLabel,
        question: round.question,
        multiplier: round.multiplier,
        answers: round.answers,
        notes: roundNotes,
      });

      slides.push({
        id: `slide-r${rIdx}-board`,
        slideNumber: num++,
        kind: 'round_board',
        label: `${roundLabel} · Board (Hidden)`,
        title: roundLabel,
        question: round.question,
        multiplier: round.multiplier,
        answers: round.answers,
        revealedCount: 0,
        revealAll: false,
        notes: roundNotes,
      });

      slides.push({
        id: `slide-r${rIdx}-key`,
        slideNumber: num++,
        kind: 'round_answer_key',
        label: `${roundLabel} · Full Answers`,
        title: roundLabel,
        question: round.question,
        multiplier: round.multiplier,
        answers: round.answers,
        revealedCount: round.answers.length,
        revealAll: true,
        notes: roundNotes,
      });
    } else if (deck.exportMode === 'progressive_reveal') {
      slides.push({
        id: `slide-r${rIdx}-intro`,
        slideNumber: num++,
        kind: 'round_intro',
        label: `${roundLabel} · Question`,
        title: roundLabel,
        question: round.question,
        multiplier: round.multiplier,
        answers: round.answers,
        notes: roundNotes,
      });

      // Step 0 (all hidden) through Step N (all revealed)
      for (let step = 0; step <= round.answers.length; step++) {
        slides.push({
          id: `slide-r${rIdx}-step-${step}`,
          slideNumber: num++,
          kind: step === round.answers.length ? 'round_answer_key' : 'round_board',
          label:
            step === 0
              ? `${roundLabel} · Blank Board`
              : `${roundLabel} · Reveal ${step}/${round.answers.length}`,
          title: roundLabel,
          question: round.question,
          multiplier: round.multiplier,
          answers: round.answers,
          revealedCount: step,
          revealAll: step === round.answers.length,
          notes: roundNotes,
        });
      }
    } else {
      // board_only
      slides.push({
        id: `slide-r${rIdx}-only`,
        slideNumber: num++,
        kind: 'round_answer_key',
        label: `${roundLabel} · Answer Board`,
        title: roundLabel,
        question: round.question,
        multiplier: round.multiplier,
        answers: round.answers,
        revealedCount: round.answers.length,
        revealAll: true,
        notes: roundNotes,
      });
    }
  });

  // 4. Fast Money (optional)
  if (deck.includeFastMoney && deck.fastMoneyQuestions.length > 0) {
    const fmNotes = deck.fastMoneyQuestions
      .map((q, i) => `${i + 1}. ${q.prompt}\n   Top Answer: ${q.topAnswer} (${q.topPoints} pts)`)
      .join('\n');

    slides.push({
      id: 'slide-fm-intro',
      slideNumber: num++,
      kind: 'fast_money_intro',
      label: 'Fast Money · Intro',
      title: 'FAST MONEY',
      subtitle: '5 Questions · 20 Seconds · 200 Points to Win',
      fastMoneyQuestions: deck.fastMoneyQuestions,
      notes: fmNotes,
    });

    slides.push({
      id: 'slide-fm-board',
      slideNumber: num++,
      kind: 'fast_money_board',
      label: 'Fast Money · Top Answers',
      title: 'Fast Money Top Survey Answers',
      fastMoneyQuestions: deck.fastMoneyQuestions,
      notes: fmNotes,
    });
  }

  // 5. Final Winner Slide
  slides.push({
    id: 'slide-winner',
    slideNumber: num++,
    kind: 'winner',
    label: 'Winner / Closing',
    title: 'Thank You for Playing!',
    subtitle: `${deck.teamOneName} vs ${deck.teamTwoName}`,
    notes: 'Announce the final scoreboard winner and award prizes.',
  });

  return slides;
}

export async function generateFeudPptx(deck: FeudDeck): Promise<string> {
  const theme = BROADCAST_THEMES[deck.themeId];
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pptx.author = 'FeudDeck Studio';
  pptx.company = 'FeudDeck Studio';
  pptx.title = deck.showTitle || 'Custom Family Feud';

  const bg = hex(theme.bgHex);
  const surface = hex(theme.surfaceHex);
  const tile = hex(theme.tileHex);
  const tileRevealed = hex(theme.tileRevealedHex);
  const tileBorder = hex(theme.tileBorderHex);
  const accent = hex(theme.accentHex);
  const accentText = hex(theme.accentTextHex);
  const textMain = hex(theme.textHex);
  const textMuted = hex(theme.mutedTextHex);

  const previewSlides = buildSlidePreviewList(deck);

  for (const item of previewSlides) {
    const slide = pptx.addSlide();
    slide.background = { color: bg };
    if (item.notes) {
      slide.addNotes(item.notes);
    }

    if (item.kind === 'title') {
      // Decorative outer broadcast border
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 0.55,
        w: 12.13,
        h: 6.4,
        rectRadius: 0.06,
        fill: { color: surface },
        line: { color: accent, width: 3 },
      });

      // Inner accent rule
      slide.addShape(pptx.ShapeType.rect, {
        x: 4.9,
        y: 1.45,
        w: 3.53,
        h: 0.06,
        fill: { color: accent },
        line: { color: accent, width: 0 },
      });

      slide.addText(item.subtitle?.toUpperCase() || 'CUSTOM EDITION', {
        x: 1.2,
        y: 0.95,
        w: 10.93,
        h: 0.45,
        fontFace: 'Arial',
        fontSize: 15,
        bold: true,
        color: accent,
        align: 'center',
        charSpacing: 3,
      });

      slide.addText(item.title || 'FAMILY FEUD', {
        x: 1.0,
        y: 1.9,
        w: 11.33,
        h: 1.8,
        fontFace: 'Arial Black',
        fontSize: 58,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      // Team vs Team matchup bar
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.75,
        y: 4.35,
        w: 4.2,
        h: 1.25,
        rectRadius: 0.08,
        fill: { color: tile },
        line: { color: tileBorder, width: 1.5 },
      });
      slide.addText(deck.teamOneName || 'Team 1', {
        x: 1.85,
        y: 4.45,
        w: 4.0,
        h: 1.05,
        fontFace: 'Arial',
        fontSize: 24,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      slide.addText('VS', {
        x: 6.05,
        y: 4.55,
        w: 1.23,
        h: 0.85,
        fontFace: 'Arial Black',
        fontSize: 26,
        bold: true,
        color: accent,
        align: 'center',
        valign: 'middle',
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.38,
        y: 4.35,
        w: 4.2,
        h: 1.25,
        rectRadius: 0.08,
        fill: { color: tile },
        line: { color: tileBorder, width: 1.5 },
      });
      slide.addText(deck.teamTwoName || 'Team 2', {
        x: 7.48,
        y: 4.45,
        w: 4.0,
        h: 1.05,
        fontFace: 'Arial',
        fontSize: 24,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      slide.addText(`${deck.rounds.length} Rounds${deck.includeFastMoney ? ' · Fast Money Finale' : ''}`, {
        x: 1.2,
        y: 6.15,
        w: 10.93,
        h: 0.4,
        fontFace: 'Arial',
        fontSize: 13,
        color: textMuted,
        align: 'center',
      });
    } else if (item.kind === 'rules') {
      slide.addText('GAME RULES', {
        x: 0.8,
        y: 0.45,
        w: 11.73,
        h: 0.4,
        fontFace: 'Arial',
        fontSize: 13,
        bold: true,
        color: accent,
        charSpacing: 3,
      });

      slide.addText('How to Play', {
        x: 0.8,
        y: 0.82,
        w: 11.73,
        h: 0.65,
        fontFace: 'Arial Black',
        fontSize: 34,
        bold: true,
        color: textMain,
      });

      const rules = [
        {
          num: '01',
          heading: 'Face-Off',
          body: 'One player from each team steps up. First to buzz in with the highest-ranking survey answer wins control of the round.',
        },
        {
          num: '02',
          heading: 'Play or Pass',
          body: 'The winning team chooses to Play the board or Pass to the opposing team. Players take turns guessing remaining answers.',
        },
        {
          num: '03',
          heading: 'Three Strikes & Steal',
          body: 'Three wrong guesses (X) give the opposing team one chance to steal all accumulated points with a single correct answer.',
        },
        {
          num: '04',
          heading: 'Point Multipliers',
          body: 'Later rounds multiply answer values by 2x or 3x. The team with the highest score advances to Fast Money.',
        },
      ];

      rules.forEach((rule, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 0.8 + col * 6.0;
        const y = 1.75 + row * 2.5;
        const w = 5.73;
        const h = 2.2;

        slide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          rectRadius: 0.06,
          fill: { color: surface },
          line: { color: tileBorder, width: 1.2 },
        });

        slide.addText(rule.num, {
          x: x + 0.3,
          y: y + 0.25,
          w: 0.8,
          h: 0.45,
          fontFace: 'Arial Black',
          fontSize: 22,
          bold: true,
          color: accent,
        });

        slide.addText(rule.heading, {
          x: x + 1.05,
          y: y + 0.25,
          w: w - 1.35,
          h: 0.45,
          fontFace: 'Arial',
          fontSize: 20,
          bold: true,
          color: textMain,
        });

        slide.addText(rule.body, {
          x: x + 0.3,
          y: y + 0.85,
          w: w - 0.6,
          h: 1.15,
          fontFace: 'Arial',
          fontSize: 14,
          color: textMuted,
          valign: 'top',
        });
      });
    } else if (item.kind === 'round_intro') {
      const multLabel = item.multiplier && item.multiplier > 1 ? ` · ${item.multiplier}x POINTS` : ' · SINGLE POINTS';

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.75,
        y: 0.65,
        w: 11.83,
        h: 6.2,
        rectRadius: 0.06,
        fill: { color: surface },
        line: { color: accent, width: 2.5 },
      });

      slide.addText(`${(item.title || 'ROUND').toUpperCase()}${multLabel}`, {
        x: 1.2,
        y: 1.35,
        w: 10.93,
        h: 0.5,
        fontFace: 'Arial',
        fontSize: 18,
        bold: true,
        color: accent,
        align: 'center',
        charSpacing: 3,
      });

      slide.addText(item.question || '', {
        x: 1.35,
        y: 2.15,
        w: 10.63,
        h: 3.0,
        fontFace: 'Arial',
        fontSize: 36,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      const ansCount = item.answers?.length ?? 0;
      slide.addText(`Top ${ansCount} Survey Answers on the Board`, {
        x: 1.2,
        y: 5.65,
        w: 10.93,
        h: 0.45,
        fontFace: 'Arial',
        fontSize: 15,
        color: textMuted,
        align: 'center',
      });
    } else if (item.kind === 'round_board' || item.kind === 'round_answer_key') {
      const answers = item.answers ?? [];
      const revealedCount = item.revealAll ? answers.length : (item.revealedCount ?? 0);
      const mult = item.multiplier ?? 1;
      const multLabel = mult > 1 ? ` · ${mult}x POINTS` : '';

      // Top Header
      slide.addText(`${(item.title || 'ROUND').toUpperCase()}${multLabel}`, {
        x: 0.75,
        y: 0.25,
        w: 11.83,
        h: 0.35,
        fontFace: 'Arial',
        fontSize: 13,
        bold: true,
        color: accent,
        align: 'center',
        charSpacing: 2.5,
      });

      slide.addText(item.question || '', {
        x: 0.75,
        y: 0.6,
        w: 11.83,
        h: 0.95,
        fontFace: 'Arial',
        fontSize: 22,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      // Outer Board Frame
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.75,
        y: 1.68,
        w: 11.83,
        h: 4.95,
        rectRadius: 0.06,
        fill: { color: surface },
        line: { color: accent, width: 2.5 },
      });

      // 8 Slots (Left col 0..3, Right col 4..7)
      for (let slot = 0; slot < 8; slot++) {
        const col = slot < 4 ? 0 : 1;
        const row = slot % 4;
        const x = col === 0 ? 1.05 : 6.83;
        const y = 1.92 + row * 1.14;
        const w = 5.45;
        const h = 0.96;

        if (slot >= answers.length) {
          // Empty recessed slot
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            rectRadius: 0.05,
            fill: { color: bg },
            line: { color: surface, width: 1 },
          });
          continue;
        }

        const ans = answers[slot];
        const isRevealed = slot < revealedCount;

        if (isRevealed) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            rectRadius: 0.05,
            fill: { color: tileRevealed },
            line: { color: accent, width: 1.75 },
          });

          // Rank + Answer Text
          slide.addText(`${slot + 1}.  ${ans.text}`, {
            x: x + 0.18,
            y: y + 0.05,
            w: w - 1.38,
            h: h - 0.1,
            fontFace: 'Arial',
            fontSize: 16,
            bold: true,
            color: textMain,
            align: 'left',
            valign: 'middle',
          });

          // Points badge on right
          slide.addShape(pptx.ShapeType.roundRect, {
            x: x + w - 1.1,
            y: y + 0.1,
            w: 0.98,
            h: h - 0.2,
            rectRadius: 0.04,
            fill: { color: accent },
            line: { color: accent, width: 0 },
          });

          slide.addText(String(ans.points), {
            x: x + w - 1.1,
            y: y + 0.1,
            w: 0.98,
            h: h - 0.2,
            fontFace: 'Arial Black',
            fontSize: 20,
            bold: true,
            color: accentText,
            align: 'center',
            valign: 'middle',
          });
        } else {
          // Hidden numbered tile
          slide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            rectRadius: 0.05,
            fill: { color: tile },
            line: { color: tileBorder, width: 1.5 },
          });

          slide.addShape(pptx.ShapeType.ellipse, {
            x: x + w / 2 - 0.36,
            y: y + h / 2 - 0.32,
            w: 0.72,
            h: 0.64,
            fill: { color: surface },
            line: { color: accent, width: 1.5 },
          });

          slide.addText(String(slot + 1), {
            x: x + w / 2 - 0.36,
            y: y + h / 2 - 0.32,
            w: 0.72,
            h: 0.64,
            fontFace: 'Arial Black',
            fontSize: 22,
            bold: true,
            color: textMain,
            align: 'center',
            valign: 'middle',
          });
        }
      }

      // Footer
      const revealedTotal = answers
        .slice(0, revealedCount)
        .reduce((sum, a) => sum + a.points, 0) * mult;

      slide.addText(`${deck.teamOneName}  vs  ${deck.teamTwoName}`, {
        x: 0.75,
        y: 6.82,
        w: 6.5,
        h: 0.35,
        fontFace: 'Arial',
        fontSize: 12,
        color: textMuted,
        align: 'left',
      });

      slide.addText(
        revealedCount > 0
          ? `Board Total: ${revealedTotal} pts${mult > 1 ? ` (${mult}x)` : ''}`
          : 'Host Answer Key included in Speaker Notes',
        {
          x: 6.75,
          y: 6.82,
          w: 5.83,
          h: 0.35,
          fontFace: 'Arial',
          fontSize: 12,
          bold: revealedCount > 0,
          color: revealedCount > 0 ? accent : textMuted,
          align: 'right',
        }
      );
    } else if (item.kind === 'fast_money_intro') {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.75,
        y: 0.65,
        w: 11.83,
        h: 6.2,
        rectRadius: 0.06,
        fill: { color: surface },
        line: { color: accent, width: 3 },
      });

      slide.addText('BONUS FINALE', {
        x: 1.2,
        y: 1.65,
        w: 10.93,
        h: 0.45,
        fontFace: 'Arial',
        fontSize: 16,
        bold: true,
        color: accent,
        align: 'center',
        charSpacing: 3,
      });

      slide.addText('FAST MONEY', {
        x: 1.2,
        y: 2.35,
        w: 10.93,
        h: 1.4,
        fontFace: 'Arial Black',
        fontSize: 56,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      slide.addText('2 Players · 5 Rapid Questions · 200 Points to Win', {
        x: 1.2,
        y: 4.15,
        w: 10.93,
        h: 0.6,
        fontFace: 'Arial',
        fontSize: 20,
        color: textMuted,
        align: 'center',
      });
    } else if (item.kind === 'fast_money_board') {
      const fm = item.fastMoneyQuestions ?? [];

      slide.addText('FAST MONEY · TOP SURVEY ANSWERS', {
        x: 0.75,
        y: 0.35,
        w: 11.83,
        h: 0.45,
        fontFace: 'Arial',
        fontSize: 16,
        bold: true,
        color: accent,
        charSpacing: 2.5,
      });

      fm.slice(0, 5).forEach((q, idx) => {
        const y = 1.05 + idx * 1.18;
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.75,
          y,
          w: 11.83,
          h: 1.0,
          rectRadius: 0.05,
          fill: { color: surface },
          line: { color: tileBorder, width: 1.2 },
        });

        slide.addText(`${idx + 1}.  ${q.prompt}`, {
          x: 0.98,
          y: y + 0.08,
          w: 6.8,
          h: 0.84,
          fontFace: 'Arial',
          fontSize: 15,
          bold: true,
          color: textMain,
          valign: 'middle',
        });

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 7.95,
          y: y + 0.14,
          w: 3.25,
          h: 0.72,
          rectRadius: 0.04,
          fill: { color: tileRevealed },
          line: { color: accent, width: 1 },
        });

        slide.addText(q.topAnswer, {
          x: 8.05,
          y: y + 0.14,
          w: 3.05,
          h: 0.72,
          fontFace: 'Arial',
          fontSize: 15,
          bold: true,
          color: textMain,
          align: 'center',
          valign: 'middle',
        });

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 11.35,
          y: y + 0.14,
          w: 1.02,
          h: 0.72,
          rectRadius: 0.04,
          fill: { color: accent },
          line: { color: accent, width: 0 },
        });

        slide.addText(String(q.topPoints), {
          x: 11.35,
          y: y + 0.14,
          w: 1.02,
          h: 0.72,
          fontFace: 'Arial Black',
          fontSize: 18,
          bold: true,
          color: accentText,
          align: 'center',
          valign: 'middle',
        });
      });
    } else if (item.kind === 'winner') {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.75,
        y: 0.65,
        w: 11.83,
        h: 6.2,
        rectRadius: 0.06,
        fill: { color: surface },
        line: { color: accent, width: 3 },
      });

      slide.addText('GAME OVER', {
        x: 1.2,
        y: 1.5,
        w: 10.93,
        h: 0.45,
        fontFace: 'Arial',
        fontSize: 16,
        bold: true,
        color: accent,
        align: 'center',
        charSpacing: 3,
      });

      slide.addText(item.title || 'Thank You for Playing!', {
        x: 1.0,
        y: 2.25,
        w: 11.33,
        h: 1.35,
        fontFace: 'Arial Black',
        fontSize: 44,
        bold: true,
        color: textMain,
        align: 'center',
        valign: 'middle',
      });

      slide.addText(item.subtitle || '', {
        x: 1.2,
        y: 4.05,
        w: 10.93,
        h: 0.6,
        fontFace: 'Arial',
        fontSize: 22,
        bold: true,
        color: textMuted,
        align: 'center',
      });
    }
  }

  const cleanSlug = (deck.showTitle || 'family-feud')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const fileName = `${cleanSlug || 'family-feud'}-deck.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;
}
