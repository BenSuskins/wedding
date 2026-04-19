type SprigVariant = "hero" | "intro" | "schedule" | "venues" | "rsvp" | "footer";

export function Sprig({ variant }: { variant: SprigVariant }) {
  switch (variant) {
    case "hero":
      return (
        <svg width="90" height="60" viewBox="0 0 90 60" fill="none" aria-hidden="true">
          <path d="M20 56 C22 44, 25 32, 28 18" stroke="var(--color-cornflower)" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
          <path d="M24 38 C18 34, 10 33, 6 30" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          <path d="M26 28 C32 24, 40 22, 46 19" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.38" />
          <path d="M30 56 C35 42, 42 28, 50 14" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <path d="M40 34 C48 30, 56 30, 62 28" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <path d="M44 26 C50 20, 58 18, 64 14" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
          <circle cx="28" cy="17" r="3" stroke="var(--color-cornflower)" strokeWidth="1.1" fill="none" opacity="0.55" />
          <circle cx="28" cy="17" r="1.2" stroke="var(--color-cornflower)" strokeWidth="0.8" fill="none" opacity="0.4" />
          <circle cx="6" cy="29" r="2.5" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="50" cy="13" r="2" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.45" />
          <circle cx="46" cy="18" r="1.3" stroke="var(--color-peach)" strokeWidth="0.9" fill="none" opacity="0.4" />
          <circle cx="62" cy="27" r="1.8" stroke="var(--color-eucalyptus)" strokeWidth="0.9" fill="none" opacity="0.3" />
        </svg>
      );
    case "intro":
      return (
        <svg width="72" height="52" viewBox="0 0 72 52" fill="none" aria-hidden="true">
          <path d="M36 48 C34 38, 30 28, 26 18" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M36 48 C37 36, 40 26, 44 14" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M36 40 C32 36, 26 34, 20 35" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M36 32 C40 28, 48 28, 52 26" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M36 44 C30 40, 22 42, 18 40" stroke="var(--color-peach)" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
          <circle cx="26" cy="17" r="2.5" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="44" cy="13" r="2" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.55" />
          <circle cx="19" cy="35" r="1.5" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="52" cy="25" r="2" stroke="var(--color-lavender)" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="17" cy="39" r="1.5" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.4" />
        </svg>
      );
    case "schedule":
      return (
        <svg width="64" height="42" viewBox="0 0 64 42" fill="none" aria-hidden="true">
          <path d="M10 38 C14 28, 20 18, 26 8" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.38" />
          <path d="M18 26 C24 22, 32 20, 40 18" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <path d="M22 18 C28 12, 36 10, 44 8" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.28" />
          <path d="M14 32 C10 28, 6 26, 2 28" stroke="var(--color-peach)" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          <circle cx="26" cy="7" r="2.5" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="2" cy="28" r="2" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.45" />
          <circle cx="44" cy="7" r="1.5" stroke="var(--color-eucalyptus)" strokeWidth="0.9" fill="none" opacity="0.32" />
        </svg>
      );
    case "venues":
      return (
        <svg width="110" height="38" viewBox="0 0 110 38" fill="none" aria-hidden="true">
          <path d="M30 34 C28 24, 24 16, 18 6" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.38" />
          <path d="M24 22 C18 18, 10 18, 4 20" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <circle cx="18" cy="5" r="2.5" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="4" cy="20" r="1.8" stroke="var(--color-eucalyptus)" strokeWidth="0.9" fill="none" opacity="0.35" />
          <line x1="48" y1="19" x2="62" y2="19" stroke="var(--color-cornflower)" strokeWidth="0.8" opacity="0.2" />
          <path d="M80 34 C82 24, 86 16, 92 6" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" opacity="0.38" />
          <path d="M86 22 C92 18, 100 18, 106 20" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
          <circle cx="92" cy="5" r="2.5" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="106" cy="20" r="1.8" stroke="var(--color-cornflower)" strokeWidth="0.9" fill="none" opacity="0.35" />
          <circle cx="55" cy="10" r="2" stroke="var(--color-lavender)" strokeWidth="0.9" fill="none" opacity="0.35" />
        </svg>
      );
    case "rsvp":
      return (
        <svg width="60" height="44" viewBox="0 0 60 44" fill="none" aria-hidden="true">
          <path d="M30 42 C28 32, 24 22, 20 12" stroke="var(--color-peach)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M30 42 C32 32, 36 22, 40 10" stroke="var(--color-peach)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M30 34 C26 30, 18 30, 14 31" stroke="var(--color-lavender)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M30 28 C34 24, 42 24, 46 23" stroke="var(--color-lavender)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <circle cx="20" cy="11" r="2" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="40" cy="9" r="2.5" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" opacity="0.45" />
          <circle cx="13" cy="31" r="1.5" stroke="var(--color-lavender)" strokeWidth="1" fill="none" opacity="0.45" />
          <circle cx="46" cy="22" r="1.5" stroke="var(--color-peach)" strokeWidth="1" fill="none" opacity="0.4" />
        </svg>
      );
    case "footer":
      return (
        <svg width="44" height="30" viewBox="0 0 44 30" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
          <path d="M22 28 C20 20, 16 12, 12 4" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" />
          <path d="M22 28 C24 20, 28 12, 32 4" stroke="var(--color-cornflower)" strokeWidth="1" strokeLinecap="round" />
          <path d="M18 18 C14 14, 8 14, 4 16" stroke="var(--color-eucalyptus)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          <circle cx="12" cy="3" r="2" stroke="var(--color-cornflower)" strokeWidth="1" fill="none" />
          <circle cx="32" cy="3" r="1.5" stroke="var(--color-peach)" strokeWidth="1" fill="none" />
          <circle cx="4" cy="16" r="1.5" stroke="var(--color-eucalyptus)" strokeWidth="0.9" fill="none" opacity="0.7" />
        </svg>
      );
  }
}
