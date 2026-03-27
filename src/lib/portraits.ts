export function createPortraitDataUrl(
  label: string,
  primary: string,
  secondary: string,
  tertiary = '#0e0e10'
): string {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${primary}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${secondary}" stop-opacity="0.18" />
        </linearGradient>
        <linearGradient id="stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="320" height="400" fill="${tertiary}" />
      <rect x="12" y="12" width="296" height="376" fill="url(#bg)" stroke="url(#stroke)" stroke-width="2" />
      <circle cx="160" cy="138" r="54" fill="none" stroke="${primary}" stroke-opacity="0.85" stroke-width="8" />
      <path d="M90 306c16-46 46-72 70-72s54 26 70 72" fill="none" stroke="${secondary}" stroke-width="12" stroke-linecap="square" />
      <path d="M62 64h74" stroke="${primary}" stroke-width="8" />
      <path d="M186 64h72" stroke="${secondary}" stroke-width="8" />
      <text x="50%" y="89%" fill="${primary}" font-family="Space Grotesk, Arial, sans-serif" font-size="68" font-weight="700" text-anchor="middle">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
