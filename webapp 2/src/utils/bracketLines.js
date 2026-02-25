// src/utils/bracketLines.js

function svgPoint(svg, x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;

  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return pt.matrixTransform(ctm.inverse());
}

function connect(svg, a, b) {
  if (!a || !b) return;

  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  const p1 = svgPoint(svg, r1.right, r1.top + r1.height / 2);
  const p2 = svgPoint(svg, r2.left, r2.top + r2.height / 2);

  const midX = (p1.x + p2.x) / 2;

  // small “elbow” spacing so lines look crisp
  const s = 12;
  const x1 = Math.min(p1.x + s, midX);
  const x2 = Math.max(p2.x - s, midX);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    `M ${p1.x} ${p1.y} H ${x1} H ${midX} V ${p2.y} H ${x2} H ${p2.x}`
  );
  path.setAttribute("stroke", "#4169E1");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "square");
  path.setAttribute("stroke-linejoin", "miter");
  svg.appendChild(path);
}

function el(id) {
  return document.getElementById(id);
}
function exists(id) {
  return !!el(id);
}

function sizeFromDOM() {
  if (exists("t16")) return 16;
  if (exists("t8")) return 8;
  if (exists("t4")) return 4;
  if (exists("t2")) return 2;
  return 0;
}

function connectionPairsForSize(size) {
  // ✅ Connect TEAM boxes -> WINNER slots, not match containers.
  // This keeps lines attached even when match layout changes.

  if (size === 16) {
    const pairs = [
      // Round of 16 -> Round of 8
      ["t1", "w1"], ["t16", "w1"],
      ["t8", "w2"], ["t9", "w2"],
      ["t4", "w3"], ["t13", "w3"],
      ["t5", "w4"], ["t12", "w4"],
      ["t2", "w5"], ["t15", "w5"],
      ["t7", "w6"], ["t10", "w6"],
      ["t3", "w7"], ["t14", "w7"],
      ["t6", "w8"], ["t11", "w8"],

      // Round of 8 -> Semis
      ["w1", "w9"], ["w2", "w9"],
      ["w3", "w10"], ["w4", "w10"],
      ["w5", "w11"], ["w6", "w11"],
      ["w7", "w12"], ["w8", "w12"],

      // Semis -> Final
      ["w9", "w13"], ["w10", "w13"],
      ["w11", "w14"], ["w12", "w14"],

      // Final -> Champion
      ["w13", "m16"], ["w14", "m16"],
    ];
    return pairs;
  }

  if (size === 8) {
    return [
      // Round of 8 -> Semis
      ["t1", "w1"], ["t8", "w1"],
      ["t4", "w2"], ["t5", "w2"],
      ["t3", "w3"], ["t6", "w3"],
      ["t2", "w4"], ["t7", "w4"],

      // Semis -> Final
      ["w1", "w5"], ["w2", "w5"],
      ["w3", "w6"], ["w4", "w6"],

      // Final -> Champion
      ["w5", "w7"], ["w6", "w7"],
      ["w7", "m16"],
    ];
  }

  if (size === 4) {
    return [
      // Semis
      ["t1", "w1"], ["t4", "w1"],
      ["t2", "w2"], ["t3", "w2"],

      // Final -> Champion
      ["w1", "w3"], ["w2", "w3"],
      ["w3", "m16"],
    ];
  }

  if (size === 2) {
    return [
      ["t1", "w1"], ["t2", "w1"],
      ["w1", "m16"],
    ];
  }

  return [];
}

export function drawAllConnections() {
  const svg = el("bracket-lines");
  const bracket = document.querySelector(".bracket");
  if (!svg || !bracket) return;

  const rect = bracket.getBoundingClientRect();

  svg.setAttribute("width", rect.width);
  svg.setAttribute("height", rect.height);
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  svg.innerHTML = "";

  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.pointerEvents = "none";

  const size = sizeFromDOM();
  const pairs = connectionPairsForSize(size);

  for (const [aId, bId] of pairs) {
    connect(svg, el(aId), el(bId));
  }
}