export type ThemeId = 'classic' | 'crimson' | 'emerald' | 'obsidian';

export type ExportMode = 'host_and_board' | 'progressive_reveal' | 'board_only';

export type AppView = 'editor' | 'preview' | 'packs' | 'stage';

export interface FeudAnswer {
  id: string;
  text: string;
  points: number;
}

export interface FeudRound {
  id: string;
  title: string;
  question: string;
  multiplier: 1 | 2 | 3;
  answers: FeudAnswer[];
}

export interface FastMoneyQuestion {
  id: string;
  prompt: string;
  topAnswer: string;
  topPoints: number;
}

export interface FeudDeck {
  id: string;
  showTitle: string;
  subtitle: string;
  teamOneName: string;
  teamTwoName: string;
  themeId: ThemeId;
  exportMode: ExportMode;
  includeRulesSlide: boolean;
  includeFastMoney: boolean;
  rounds: FeudRound[];
  fastMoneyQuestions: FastMoneyQuestion[];
}

export interface BroadcastTheme {
  id: ThemeId;
  name: string;
  description: string;
  bgHex: string;
  surfaceHex: string;
  tileHex: string;
  tileRevealedHex: string;
  tileBorderHex: string;
  accentHex: string;
  accentTextHex: string;
  textHex: string;
  mutedTextHex: string;
  dangerHex: string;
}

export interface StarterPack {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  recommendedTheme: ThemeId;
  showTitle: string;
  teamOneDefault: string;
  teamTwoDefault: string;
  rounds: Omit<FeudRound, 'id'>[];
  fastMoneyQuestions: FastMoneyQuestion[];
}

export type SlideKind =
  | 'title'
  | 'rules'
  | 'round_intro'
  | 'round_board'
  | 'round_answer_key'
  | 'fast_money_intro'
  | 'fast_money_board'
  | 'winner';

export interface SlidePreviewItem {
  id: string;
  slideNumber: number;
  kind: SlideKind;
  label: string;
  title: string;
  subtitle?: string;
  question?: string;
  multiplier?: 1 | 2 | 3;
  answers?: FeudAnswer[];
  revealedCount?: number;
  revealAll?: boolean;
  fastMoneyQuestions?: FastMoneyQuestion[];
  notes: string;
}
