export interface ThemeToken {
  readonly variable: string;
  readonly label: string;
  readonly defaultValue: string;
  readonly group: "Colors" | "Typography";
}

export const THEME_TOKENS: readonly ThemeToken[] = [
  { variable: "--color-paper", label: "Page background", defaultValue: "#f6f1e7", group: "Colors" },
  { variable: "--color-paper-mid", label: "Alternate background", defaultValue: "#ede8dc", group: "Colors" },
  { variable: "--color-ink", label: "Primary text", defaultValue: "#2b241b", group: "Colors" },
  { variable: "--color-muted", label: "Secondary text", defaultValue: "#8c7b6b", group: "Colors" },
  { variable: "--color-cornflower", label: "Accent / links", defaultValue: "oklch(0.52 0.09 248)", group: "Colors" },
  { variable: "--color-cornflower-pale", label: "Pale accent", defaultValue: "oklch(0.88 0.04 248)", group: "Colors" },
  { variable: "--color-peach", label: "Warm accent", defaultValue: "oklch(0.76 0.09 48)", group: "Colors" },
  { variable: "--color-lavender", label: "Lavender accent", defaultValue: "oklch(0.74 0.07 288)", group: "Colors" },
  { variable: "--color-eucalyptus", label: "Botanical green", defaultValue: "oklch(0.52 0.09 150)", group: "Colors" },
  {
    variable: "--font-serif",
    label: "Serif font stack",
    defaultValue: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
    group: "Typography",
  },
  {
    variable: "--font-sans",
    label: "Sans font stack",
    defaultValue: '"Inter", system-ui, -apple-system, sans-serif',
    group: "Typography",
  },
] as const;

export const ALLOWED_THEME_VARIABLES: ReadonlySet<string> = new Set(
  THEME_TOKENS.map((t) => t.variable),
);
