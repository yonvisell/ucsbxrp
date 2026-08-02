const STANDARD_GRAVITY_M_S2 = 9.80665;

export function milligravityToMetersPerSecondSquared(value: number): number {
  return (value * STANDARD_GRAVITY_M_S2) / 1_000;
}

export function millidegreesPerSecondToRadiansPerSecond(value: number): number {
  return (value / 180_000) * Math.PI;
}
