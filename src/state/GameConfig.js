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
    baseDamage: 15,
    projectileSpeed: 260,
    range: 320, // base targeting range
    baseCooldownMs: 1000,
    radius: 4,
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


