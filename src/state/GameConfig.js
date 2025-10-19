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
    radius: 60,
  },
  fireball: {
    baseDamage: 10,
    projectileSpeed: 260,
    range: 100, // base targeting range
    baseCooldownMs: 1500,
    radius: 4,
  },
  chainLightning: {
    baseDamage: 10,
    baseCooldownMs: 2000,
    range: 90, // max distance from player to first target
    chainRange: 50, // max distance between chained targets
    maxJumps: 0, // additional targets after the first
    falloff: 0.8, // damage multiplier per jump
  },
  boomerang: {
    baseDamage: 12,
    baseCooldownMs: 1300,
    range: 80,
    projectileSpeed: 220,
    radius: 6,
    pierce: 2,
  },
  blades: {
    baseDamage: 10,
    baseCooldownMs: 250,
    orbitRadius: 80,
    rotationSpeed: 180,
    bladeLength: 16,
    bladeHitRadius: 8,
    bladeCount: 1,
  },
  slam: {
    baseDamage: 50,
    baseCooldownMs: 5000,
    maxRadius: 90,
    growthSpeed: 180, // px per second
  },
  xpPickup: {
    // Starting pickup radius for XP crystals; smaller than aura radius (100)
    baseRadius: 50,
  },
  // Loot system config
  loot: {
    // Chance that a defeated enemy drops loot instead of XP (0..1)
    dropChance: 0.01,
    // Weighted pool of loot items
    pool: [
      { id: 'healthpack', weight: 1 },
      { id: 'magnet', weight: 1 },
    ],
    // Item-specific configs
    healthpack: {
      healAmount: 20,
    },
    magnet: {
      // currently no params; reserved for future tuning
    },
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


