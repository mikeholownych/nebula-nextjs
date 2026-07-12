/**
 * WCAG 2.1 Contrast Ratio Checker for Nebula
 * Checks all color combinations and reports issues
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function parseRgb(str) {
  const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  
  const rgbaMatch = str.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3])
    };
  }
  
  return null;
}

// Calculate relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(lum1, lum2) {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check WCAG compliance
function checkContrast(fgColor, bgColor, isLargeText = false) {
  const fgRgb = parseRgb(fgColor) || hexToRgb(fgColor);
  const bgRgb = parseRgb(bgColor) || hexToRgb(bgColor);
  
  if (!fgRgb || !bgRgb) {
    return { error: 'Invalid color format' };
  }
  
  const fgLum = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const ratio = getContrastRatio(fgLum, bgLum);
  
  const aaMin = isLargeText ? 3.0 : 4.5;
  const aaaMin = isLargeText ? 4.5 : 7.0;
  
  return {
    ratio: ratio.toFixed(2),
    passesAA: ratio >= aaMin,
    passesAAA: ratio >= aaaMin,
    aaMin: aaMin,
    aaaMin: aaaMin,
    fgRgb: `${fgRgb.r},${fgRgb.g},${fgRgb.b}`,
    bgRgb: `${bgRgb.r},${bgRgb.g},${bgRgb.b}`
  };
}

// Nebula color palette
const colors = {
  // Backgrounds
  bgCanvas: '#08090a',
  bgPanel: '#0f1011',
  bgSurface: '#191a1b',
  bgElevated: '#28282c',
  
  // Text
  textPrimary: '#f7f8f8',
  textSecondary: '#c8ced8',
  textMuted: '#9ca3af',
  textDisabled: '#787f87',
  
  // Accent (WCAG AA for white text)
  accent: '#007a52',
  accentHover: '#006644',
  
  // White
  white: '#ffffff'
};

// Test all combinations
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  WCAG 2.1 Contrast Ratio Check — Nebula Design System      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const tests = [
  { name: 'Primary text on Canvas', fg: colors.textPrimary, bg: colors.bgCanvas, isLarge: false },
  { name: 'Primary text on Panel', fg: colors.textPrimary, bg: colors.bgPanel, isLarge: false },
  { name: 'Secondary text on Canvas', fg: colors.textSecondary, bg: colors.bgCanvas, isLarge: false },
  { name: 'Muted text on Canvas', fg: colors.textMuted, bg: colors.bgCanvas, isLarge: false },
  { name: 'Muted text on Panel', fg: colors.textMuted, bg: colors.bgPanel, isLarge: false },
  { name: 'White text on Accent', fg: colors.white, bg: colors.accent, isLarge: false },
  { name: 'White text on Accent Hover', fg: colors.white, bg: colors.accentHover, isLarge: false },
  { name: 'Accent on Canvas', fg: colors.accent, bg: colors.bgCanvas, isLarge: false },
  { name: 'Disabled text on Canvas', fg: colors.textDisabled, bg: colors.bgCanvas, isLarge: false },
  { name: 'Primary text on Surface', fg: colors.textPrimary, bg: colors.bgSurface, isLarge: false },
];

let passCount = 0;
let failCount = 0;

tests.forEach(test => {
  const result = checkContrast(test.fg, test.bg, test.isLarge);
  const status = result.passesAA ? '✅ PASS' : '❌ FAIL';
  const level = result.passesAAA ? 'AAA' : result.passesAA ? 'AA' : 'FAIL';
  
  console.log(`${status} ${test.name}`);
  console.log(`     Ratio: ${result.ratio}:1 (${level}) — Required: ${result.aaMin}:1 (AA), ${result.aaaMin}:1 (AAA)`);
  
  if (result.passesAA) {
    passCount++;
  } else {
    failCount++;
    console.log(`     ⚠️  FAILED WCAG AA — Ratio ${result.ratio}:1 < ${result.aaMin}:1 minimum`);
  }
  console.log('');
});

console.log('════════════════════════════════════════════════════════════');
console.log(`SUMMARY: ${passCount} PASS, ${failCount} FAIL`);
console.log('════════════════════════════════════════════════════════════');

if (failCount > 0) {
  console.log('\n⚠️  FIXES NEEDED:');
  console.log('- Increase text-muted contrast (currently #8a8f98)');
  console.log('- Increase text-secondary contrast (currently #d0d6e0)');
  console.log('- Check all transparent backgrounds');
}
