const svg = document.getElementById("bracket-lines");

function resizeSVG() {
  const rect = document
    .querySelector(".bracket")
    .getBoundingClientRect();

  svg.setAttribute("width", rect.width);
  svg.setAttribute("height", rect.height);
}


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
  resizeSVG();
  svg.innerHTML = "";

  connect(t1, w1);
  connect(t16, w1);

  connect(t8, w2);
  connect(t9, w2);

  connect(t4, w3);
  connect(t13, w3);

  connect(t5, w4);
  connect(t12, w4);

  connect(t2, w5);
  connect(t15, w5);

  connect(t7, w6);
  connect(t10, w6);

  connect(t3, w7);
  connect(t14, w7);

  connect(t6, w8);
  connect(t11, w8);

  connect(w1, w9);
  connect(w2, w9);

  connect(w3, w10);
  connect(w4, w10);

  connect(w5, w11);
  connect(w6, w11);

  connect(w7, w12);
  connect(w8, w12);

  connect(w9, w13);
  connect(w10, w13);

  connect(w11, w14);
  connect(w12, w14);

  connect(w13, m16);
  connect(w14, m16);
  
}

window.addEventListener("load", drawAllConnections);
window.addEventListener("resize", drawAllConnections);
