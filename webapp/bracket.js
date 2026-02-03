const svg = document.getElementById("bracket-lines");

function svgPoint(x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function connect(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  const p1 = svgPoint(
    r1.right,
    r1.top + r1.height / 2
  );

  const p2 = svgPoint(
    r2.left,
    r2.top + r2.height / 2
  );

  const path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  path.setAttribute(
    "d",
    `
      M ${p1.x} ${p1.y}
      H ${p1.x + 20}
      V ${p2.y}
      H ${p2.x}
    `
  );

  path.setAttribute("stroke", "#4169E1");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");

  svg.appendChild(path);
}

function drawAllConnections() {
  svg.innerHTML = "";

  connect(m1, m9);
  connect(m2, m9);

  connect(m3, m10);
  connect(m4, m10);

  connect(m5, m11);
  connect(m6, m11);

  connect(m7, m12);
  connect(m8, m12);

  connect(m9, m13);
  connect(m10, m13);

  connect(m11, m14);
  connect(m12, m14);

  connect(m13, m15);
  connect(m14, m15);

  connect(m15, m16);
}

window.addEventListener("load", drawAllConnections);
window.addEventListener("resize", drawAllConnections);
window.addEventListener("scroll", drawAllConnections);
