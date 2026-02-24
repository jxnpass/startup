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

  const s = 10;
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
  // ✅ Important: connect match containers to winners to reduce crossings.

  if (size === 16) {
    // Round 1: m1..m8 -> w1..w8 (instead of t# -> w#)
    const pairs = [];
    for (let i = 1; i <= 8; i++) pairs.push([`m${i}`, `w${i}`]);

    // Round 2: m9..m12 -> w9..w12
    for (let i = 9; i <= 12; i++) pairs.push([`m${i}`, `w${i}`]);

    // Round 3: m13..m14 -> w13..w14
    for (let i = 13; i <= 14; i++) pairs.push([`m${i}`, `w${i}`]);

    // Final -> Champion
    pairs.push(["m15", "m16"]);
    return pairs;
  }

  if (size === 8) {
    return [
      // Round of 8 matches -> semifinal winners
      ["m1", "w1"],
      ["m2", "w2"],
      ["m3", "w3"],
      ["m4", "w4"],

      // Semifinal matches -> final winners
      ["m5", "w5"],
      ["m6", "w6"],

      // Final -> Champion
      ["m7", "m16"],
    ];
  }

  if (size === 4) {
    return [
      ["m1", "w1"],
      ["m2", "w2"],
      ["m3", "m16"], // final -> champion
    ];
  }

  if (size === 2) {
    return [["m1", "m16"]];
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