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
  if (el("m15")) return 16;
  if (el("m7")) return 8;
  if (el("m3")) return 4;
  if (el("m1") && el("m16")) return 2;
  return 0;
}

function connectionPairsForSize(size) {
  if (size === 16) {
    return [
      ["m1", "m9"], ["m2", "m9"],
      ["m3", "m10"], ["m4", "m10"],
      ["m5", "m11"], ["m6", "m11"],
      ["m7", "m12"], ["m8", "m12"],
      ["m9", "m13"], ["m10", "m13"],
      ["m11", "m14"], ["m12", "m14"],
      ["m13", "m15"], ["m14", "m15"],
      ["m15", "m16"],
    ];
  }

  if (size === 8) {
    return [
      ["m1", "m5"], ["m2", "m5"],
      ["m3", "m6"], ["m4", "m6"],
      ["m5", "m7"], ["m6", "m7"],
      ["m7", "m16"],
    ];
  }

  if (size === 4) {
    return [["m1", "m3"], ["m2", "m3"], ["m3", "m16"]];
  }

  if (size === 2) {
    return [["m1", "m16"]];
  }

  return [];
}

function prepareSvg(svg, board) {
  const rect = board.getBoundingClientRect();
  const width = Math.ceil(Math.max(rect.width, board.scrollWidth || 0));
  const height = Math.ceil(Math.max(rect.height, board.scrollHeight || 0));
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";
  svg.style.zIndex = "1";
}

export function drawAllConnections(sizeHint = 0) {
  const svg = el("bracket-lines");
  const bracket = document.querySelector(".bracket");
  if (!svg || !bracket) return;

  prepareSvg(svg, bracket);

  const size = sizeHint || inferSizeFromDOM();
  const pairs = connectionPairsForSize(size);

  for (const [aId, bId] of pairs) {
    connect(svg, el(aId), el(bId));
  }
}

export function drawDataConnections({ svgId, boardSelector, itemSelector = "[data-source-matchids]", skipCrossLane = false }) {
  const svg = document.getElementById(svgId);
  const board = document.querySelector(boardSelector);
  if (!svg || !board) return;

  prepareSvg(svg, board);

  for (const target of board.querySelectorAll(itemSelector)) {
    const raw = target.getAttribute("data-source-matchids") || "";
    const targetLane = target.getAttribute("data-lane") || "";
    const sources = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    for (const sourceId of sources) {
      const source = document.getElementById(sourceId);
      if (!source) continue;

      if (skipCrossLane) {
        const sourceLane = source.getAttribute("data-lane") || "";
        const sameLane = sourceLane && targetLane && sourceLane === targetLane;
        const intoFinals = targetLane === "finals" && (sourceLane === "winners" || sourceLane === "losers" || sourceLane === "finals");
        const finalsToChampion = sourceLane === "finals" && targetLane === "champion";
        if (!sameLane && !intoFinals && !finalsToChampion) continue;
      }

      connect(svg, source, target);
    }
  }
}
