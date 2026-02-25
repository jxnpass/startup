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

function inferSizeFromDOM() {
  // Prefer match ids because team ids can be absent (winner placeholders)
  // and BYEs can remove some team boxes.
  if (el("m15")) return 16;
  if (el("m7")) return 8;
  if (el("m3")) return 4;
  if (el("m1") && el("m16")) return 2;
  return 0;
}

function connectionPairsForSize(size) {
  // ✅ Connect MATCH containers to the NEXT ROUND match containers.
  // This makes elbows meet at the visual midpoint of each matchup,
  // regardless of BYEs or internal match spacing.

  if (size === 16) {
    return [
      // R1 (m1..m8) -> R2 (m9..m12)
      ["m1", "m9"], ["m2", "m9"],
      ["m3", "m10"], ["m4", "m10"],
      ["m5", "m11"], ["m6", "m11"],
      ["m7", "m12"], ["m8", "m12"],

      // R2 (m9..m12) -> R3 (m13..m14)
      ["m9", "m13"], ["m10", "m13"],
      ["m11", "m14"], ["m12", "m14"],

      // R3 -> Final (m15)
      ["m13", "m15"], ["m14", "m15"],

      // Final -> Champion
      ["m15", "m16"],
    ];
  }

  if (size === 8) {
    return [
      // R1 (m1..m4) -> Semis (m5..m6)
      ["m1", "m5"], ["m2", "m5"],
      ["m3", "m6"], ["m4", "m6"],

      // Semis -> Final (m7)
      ["m5", "m7"], ["m6", "m7"],

      // Final -> Champion
      ["m7", "m16"],
    ];
  }

  if (size === 4) {
    return [
      // Semis (m1..m2) -> Final (m3)
      ["m1", "m3"], ["m2", "m3"],

      // Final -> Champion
      ["m3", "m16"],
    ];
  }

  if (size === 2) {
    return [["m1", "m16"]];
  }

  return [];
}

export function drawAllConnections(sizeHint = 0) {
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

  const size = sizeHint || inferSizeFromDOM();
  const pairs = connectionPairsForSize(size);

  for (const [aId, bId] of pairs) {
    connect(svg, el(aId), el(bId));
  }
}