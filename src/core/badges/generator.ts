export type BadgeType = 'lines' | 'branches' | 'functions' | 'statements' | 'logo';

interface BadgeOptions {
  label?: string;
  color?: string;
  logo?: boolean;
}

const COCOV_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/><path d="M12 9v3l2 2"/></svg>`;

// Helper for color calculation
function getBadgeColor(percentage: number): string {
  if (percentage >= 95) return '#4c1'; // brightgreen
  if (percentage >= 80) return '#97ca00'; // green
  if (percentage >= 70) return '#a4a61d'; // yellowgreen
  if (percentage >= 60) return '#dfb317'; // yellow
  if (percentage >= 50) return '#fe7d37'; // orange
  return '#e05d44'; // red
}

export function generateBadgeSvg(percentage: number, type: BadgeType = 'lines', options: BadgeOptions = {}): string {
  if (type === 'logo') {
    return generateLogoBadge();
  }

  const roundedPct = Math.round(percentage);
  const color = options.color || getBadgeColor(percentage);
  const label = options.label || type;
  
  // Width calculations (approximate)
  const labelWidth = label.length * 7 + 10;
  const valueWidth = String(roundedPct).length * 8 + 20;
  const totalWidth = labelWidth + valueWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${roundedPct}%">
    <title>${label}: ${roundedPct}%</title>
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${labelWidth}" height="20" fill="#555"/>
        <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text aria-hidden="true" x="${labelWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text x="${labelWidth * 5}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text aria-hidden="true" x="${(labelWidth + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
        <text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
    </g>
</svg>
  `.trim();
}

function generateLogoBadge(): string {
  // A square badge with the logo
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="20" fill="#333"/>
  <g transform="translate(8, 8)">
    ${COCOV_LOGO.replace(/width="\d+"/, 'width="24"').replace(/height="\d+"/, 'height="24"').replace(/currentColor/g, '#fff')}
  </g>
</svg>
  `.trim();
}
