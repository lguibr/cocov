
export function generateBadgeSvg(percentage: number): string {
    const color = getBadgeColor(percentage);
    const roundedPct = Math.round(percentage);
    
    // Simple shield.io style SVG
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="106" height="20" role="img" aria-label="coverage: ${roundedPct}%">
    <title>coverage: ${roundedPct}%</title>
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="106" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="61" height="20" fill="#555"/>
        <rect x="61" width="45" height="20" fill="${color}"/>
        <rect width="106" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <text aria-hidden="true" x="315" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="510">coverage</text>
        <text x="315" y="140" transform="scale(.1)" fill="#fff" textLength="510">coverage</text>
        <text aria-hidden="true" x="825" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="350">${roundedPct}%</text>
        <text x="825" y="140" transform="scale(.1)" fill="#fff" textLength="350">${roundedPct}%</text>
    </g>
</svg>
    `.trim();
}

function getBadgeColor(percentage: number): string {
    if (percentage >= 90) return '#4c1'; // brightgreen
    if (percentage >= 80) return '#97ca00'; // green
    if (percentage >= 70) return '#a4a61d'; // yellowgreen
    if (percentage >= 60) return '#dfb317'; // yellow
    if (percentage >= 50) return '#fe7d37'; // orange
    return '#e05d44'; // red
}
