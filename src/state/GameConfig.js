export const gameConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  spawnIntervalMs: 1000,
  spawn: {
    minRadius: 260,
    maxRadius: 380,
  },
  aura: {
    tickIntervalMs: 250,
    damagePerTick: 5,
    radius: 80,
  },
  fireball: {
    baseDamage: 10,
    projectileSpeed: 260,
    range: 80, // base targeting range
    baseCooldownMs: 1500,
    radius: 4,
  },
  chainLightning: {
    baseDamage: 10,
    baseCooldownMs: 2000,
    range: 83, // max distance from player to first target
    chainRange: 50, // max distance between chained targets
    maxJumps: 0, // additional targets after the first
    falloff: 0.8, // damage multiplier per jump
  },
  boomerang: {
    baseDamage: 12,
    baseCooldownMs: 1300,
    range: 81,
    projectileSpeed: 220,
    radius: 6,
    pierce: 2,
  },
  slam: {
    baseDamage: 50,
    baseCooldownMs: 5000,
    maxRadius: 90,
    growthSpeed: 180, // px per second
  },
  xpPickup: {
    // Starting pickup radius for XP crystals; smaller than aura radius (100)
    baseRadius: 70,
  },
  enemy: {
    baseSpeed: 40,
    baseHp: 5,
  },
  player: {
    baseHealth: 100,
    baseShield: 0,
    contactTickMs: 300,
    contactDamagePerEnemy: 5,
    radius: 16,
  },
};


