/*
 * strip_shell.js v7 — Complete rewrite with all edge-case fixes.
 * 
 * Handles 5 page patterns:
 *   1. CC+MARKER: Content Component + { /* Desktop View * / } markers
 *   2. INLINE+MARKER: Inline content + { /* Desktop View * / } markers
 *   3. DP-CONST+CC: const Desktop/Mobile + Content Component inside them
 *   4. DP-CONST: const Desktop/Mobile without Content Component
 *   5. IMPORT-ONLY: Files that just import sidebar/header (no h-screen shell)
 * 
 * Key fixes from v6:
 *   - CRLF normalization upfront
 *   - Forward depth tracking for content boundary detection (not backward div counting)
 *   - DP-CONST detection using `);` line instead of paren depth
 *   - Proper handling of shared dialogs/modals after mobile section
 * 
 */ 
const fs = require('fs');
const filePath = process.argv[2];
if (!filePath) { console.error('Usage: node strip_shell.js <filepath>'); process.exit(1); }

// Normalize CRLF to LF upfront to avoid off-by-one issues
let raw = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
const origCount = raw.split('\n').length;

// ===== STEP 1: Remove shell imports =====
raw = raw.replace(/^.*import\s*\{[^}]*\b(?:Admin|Student|Advisor|Supervisor)(?:Sidebar|Header)\b[^}]*\}\s*from\s*['"][^'"]+['"];?\s*\n/gm, '');
raw = raw.replace(/^.*import\s*\{[^}]*\bMobileHeader\b[^}]*\}\s*from\s*['"]@\/components\/mobile\/MobileHeader['"];?\s*\n/gm, '');
raw = raw.replace(/^.*import\s*\{[^}]*\bBottomNavigation\b[^}]*\}\s*from\s*['"]@\/components\/mobile\/BottomNavigation['"];?\s*\n/gm, '');
raw = raw.replace(/\n{3,}/g, '\n\n');

const lines = raw.split('\n');

// ===== STEP 2: Find shell return block =====
// Look for the LAST `return (` followed by `h-screen bg-background`
let returnIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === 'return (') {
    for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
      if (lines[j].includes('h-screen') && lines[j].includes('bg-background')) {
        returnIdx = i;
        break;
      }
    }
    if (returnIdx >= 0) break;
  }
}

if (returnIdx < 0) {
  // No shell wrapper found — just write with cleaned imports
  console.log(`[SKIP] ${filePath}: imports only`);
  fs.writeFileSync(filePath, raw, 'utf-8');
  console.log(`  ${origCount} -> ${lines.length}`);
  process.exit(0);
}

// Find the return block's closing paren
let returnEnd = -1, pDepth = 0;
for (let i = returnIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '(') pDepth++; if (ch === ')') pDepth--; }
  if (pDepth === 0 && i > returnIdx) { returnEnd = i; break; }
}

// ===== STEP 3: Detect Desktop/Mobile const component patterns =====
// Look for `// Desktop layout` or `const Desktop =` BEFORE returnIdx
let dpStart = -1, dpEnd = -1, mbStart = -1, mbEnd = -1;
for (let i = 0; i < returnIdx; i++) {
  const t = lines[i].trim();
  if (t.match(/^(\/\/\s+Desktop\s+layout|const\s+Desktop\s*=)/)) {
    dpStart = i;
    // Find closing `);` on its own line
    for (let j = i + 1; j < returnIdx; j++) {
      if (lines[j].trim() === ');') { dpEnd = j; break; }
    }
  }
  if (t.match(/^(\/\/\s+Mobile\s+layout|const\s+Mobile\s*=)/)) {
    mbStart = i;
    for (let j = i + 1; j < returnIdx; j++) {
      if (lines[j].trim() === ');') { mbEnd = j; break; }
    }
  }
}

// ===== STEP 4: Identify content component =====
const returnBlock = lines.slice(returnIdx, returnEnd + 1).join('\n');
let ccMatch = returnBlock.match(/<(\w+Content)\s*\/>/);
const hasDesktopRef = returnBlock.includes('<Desktop');

// Also check inside Desktop const definition
if (!ccMatch && dpStart >= 0 && dpEnd >= 0) {
  const dpBlock = lines.slice(dpStart, dpEnd + 1).join('\n');
  ccMatch = dpBlock.match(/<(\w+Content)\s*\/>/);
}

// ===== STEP 5: Build pre-return output =====
const out = [];

// Copy everything before Desktop/Mobile const definitions (or before return if none)
const skipStart = dpStart >= 0 ? dpStart : returnIdx;
for (let i = 0; i < skipStart; i++) out.push(lines[i]);

// If we had Desktop/Mobile const defs, skip them and copy any code between defs and return
if (dpStart >= 0) {
  let afterDefs = (mbEnd >= 0 ? mbEnd : dpEnd) + 1;
  while (afterDefs < returnIdx && lines[afterDefs].trim() === '') afterDefs++;
  for (let i = afterDefs; i < returnIdx; i++) out.push(lines[i]);
}

// ===== STEP 6: Handle Content Component pattern =====
if (ccMatch) {
  // Collect shared elements (dialogs/modals) that sit after <Desktop/><Mobile/> or after BottomNav
  const shared = [];
  
  if (hasDesktopRef) {
    // Pattern: return ( <div><Desktop /><Mobile />{...shared...}</div> )
    let afterMobile = -1;
    for (let i = returnIdx; i <= returnEnd; i++) {
      if (lines[i].trim().match(/^<Mobile\s*\/>/)) { afterMobile = i + 1; break; }
    }
    if (afterMobile >= 0) {
      for (let i = afterMobile; i < returnEnd; i++) {
        const t = lines[i].trim();
        if (t === '' || t === '</div>') continue;
        shared.push(lines[i]);
      }
    }
  } else {
    // Pattern: return ( <div>{/* Desktop View */}...{/* Mobile View */}...{shared}</div> )
    // Find {/* Mobile View */}, then find its end via BottomNavigation depth tracking
    let mvIdx = -1;
    for (let i = returnIdx; i <= returnEnd; i++) {
      if ((lines[i].includes('Mobile View') || lines[i].includes('MOBILE')) && lines[i].includes('/*')) {
        mvIdx = i; break;
      }
    }
    if (mvIdx >= 0) {
      let bnLine = -1;
      for (let i = mvIdx; i <= returnEnd; i++) {
        if (lines[i].includes('<BottomNavigation')) { bnLine = i; break; }
      }
      if (bnLine >= 0) {
        let mvDivD = 0;
        for (let i = mvIdx; i <= bnLine; i++) {
          mvDivD += (lines[i].match(/<div\b/g) || []).length;
          mvDivD -= (lines[i].match(/<div\b[^>]*\/>/g) || []).length;
          mvDivD -= (lines[i].match(/<\/div>/g) || []).length;
        }
        let mobileSecEnd = -1;
        for (let i = bnLine + 1; i <= returnEnd; i++) {
          mvDivD += (lines[i].match(/<div\b/g) || []).length;
          mvDivD -= (lines[i].match(/<div\b[^>]*\/>/g) || []).length;
          mvDivD -= (lines[i].match(/<\/div>/g) || []).length;
          if (mvDivD <= 0) { mobileSecEnd = i; break; }
        }
        if (mobileSecEnd >= 0) {
          for (let i = mobileSecEnd + 1; i < returnEnd; i++) {
            const t = lines[i].trim();
            if (t === '' || t === '</div>') continue;
            shared.push(lines[i]);
          }
        }
      }
    }
  }

  // Build the new return
  if (shared.length > 0) {
    out.push('  return (');
    out.push('    <>');
    out.push(`      <${ccMatch[1]} />`);
    shared.forEach(l => out.push(l));
    out.push('    </>');
    out.push('  );');
  } else {
    out.push(`  return <${ccMatch[1]} />;`);
  }

  for (let i = returnEnd + 1; i < lines.length; i++) out.push(lines[i]);
  fs.writeFileSync(filePath, out.join('\n'), 'utf-8');
  console.log(`[CC] ${filePath}: ${origCount} -> ${out.length}`);
  process.exit(0);
}

// ===== STEP 7: Handle Inline Content pattern =====
// Find {/* Desktop View */} and {/* Mobile View */} markers within the return block
let desktopIdx = -1, mobileIdx = -1;
for (let i = returnIdx; i <= returnEnd; i++) {
  if ((lines[i].includes('Desktop View') || lines[i].includes('DESKTOP')) && lines[i].includes('/*')) {
    if (desktopIdx < 0) desktopIdx = i;
  }
  if ((lines[i].includes('Mobile View') || lines[i].includes('MOBILE') ||
       (lines[i].includes('Mobile') && lines[i].includes('/*') && lines[i].includes('──'))) && lines[i].includes('/*')) {
    mobileIdx = i;
  }
}

if (desktopIdx < 0 || mobileIdx < 0) {
  console.log(`[SKIP-COMPLEX] ${filePath}: No Desktop/Mobile markers found`);
  fs.writeFileSync(filePath, raw, 'utf-8');
  process.exit(0);
}

// Find scroll container (overflow-y-auto) in desktop section
let scrollIdx = -1;
for (let i = desktopIdx; i < mobileIdx; i++) {
  if (lines[i].includes('overflow-y-auto')) { scrollIdx = i; break; }
}

if (scrollIdx < 0) {
  console.log(`[SKIP-NOSCROLL] ${filePath}: No scroll container in desktop section`);
  fs.writeFileSync(filePath, raw, 'utf-8');
  process.exit(0);
}

// Content starts right after the scroll container
const contentStart = scrollIdx + 1;

// Forward-walk: track div depth from contentStart.
// Content divs are balanced (depth stays >= 0). When a </div> would make depth
// go negative, it's closing a shell wrapper — stop there.
let contentEnd = contentStart;
let divDepth = 0;
let lastContentLine = contentStart - 1;

for (let i = contentStart; i < mobileIdx; i++) {
  const t = lines[i].trim();
  if (t === '') continue;

  const opens = (lines[i].match(/<div\b/g) || []).length;
  const closes = (lines[i].match(/<\/div>/g) || []).length;
  const selfCloses = (lines[i].match(/<div\b[^>]*\/>/g) || []).length;
  const netChange = opens - selfCloses - closes;

  // If this </div> would make depth negative, it's a shell closing div — stop
  if (t === '</div>' && divDepth + netChange < 0) break;

  divDepth += netChange;
  lastContentLine = i;
}
contentEnd = lastContentLine;

// Find mobile section end via div depth tracking
let mobileSecEnd = -1;
let bnLine = -1;
for (let i = mobileIdx; i <= returnEnd; i++) {
  if (lines[i].includes('<BottomNavigation')) { bnLine = i; break; }
}
if (bnLine >= 0) {
  let mvDivD = 0;
  for (let i = mobileIdx; i <= bnLine; i++) {
    mvDivD += (lines[i].match(/<div\b/g) || []).length;
    mvDivD -= (lines[i].match(/<div\b[^>]*\/>/g) || []).length;
    mvDivD -= (lines[i].match(/<\/div>/g) || []).length;
  }
  for (let i = bnLine + 1; i <= returnEnd; i++) {
    mvDivD += (lines[i].match(/<div\b/g) || []).length;
    mvDivD -= (lines[i].match(/<div\b[^>]*\/>/g) || []).length;
    mvDivD -= (lines[i].match(/<\/div>/g) || []).length;
    if (mvDivD <= 0) { mobileSecEnd = i; break; }
  }
}

// Collect shared elements (after mobile section, before return end)
const shared = [];
if (mobileSecEnd >= 0) {
  for (let i = mobileSecEnd + 1; i < returnEnd; i++) {
    const t = lines[i].trim();
    if (t === '' || t === '</div>') continue;
    shared.push(lines[i]);
  }
}

console.log(`[INLINE] ${filePath}`);
console.log(`  Desktop:${desktopIdx+1} Scroll:${scrollIdx+1} Content:${contentStart+1}-${contentEnd+1}`);
console.log(`  Shared elements: ${shared.length}`);

// Build the new return
out.push('  return (');
out.push('    <div className="space-y-6">');
for (let i = contentStart; i <= contentEnd; i++) out.push(lines[i]);
shared.forEach(l => out.push(l));
out.push('    </div>');
out.push('  );');

for (let i = returnEnd + 1; i < lines.length; i++) out.push(lines[i]);

fs.writeFileSync(filePath, out.join('\n'), 'utf-8');
console.log(`  ${origCount} -> ${out.length}`);
