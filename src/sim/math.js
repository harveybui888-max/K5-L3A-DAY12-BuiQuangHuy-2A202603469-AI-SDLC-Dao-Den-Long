// 3D Vector Math Helpers (all measured with X, Y, Z where Y is up)

export function round3(n) {
  return Math.round(n * 1000) / 1000;
}

export function roundVec3(v) {
  return [round3(v[0]), round3(v[1]), round3(v[2])];
}

export function distXZ(a, b) {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function dist3D(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function lengthXZ(x, z) {
  return Math.sqrt(x * x + z * z);
}

export function normalizeXZ(x, z) {
  const len = lengthXZ(x, z);
  if (len < 1e-9) return [0, 0];
  return [x / len, z / len];
}
