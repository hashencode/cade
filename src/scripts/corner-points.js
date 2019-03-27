function add(t, n) {
  return [t[0] + n[0], t[1] + n[1]];
}
function multiply(t, n) {
  return [t[0] * n, t[1] * n];
}
function vectorFromPoints(t, n) {
  return [n[0] - t[0], n[1] - t[1]];
}
function isParallel(t, n) {
  return t[0] * n[1] - t[1] * n[0] == 0;
}
function dot(t, n) {
  return t[0] * n[0] + t[1] * n[1];
}
function generateConnectionPoints(
  {
    entryPoint: t = [0, 0],
    entryDirection: n = [0, 1],
    entryExt: e = 20,
    exitPoint: i = [10, 10],
    exitDirection: o = [1, 0],
    exitExt: a = 20
  },
  r = 0.5
) {
  if (null === o || '0,0' == o.join()) {
    let n = vectorFromPoints(i, t);
    o = Math.abs(n[0]) > Math.abs(n[1]) ? [n[0] / Math.abs(n[0]), 0] : [0, n[1] / Math.abs(n[1])];
  }
  let l = add(t, multiply(n, e)),
    d = add(i, multiply(o, a));
  o = multiply(o, -1);
  let u,
    c,
    f = [[d[0] - l[0], 0], [0, d[1] - l[1]]],
    s = f.find(t => isParallel(t, n));
  u = dot(s, n) > 0 ? s : anotherOne(f, s);
  let y = f.find(t => isParallel(t, o)),
    P = dot(u, (c = dot(y, o) > 0 ? y : anotherOne(f, y))) > 0 ? 2 : 1,
    h = anotherOne(f, c),
    m = [];
  if (((m = m.concat(t, l)), 1 == P)) {
    let t = add(l, u),
      n = add(t, c);
    m = m.concat(t, n);
  } else {
    let t = add(l, multiply(u, r)),
      n = add(t, h),
      e = add(n, multiply(c, 1 - r));
    m = m.concat(t, n, e);
  }
  return (m = m.concat(i));
}
function anotherOne(t, n) {
  return t.find(t => t != n);
}
export default generateConnectionPoints;
