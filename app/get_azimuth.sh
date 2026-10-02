cat << 'INLINE' > convert.ts
export function getAzimuthAndDistance(x: number, y: number) {
  const azimuth = Math.atan2(x, y) * (180 / Math.PI);
  const distance = Math.sqrt(x*x + y*y);
  return { azimuth, distance };
}
INLINE
