function svgPoint(svg, x, y) {
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function connect(svg, a, b) {
  if (!a || !b) return;

  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  const p1 = svgPoint(svg, r1.right, r1.top + r1.height / 2);
  const p2 = svgPoint(svg, r2.left, r2.top + r2.height / 2);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    `M ${p1.x} ${p1.y} H ${p1.x + 20} V ${p2.y} H ${p2.x}`
  );
  path.setAttribute('stroke', '#4169E1');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);
}

export function drawAllConnections() {
  const svg = document.getElementById('bracket-lines');
  const bracket = document.querySelector('.bracket');
  if (!svg || !bracket) return;

  const rect = bracket.getBoundingClientRect();
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.innerHTML = '';

  const ids = [
    ['t1', 'w1'],
    ['t16', 'w1'],
    ['t8', 'w2'],
    ['t9', 'w2'],
    ['t4', 'w3'],
    ['t13', 'w3'],
    ['t5', 'w4'],
    ['t12', 'w4'],
    ['t2', 'w5'],
    ['t15', 'w5'],
    ['t7', 'w6'],
    ['t10', 'w6'],
    ['t3', 'w7'],
    ['t14', 'w7'],
    ['t6', 'w8'],
    ['t11', 'w8'],
    ['w1', 'w9'],
    ['w2', 'w9'],
    ['w3', 'w10'],
    ['w4', 'w10'],
    ['w5', 'w11'],
    ['w6', 'w11'],
    ['w7', 'w12'],
    ['w8', 'w12'],
    ['w9', 'w13'],
    ['w10', 'w13'],
    ['w11', 'w14'],
    ['w12', 'w14'],
    ['w13', 'm16'],
    ['w14', 'm16'],
  ];

  for (const [aId, bId] of ids) {
    connect(svg, document.getElementById(aId), document.getElementById(bId));
  }
}
