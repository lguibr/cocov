import { CoverageSummary } from '@/types.js';

export type BadgeType = 'lines' | 'branches' | 'functions' | 'statements' | 'logo' | 'unified';

interface BadgeOptions {
  label?: string;
  color?: string;
  logo?: boolean;
}

const COCOV_LOGO = `<svg width="100%" height="100%" viewBox="0 0 70.367256 69.038162" version="1.1" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-0.20566306,-141.68053)"><g transform="translate(-134.64,21.78)"><g transform="translate(34.30175,0.81670833)"><path style="fill:#d2b184" d="m 114.23606,185.27751 c -1.49038,-1.56601 -2.71077,-3.0289 -2.71198,-3.25087 -0.006,-1.12041 4.09679,-7.24527 5.22899,-7.80588 1.71474,-0.84907 1.69776,-0.80315 1.35893,-3.67613 -0.25218,-2.13834 -0.24214,-2.64508 0.0584,-2.94311 0.61718,-0.61213 5.75226,-2.7661 6.5944,-2.7661 1.09124,0 1.17611,-0.43148 0.54055,-2.74811 -0.71676,-2.61262 -0.76403,-2.54907 2.96761,-3.9903 6.88707,-2.65991 6.57601,-2.38939 5.89846,-5.12965 -0.74194,-3.00072 -0.73793,-2.94986 -0.2311,-2.93352 0.25743,0.008 2.78563,1.58587 5.61822,3.50573 5.15016,3.49064 5.15016,3.49064 6.51611,7.14925 1.61109,4.3152 1.16005,3.7914 4.60561,5.34856 1.52797,0.69054 2.83765,1.30733 2.91041,1.37064 0.0728,0.0633 0.19183,1.68327 0.26459,3.5999 0.13229,3.48479 0.13229,3.48479 1.05727,3.57255 1.28232,0.12167 2.55876,1.78336 5.23917,6.82045 0.37071,0.69664 -0.0818,1.34988 -3.10737,4.48599 -2.1532,2.23184 -2.1532,2.23184 -21.12582,2.23488 -18.97263,0.003 -18.97263,0.003 -21.6824,-2.84428 z m 4.03269,-35.55341 c -3.78703,-2.89517 -9.49355,-4.30922 -15.94551,-3.95121 -2.13554,0.1185 -2.11432,0.16363 -1.16127,-2.47027 11.00278,-30.40766 53.945,-32.77447 67.76427,-3.73491 2.88855,6.06993 2.82954,6.27924 -1.75792,6.23528 -5.47715,-0.0525 -10.24165,1.3123 -14.02168,4.01647 -1.10544,0.79082 -1.10544,0.79082 -3.43958,-0.17048 -8.58514,-3.53574 -20.01501,-3.47787 -28.10147,0.14226 -2.07023,0.92679 -2.03583,0.92748 -3.33684,-0.0671 z" /><path style="fill:#dcac28" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z m 0.0421,-38.03788 c -3.81841,-2.65194 -7.74235,-3.77538 -13.29527,-3.80648 -4.93537,-0.0276 -4.65257,0.1793 -3.67556,-2.68972 3.35564,-9.85391 11.93967,-18.32151 22.10016,-21.80039 1.85854,-0.63635 2.62421,-0.78723 3.04271,-0.59957 0.39931,0.17905 0.97531,0.10751 2.01442,-0.25018 2.4107,-0.82985 3.01692,-0.56953 1.47053,0.63146 -2.38073,1.84897 -5.62621,6.75597 -6.87643,10.39682 -0.45758,1.33255 0.49694,-0.24888 1.53474,-2.54275 5.22275,-19.01042 40.86959,12.98917 17.11751,-7.93051 -2.32723,-1.79251 0.88424,-1.1681 4.94196,0.96088 11.5981,6.08521 14.8846,19.62192 14.8846,17.7725 0,-2.23391 -6.94055,-14.66826 -14.60331,-17.96468 -1.40081,-0.60261 -1.79439,-1.40878 -0.54408,-1.11445 10.10771,2.37939 20.55938,12.22888 24.02772,22.64335 0.8672,2.60399 1.13629,2.42324 -3.65969,2.45828 -5.46268,0.0399 -9.10266,1.0276 -12.77829,3.46735 -1.6626,1.10357 -1.60374,1.10876 -6.15451,-0.54244 -7.59947,-2.75739 -17.94661,-2.54846 -25.48481,0.51458 -2.38998,0.97114 -3.13032,1.04329 -4.0624,0.39595 z" /><path style="fill:#4984e2" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z m 0.0421,-38.04773 c -3.91694,-2.67178 -7.7472,-3.76556 -13.29527,-3.79663 -4.93537,-0.0276 -4.65257,0.1793 -3.67556,-2.68972 3.35564,-9.85391 11.93967,-18.32151 22.10016,-21.80039 1.82922,-0.62631 2.62813,-0.78579 3.0325,-0.60535 0.48581,0.21677 0.40459,0.29418 -0.70559,0.67246 -0.69003,0.23511 -1.757,0.77029 -2.37105,1.18929 -0.61404,0.41899 -1.59269,1.0837 -2.17477,1.47713 -3.00115,2.02847 -7.93267,8.18235 -9.23185,11.5201 -0.24933,0.64058 -0.74472,1.6866 -1.10085,2.32449 -1.14684,2.05418 -1.13316,2.06417 2.85919,2.08796 2.7946,0.0167 4.88951,1.93463 5.16315,0.56905 2.64813,-13.21506 10.33669,-21.3041 17.18058,-21.0759 7.45895,0.24871 14.02415,9.87277 14.7541,20.68862 0.067,0.99306 -0.0496,0.99123 2.97894,0.19959 1.7174,-0.44892 2.76337,-0.55128 4.96149,-0.48555 3.27222,0.0979 3.17102,0.26865 1.71137,-2.88814 -1.45,-3.13594 -1.78544,-3.75382 -2.62416,-4.83376 -0.39556,-0.50933 -0.90475,-1.285 -1.13155,-1.72372 -1.19248,-2.30676 -7.01583,-7.45544 -9.77477,-8.6423 -1.40081,-0.60261 -1.79439,-1.40878 -0.54408,-1.11445 10.10771,2.37939 20.55938,12.22888 24.02772,22.64335 0.8672,2.60399 1.13629,2.42324 -3.65969,2.45828 -5.43257,0.0397 -9.10626,1.03 -12.72062,3.42907 -2.13976,1.42029 -2.0956,1.45993 -3.15239,-2.82888 -1.28202,-5.20281 -1.2467,-5.13389 -3.0386,-5.93015 -6.42562,-2.85534 -15.83806,-3.02143 -22.94931,-0.40496 -2.72019,1.00084 -2.87879,1.23889 -4.05692,6.08893 -1.0561,4.3477 -1.13032,4.44826 -2.56217,3.47158 z" /><path style="fill:#9d7149" d="m 118.2267,187.52157 c -0.0681,-0.11017 0.0326,-0.25536 0.22372,-0.32264 8.46813,-2.98119 16.30243,-5.75832 17.6777,-6.26645 3.20274,-1.18333 14.79125,-5.23268 15.44343,-5.39637 2.13528,-0.53592 -0.75357,-0.64779 -17.09707,-0.66208 -13.86995,-0.0121 -17.68469,-0.0851 -17.30099,-0.33073 0.27074,-0.17335 1.02749,-0.66217 1.68168,-1.08627 0.65418,-0.42411 2.45673,-1.21636 4.00567,-1.76057 1.54893,-0.5442 4.00687,-1.41341 5.46208,-1.93156 7.0782,-2.52033 8.86129,-3.14189 10.45104,-3.64306 2.90626,-0.91621 2.49155,-1.00182 -4.90509,-1.01254 -3.9094,-0.006 -7.1866,-0.0994 -7.28267,-0.20824 -0.31894,-0.3614 -1.31063,-4.92982 -1.10811,-5.10471 1.0309,-0.89026 9.59082,-3.88966 9.59318,-3.36145 0.009,2.00107 0.22323,2.17854 6.03392,4.99671 3.01069,1.46018 5.73377,2.89606 6.0513,3.19085 0.31753,0.2948 1.80581,1.10928 3.30729,1.80998 2.72997,1.27398 2.72997,1.27398 2.80439,4.64998 0.0833,3.77759 0.18007,4.01023 1.71598,4.12369 1.08773,0.0804 1.08773,0.0804 3.0221,3.38039 2.32448,3.96556 2.41772,3.06341 -0.64931,6.28264 -2.57569,2.70352 -2.57569,2.70352 -20.79108,2.77813 -10.01846,0.041 -18.27108,-0.0155 -18.33916,-0.1257 z" /><path style="fill:#3664a8" d="m 118.43831,149.39696 c -2.02222,-2.15255 -8.06402,-3.95963 -13.33234,-3.98766 -2.93429,-0.0156 -3.90243,-0.1028 -3.90261,-0.35149 -1.3e-4,-0.1819 0.0912,-0.33072 0.20305,-0.33072 0.11181,0 0.79642,-0.49114 1.52135,-1.09142 0.72494,-0.60028 2.3301,-1.56691 3.56703,-2.14806 1.23693,-0.58116 2.57638,-1.21558 2.97656,-1.40982 0.40018,-0.19425 0.72761,-0.26192 0.72761,-0.15038 0,0.11154 1.33945,0.20507 2.97656,0.20785 2.05127,0.003 3.47005,0.14986 4.56406,0.4709 5.67829,1.49923 4.94621,-3.85518 3.16517,2.93025 -0.19208,0.7276 -0.60565,2.48378 -0.91903,3.9026 -0.61901,2.80256 -0.68064,2.88054 -1.54741,1.9579 z m 33.58285,-0.3769 c -0.14489,-0.54213 -0.44858,-1.81912 -0.67487,-2.83777 -2.44022,-10.05796 -2.50695,-4.06417 2.50892,-5.55672 0.94088,-0.2884 2.49946,-0.46065 4.40977,-0.48736 1.62501,-0.0227 3.03308,-0.11986 3.12905,-0.21585 0.096,-0.096 0.49282,-0.016 0.8819,0.17777 0.38907,0.19377 1.74755,0.84734 3.01884,1.45237 1.96905,0.93712 5.22919,3.24055 5.22919,3.69466 0,0.0778 -1.69664,0.14229 -3.77031,0.14338 -5.32952,0.003 -9.77855,1.25496 -13.22073,3.72092 -1.24832,0.8943 -1.24832,0.8943 -1.51176,-0.0914 z" /></g></g></g></svg>`;

// Helper for color calculation
function getBadgeColor(percentage: number): string {
  if (percentage >= 95) return '#4c1'; // brightgreen
  if (percentage >= 80) return '#97ca00'; // green
  if (percentage >= 70) return '#a4a61d'; // yellowgreen
  if (percentage >= 60) return '#dfb317'; // yellow
  if (percentage >= 50) return '#fe7d37'; // orange
  return '#e05d44'; // red
}

export function generateBadgeSvg(percentage: number | CoverageSummary, type: BadgeType = 'lines', options: BadgeOptions = {}): string {
  if (type === 'logo') {
    return generateLogoBadge();
  }
  
  if (type === 'unified' && typeof percentage === 'object') {
    return generateUnifiedBadge(percentage as CoverageSummary);
  }

  // Standard single badge behavior
  if (typeof percentage !== 'number') {
    // Fallback if incorrect type passed for standard badge
    return '';
  }

  const roundedPct = Math.round(percentage);
  const color = options.color || getBadgeColor(percentage);
  const label = options.label || type;
  
  // Width calculations
  // Logo width = 20 (14px icon + padding)
  const logoWidth = 20;
  const labelWidth = label.length * 7 + 10;
  const valueWidth = String(roundedPct).length * 8 + 20;
  const totalWidth = logoWidth + labelWidth + valueWidth;
  
  const labelX = logoWidth + labelWidth;

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
        <rect width="${logoWidth + labelWidth}" height="20" fill="#555"/>
        <rect x="${logoWidth + labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="3" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
        <text aria-hidden="true" x="${(logoWidth + labelWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 5) * 10}">${label}</text>
        <text x="${(logoWidth + labelWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 5) * 10}">${label}</text>
        <text aria-hidden="true" x="${(labelX + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
        <text x="${(labelX + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${roundedPct}%</text>
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
     <svg width="24" height="24" viewBox="0 0 70.367256 69.038162">
      ${COCOV_LOGO.replace(/^<svg[^>]*>|<\/svg>$/g, '')}
     </svg>
  </g>
</svg>
  `.trim();
}

export function generateDiffBadge(diff: number, type: BadgeType = 'lines', options: BadgeOptions = {}): string {
  const roundedDiff = Math.round(diff);
  const sign = roundedDiff > 0 ? '+' : roundedDiff < 0 ? '' : '±'; // - is already in number string
  const label = options.label || type;
  const valueText = `${sign}${roundedDiff}%`;
  
  // Color Logic: Red if regressed (negative), Green if improved (positive), Blue if neutral
  let color = '#007ec6'; // blue
  if (roundedDiff > 0) color = '#4c1'; // green
  if (roundedDiff < 0) color = '#e05d44'; // red

  options.color = color;
  
  // We reuse generating a standard badge but with specific text
  // However, standard badge takes number. We construct custom text?
  // generateBadgeSvg uses pct for text. 
  // Let's perform manual generation to control the value text strictly.
  
  const logoWidth = 20;
  // Increase padding factor
  const labelWidth = label.length * 7 + 12; 
  const valueWidth = valueText.length * 8 + 12;
  const totalWidth = logoWidth + labelWidth + valueWidth;
  const labelX = logoWidth + labelWidth;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${valueText}">
    <title>${label}: ${valueText}</title>
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${logoWidth + labelWidth}" height="20" fill="#555"/>
        <rect x="${logoWidth + labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
        <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="3" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
        <text aria-hidden="true" x="${(logoWidth + labelWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text x="${(logoWidth + labelWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 10) * 10}">${label}</text>
        <text aria-hidden="true" x="${(labelX + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${valueText}</text>
        <text x="${(labelX + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${valueText}</text>
    </g>
</svg>
  `.trim();
}

function generateUnifiedBadge(summary: CoverageSummary): string {
  const metrics = ['lines', 'statements', 'functions', 'branches'] as const;
  const labels = { lines: 'lines', statements: 'stmts', functions: 'funcs', branches: 'br' };
  
  let currentX = 0;
  const logoWidth = 24; 
  
  // Improved width calculation for readability
  // Char width approx 7px at 110 fontsize scaled 0.1 -> means 7px actual.
  // We add generous padding.
  const segments = metrics.map(m => {
    const pct = summary[m].pct;
    const rounded = Math.round(pct);
    const color = getBadgeColor(pct);
    const label = labels[m];
    // label length * 6 + number length * 6 + 15 padding
    const width = (label.length + String(rounded).length + 3) * 7 + 10; 
    
    return { metric: m, pct: rounded, color, label, width };
  });

  const totalWidth = logoWidth + segments.reduce((sum, s) => sum + s.width, 0);

  let svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="Unified Coverage">
    <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
        <rect width="${logoWidth}" height="20" fill="#555"/>
  `;

  currentX = logoWidth;

  segments.forEach(s => {
    svgContent += `<rect x="${currentX}" width="${s.width}" height="20" fill="${s.color}"/>`;
    currentX += s.width;
  });

  svgContent += `<rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
        <image x="4" y="3" width="14" height="14" href="data:image/svg+xml;base64,${Buffer.from(COCOV_LOGO).toString('base64')}"/>
  `;

  currentX = logoWidth;

  segments.forEach(s => {
    const cx = currentX + s.width / 2;
    const text = `${s.label} ${s.pct}%`; // No colon, simpler
    const textLength = (s.width - 10) * 10; // More conservative text length
    
    svgContent += `
        <text aria-hidden="true" x="${cx * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${textLength}">${text}</text>
        <text x="${cx * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${textLength}">${text}</text>
    `;
    currentX += s.width;
  });

  svgContent += `
    </g>
</svg>`;

  return svgContent.trim();
}
