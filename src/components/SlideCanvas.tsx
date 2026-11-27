import { BROADCAST_THEMES } from '../data/themes';
import { FeudDeck, SlidePreviewItem } from '../types/feud';

interface SlideCanvasProps {
  slide: SlidePreviewItem;
  deck: FeudDeck;
  compact?: boolean;
}

export function SlideCanvas({ slide, deck, compact = false }: SlideCanvasProps) {
  const theme = BROADCAST_THEMES[deck.themeId];

  return (
    <div
      className="relative w-full aspect-video overflow-hidden rounded-lg select-none"
      style={{
        backgroundColor: theme.bgHex,
        color: theme.textHex,
      }}
    >
      {slide.kind === 'title' && (
        <div className="flex h-full w-full p-[4.5%]">
          <div
            className="flex h-full w-full flex-col items-center justify-between rounded-md px-[6%] py-[5%]"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={`font-semibold uppercase tracking-[0.2em] ${
                  compact ? 'text-[7px]' : 'text-xs sm:text-sm'
                }`}
                style={{ color: theme.accentHex }}
              >
                {slide.subtitle || 'Custom Edition'}
              </span>
              <div
                className="h-0.5 w-16"
                style={{ backgroundColor: theme.accentHex }}
              />
            </div>

            <h2
              className={`font-display text-center font-extrabold tracking-tight ${
                compact ? 'text-sm' : 'text-3xl sm:text-5xl lg:text-6xl'
              }`}
              style={{ color: theme.textHex }}
            >
              {slide.title}
            </h2>

            <div className="flex w-full max-w-2xl items-center justify-center gap-4">
              <div
                className={`flex-1 rounded-md text-center font-bold ${
                  compact ? 'py-1 text-[8px]' : 'px-4 py-3 text-base sm:text-xl'
                }`}
                style={{
                  backgroundColor: theme.tileHex,
                  border: `1.5px solid ${theme.tileBorderHex}`,
                }}
              >
                <span className="block truncate">{deck.teamOneName}</span>
              </div>
              <span
                className={`font-display font-extrabold ${
                  compact ? 'text-[9px]' : 'text-lg sm:text-2xl'
                }`}
                style={{ color: theme.accentHex }}
              >
                VS
              </span>
              <div
                className={`flex-1 rounded-md text-center font-bold ${
                  compact ? 'py-1 text-[8px]' : 'px-4 py-3 text-base sm:text-xl'
                }`}
                style={{
                  backgroundColor: theme.tileHex,
                  border: `1.5px solid ${theme.tileBorderHex}`,
                }}
              >
                <span className="block truncate">{deck.teamTwoName}</span>
              </div>
            </div>

            <span
              className={compact ? 'text-[6px]' : 'text-xs sm:text-sm'}
              style={{ color: theme.mutedTextHex }}
            >
              {deck.rounds.length} Rounds
              {deck.includeFastMoney ? ' · Fast Money Finale' : ''}
            </span>
          </div>
        </div>
      )}

      {slide.kind === 'rules' && (
        <div className="flex h-full w-full flex-col justify-between p-[5%]">
          <div>
            <span
              className={`font-semibold uppercase tracking-[0.2em] ${
                compact ? 'text-[6px]' : 'text-xs'
              }`}
              style={{ color: theme.accentHex }}
            >
              Game Rules
            </span>
            <h2
              className={`font-display font-bold ${
                compact ? 'text-xs' : 'text-2xl sm:text-3xl'
              }`}
            >
              How to Play
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-[3%] flex-1 mt-[3%]">
            {[
              {
                n: '01',
                t: 'Face-Off',
                d: 'One player from each team buzzes in. Highest survey answer controls the round.',
              },
              {
                n: '02',
                t: 'Play or Pass',
                d: 'Winning team chooses to Play the board or Pass control to the other team.',
              },
              {
                n: '03',
                t: 'Three Strikes & Steal',
                d: 'Three wrong guesses give the opposing team one chance to steal all points.',
              },
              {
                n: '04',
                t: 'Point Multipliers',
                d: 'Later rounds double or triple answer points before Fast Money.',
              },
            ].map((r) => (
              <div
                key={r.n}
                className="flex flex-col justify-center rounded-md p-[6%]"
                style={{
                  backgroundColor: theme.surfaceHex,
                  border: `1px solid ${theme.tileBorderHex}`,
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-mono-num font-bold ${
                      compact ? 'text-[8px]' : 'text-base sm:text-lg'
                    }`}
                    style={{ color: theme.accentHex }}
                  >
                    {r.n}
                  </span>
                  <span
                    className={`font-bold ${
                      compact ? 'text-[8px]' : 'text-sm sm:text-lg'
                    }`}
                  >
                    {r.t}
                  </span>
                </div>
                {!compact && (
                  <p
                    className="mt-1.5 text-xs sm:text-sm leading-snug"
                    style={{ color: theme.mutedTextHex }}
                  >
                    {r.d}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.kind === 'round_intro' && (
        <div className="flex h-full w-full p-[5%]">
          <div
            className="flex h-full w-full flex-col items-center justify-center rounded-md px-[8%] text-center"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <span
              className={`font-semibold uppercase tracking-[0.2em] ${
                compact ? 'text-[7px]' : 'text-xs sm:text-sm'
              }`}
              style={{ color: theme.accentHex }}
            >
              {slide.title}
              {slide.multiplier && slide.multiplier > 1
                ? ` · ${slide.multiplier}x Points`
                : ' · Single Points'}
            </span>
            <h2
              className={`mt-3 font-display font-bold leading-tight text-balance ${
                compact ? 'text-[10px]' : 'text-xl sm:text-3xl lg:text-4xl'
              }`}
            >
              {slide.question}
            </h2>
            <span
              className={`mt-5 ${compact ? 'text-[6px]' : 'text-xs sm:text-sm'}`}
              style={{ color: theme.mutedTextHex }}
            >
              Top {slide.answers?.length ?? 0} Survey Answers on the Board
            </span>
          </div>
        </div>
      )}

      {(slide.kind === 'round_board' || slide.kind === 'round_answer_key') && (
        <div className="flex h-full w-full flex-col justify-between px-[5%] py-[3.5%]">
          <div className="text-center">
            <div
              className={`font-semibold uppercase tracking-[0.18em] ${
                compact ? 'text-[6px]' : 'text-[11px] sm:text-xs'
              }`}
              style={{ color: theme.accentHex }}
            >
              {slide.title}
              {slide.multiplier && slide.multiplier > 1
                ? ` · ${slide.multiplier}x Points`
                : ''}
            </div>
            <p
              className={`mt-0.5 font-display font-bold leading-snug line-clamp-2 ${
                compact ? 'text-[8px]' : 'text-sm sm:text-lg lg:text-xl'
              }`}
            >
              {slide.question}
            </p>
          </div>

          <div
            className="my-[2%] flex-1 rounded-md p-[2.2%]"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <div className="grid h-full grid-cols-2 grid-rows-4 grid-flow-col gap-[2.5%]">
              {Array.from({ length: 8 }).map((_, slotIdx) => {
                const answers = slide.answers ?? [];
                const revealedCount = slide.revealAll
                  ? answers.length
                  : slide.revealedCount ?? 0;

                if (slotIdx >= answers.length) {
                  return (
                    <div
                      key={slotIdx}
                      className="rounded"
                      style={{
                        backgroundColor: theme.bgHex,
                        border: `1px solid ${theme.surfaceHex}`,
                      }}
                    />
                  );
                }

                const ans = answers[slotIdx];
                const isRevealed = slotIdx < revealedCount;

                if (isRevealed) {
                  return (
                    <div
                      key={ans.id}
                      className="flex items-center justify-between rounded px-[4%]"
                      style={{
                        backgroundColor: theme.tileRevealedHex,
                        border: `1.5px solid ${theme.accentHex}`,
                      }}
                    >
                      <span
                        className={`truncate font-semibold ${
                          compact ? 'text-[7px]' : 'text-xs sm:text-sm'
                        }`}
                      >
                        {slotIdx + 1}. {ans.text}
                      </span>
                      <span
                        className={`ml-2 shrink-0 rounded font-mono-num font-bold ${
                          compact
                            ? 'px-1 py-0.5 text-[7px]'
                            : 'px-2 py-1 text-xs sm:text-sm'
                        }`}
                        style={{
                          backgroundColor: theme.accentHex,
                          color: theme.accentTextHex,
                        }}
                      >
                        {ans.points}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={ans.id}
                    className="flex items-center justify-center rounded"
                    style={{
                      backgroundColor: theme.tileHex,
                      border: `1.5px solid ${theme.tileBorderHex}`,
                    }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full font-mono-num font-bold ${
                        compact ? 'h-3 w-3 text-[7px]' : 'h-7 w-7 text-xs sm:text-sm'
                      }`}
                      style={{
                        backgroundColor: theme.surfaceHex,
                        border: `1.5px solid ${theme.accentHex}`,
                      }}
                    >
                      {slotIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`flex items-center justify-between ${
              compact ? 'text-[6px]' : 'text-[11px] sm:text-xs'
            }`}
            style={{ color: theme.mutedTextHex }}
          >
            <span className="truncate">
              {deck.teamOneName} vs {deck.teamTwoName}
            </span>
            <span className="shrink-0 font-mono-num">
              {(() => {
                const answers = slide.answers ?? [];
                const count = slide.revealAll
                  ? answers.length
                  : slide.revealedCount ?? 0;
                const mult = slide.multiplier ?? 1;
                const total =
                  answers
                    .slice(0, count)
                    .reduce((sum, a) => sum + a.points, 0) * mult;
                return count > 0
                  ? `Board: ${total} pts`
                  : 'Answer key in Speaker Notes';
              })()}
            </span>
          </div>
        </div>
      )}

      {slide.kind === 'fast_money_intro' && (
        <div className="flex h-full w-full p-[5%]">
          <div
            className="flex h-full w-full flex-col items-center justify-center rounded-md text-center px-[6%]"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <span
              className={`font-semibold uppercase tracking-[0.2em] ${
                compact ? 'text-[7px]' : 'text-xs sm:text-sm'
              }`}
              style={{ color: theme.accentHex }}
            >
              Bonus Finale
            </span>
            <h2
              className={`mt-2 font-display font-extrabold tracking-tight ${
                compact ? 'text-sm' : 'text-3xl sm:text-5xl'
              }`}
            >
              FAST MONEY
            </h2>
            <p
              className={`mt-3 ${compact ? 'text-[7px]' : 'text-sm sm:text-lg'}`}
              style={{ color: theme.mutedTextHex }}
            >
              2 Players · 5 Rapid Questions · 200 Points to Win
            </p>
          </div>
        </div>
      )}

      {slide.kind === 'fast_money_board' && (
        <div className="flex h-full w-full flex-col justify-between p-[5%]">
          <span
            className={`font-semibold uppercase tracking-[0.18em] ${
              compact ? 'text-[6px]' : 'text-xs sm:text-sm'
            }`}
            style={{ color: theme.accentHex }}
          >
            Fast Money · Top Survey Answers
          </span>
          <div className="mt-2 flex flex-1 flex-col justify-between gap-[2%]">
            {(slide.fastMoneyQuestions ?? []).slice(0, 5).map((q, idx) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-2 rounded px-[3%] py-[1.5%]"
                style={{
                  backgroundColor: theme.surfaceHex,
                  border: `1px solid ${theme.tileBorderHex}`,
                }}
              >
                <span
                  className={`truncate font-medium flex-1 ${
                    compact ? 'text-[6px]' : 'text-xs sm:text-sm'
                  }`}
                >
                  {idx + 1}. {q.prompt}
                </span>
                <span
                  className={`shrink-0 rounded font-semibold ${
                    compact
                      ? 'px-1 py-0.5 text-[6px]'
                      : 'px-2.5 py-1 text-xs sm:text-sm'
                  }`}
                  style={{
                    backgroundColor: theme.tileRevealedHex,
                    border: `1px solid ${theme.accentHex}`,
                  }}
                >
                  {q.topAnswer}
                </span>
                <span
                  className={`shrink-0 rounded font-mono-num font-bold ${
                    compact
                      ? 'px-1 py-0.5 text-[6px]'
                      : 'px-2.5 py-1 text-xs sm:text-sm'
                  }`}
                  style={{
                    backgroundColor: theme.accentHex,
                    color: theme.accentTextHex,
                  }}
                >
                  {q.topPoints}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slide.kind === 'winner' && (
        <div className="flex h-full w-full p-[5%]">
          <div
            className="flex h-full w-full flex-col items-center justify-center rounded-md text-center px-[6%]"
            style={{
              backgroundColor: theme.surfaceHex,
              border: `2px solid ${theme.accentHex}`,
            }}
          >
            <span
              className={`font-semibold uppercase tracking-[0.2em] ${
                compact ? 'text-[7px]' : 'text-xs sm:text-sm'
              }`}
              style={{ color: theme.accentHex }}
            >
              Game Over
            </span>
            <h2
              className={`mt-2 font-display font-extrabold ${
                compact ? 'text-sm' : 'text-3xl sm:text-5xl'
              }`}
            >
              {slide.title}
            </h2>
            <p
              className={`mt-3 font-medium ${
                compact ? 'text-[7px]' : 'text-base sm:text-xl'
              }`}
              style={{ color: theme.mutedTextHex }}
            >
              {slide.subtitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
