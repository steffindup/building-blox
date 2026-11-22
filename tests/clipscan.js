// Used by the browser test "QC: no text is cut off" (21 Nov 2026, Steff: "add a QC check for incomplete text boxes").
// Finds text that is cut off: a visible text node whose glyphs reach outside an ancestor that hides overflow
// (overflow hidden/clip, text-overflow ellipsis, line clamps). Scrolling boxes don't count: their text can be reached.
window.__clipScan = function (opts = {}) {
  const skip = opts.skip || [];
  const out = [], seen = new Set();
  const vis = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; if (e.tagName === 'DIALOG' && !e.open) return false; if (e.hidden) return false; } return true; };
  const label = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
  const path = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 4; e = e.parentElement) p.unshift(label(e)); return p.join(' > '); };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim(); if (!t) continue;
    const host = n.parentElement; if (!host || ['SCRIPT', 'STYLE', 'OPTION', 'TITLE', 'NOSCRIPT', 'TEMPLATE'].includes(host.tagName)) continue;
    if (skip.some((q) => host.closest(q))) continue;
    if (!vis(host)) continue;
    { let tiny = false; for (let e = host; e && e !== document.body; e = e.parentElement) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if ((r.width <= 2 || r.height <= 2) && /hidden|clip/.test(cs.overflow + cs.overflowX)) { tiny = true; break; } if (cs.clip && cs.clip !== 'auto' && /rect\(0/.test(cs.clip)) { tiny = true; break; } } if (tiny) continue; }   // screen-reader-only text
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5); if (!rects.length) continue;
    const box = { l: Math.min(...rects.map((r) => r.left)), r: Math.max(...rects.map((r) => r.right)), t: Math.min(...rects.map((r) => r.top)), b: Math.max(...rects.map((r) => r.bottom)) };
    // off the side of the screen, and not inside something that scrolls sideways
    if ((box.r > innerWidth + 1.5 || box.l < -1.5) && box.r > 0 && box.l < innerWidth && box.b > 0 && box.t < innerHeight) {
      let scroller = false; for (let a = host; a && a !== document.documentElement; a = a.parentElement) { if (/auto|scroll/.test(getComputedStyle(a).overflowX) && a.scrollWidth > a.clientWidth) { scroller = true; break; } }
      if (!scroller) { const key = path(host) + '|' + t; if (!seen.has(key)) { seen.add(key); out.push({ where: path(host), text: t.slice(0, 90), cutBy: 'screen edge', how: 'width' }); } continue; }
    }
    for (let a = host; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const hx = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX);
      const hy = /hidden|clip/.test(cs.overflowY) || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none');
      if (/auto|scroll/.test(cs.overflowX) && /auto|scroll/.test(cs.overflowY)) break;   // a scrolling box: reachable
      if (!hx && !hy) continue;
      const ar = a.getBoundingClientRect(); if (ar.width < 3 || ar.height < 3) break;   // visually hidden (screen-reader text)
      const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
      const L = ar.left + bl, R = ar.right - br, T = ar.top + bt, B = ar.bottom - bb;
      const cutX = hx && (box.l < L - 1.5 || box.r > R + 1.5), cutY = hy && (box.t < T - 1.5 || box.b > B + 1.5);
      if (cutX || cutY) {
        const key = path(host) + '|' + t; if (!seen.has(key)) { seen.add(key); out.push({ where: path(host), text: t.slice(0, 90), cutBy: label(a), how: (cutX ? 'width' : '') + (cutY ? 'height' : '') }); }
        break;
      }
    }
  }
  // text hidden behind something else: at points along each line of text, is something solid stacked on top of it?
  // (Text that lets taps through can't be checked this way and is left alone; with a dialog open, only that dialog counts.)
  if (opts.covered !== false) {
    const dl = [...document.querySelectorAll('dialog[open]')], topDlg = dl[dl.length - 1] || null;
    const pe = document.createElement('style'); pe.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(pe);   // so hit-testing follows what is painted on top
    const w2 = document.createTreeWalker(topDlg || document.body, NodeFilter.SHOW_TEXT);
    for (let n = w2.nextNode(); n; n = w2.nextNode()) {
      const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length < 2) continue;
      const host = n.parentElement; if (!host || ['SCRIPT', 'STYLE', 'OPTION', 'TITLE', 'NOSCRIPT', 'TEMPLATE'].includes(host.tagName)) continue;
      if (skip.some((q) => host.closest(q)) || !vis(host)) continue;
      { let tiny = false; for (let e = host; e && e !== document.body; e = e.parentElement) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if ((r.width <= 2 || r.height <= 2) && /hidden|clip/.test(cs.overflow + cs.overflowX)) { tiny = true; break; } } if (tiny) continue; }
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of [...rg.getClientRects()].filter((r) => r.width > 4 && r.height > 4)) {
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
        const ys = r.top + r.height / 2, xs = [r.left + Math.min(4, r.width / 4), r.left + r.width / 2, r.right - Math.min(4, r.width / 4)];
        let hidden = 0, by = null;
        for (const x of xs) { if (x < 0 || x > innerWidth || ys < 0 || ys > innerHeight) continue;
          const stack = document.elementsFromPoint(x, ys), k = stack.findIndex((e) => e === host || host.contains(e));   // the text's own element (its parents are always further down the stack)
          if (k <= 0) continue;   // on top, or lets taps through (can't tell): fine
          const over = stack.slice(0, k).find((e) => { if ((opts.overOk || []).some((q) => e.closest(q))) return false; const cs = getComputedStyle(e); return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !/rgba\(.*, 0\)$/.test(cs.backgroundColor) || ['IMG', 'CANVAS', 'VIDEO'].includes(e.tagName); });
          if (over) { hidden++; by = over; } }
        if (hidden >= 2) { const key = 'cov|' + path(host) + '|' + t; if (!seen.has(key)) { seen.add(key); out.push({ where: path(host), text: t.slice(0, 90), cutBy: label(by), how: 'covered' }); } break; }
      }
    }
    pe.remove();
  }
  // native truncation the walker can't see: inputs and selects showing more text than fits
  for (const el of document.querySelectorAll('select')) { if (!vis(el) || skip.some((q) => el.closest(q))) continue; const o = el.options[el.selectedIndex]; if (!o) continue;
    const c = document.createElement('canvas').getContext('2d'); const cs = getComputedStyle(el); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const need = c.measureText(o.text).width + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 18; if (need > el.clientWidth + 2) out.push({ where: path(el), text: o.text, cutBy: label(el), how: 'select' }); }
  return out;
};
