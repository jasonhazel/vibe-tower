// Lightweight catalog describing available weapons and their upgrade options.
// Creation of actual weapon instances is handled by PlayScene on selection.

export const WeaponCatalog = [
  {
    id: 'aura',
    name: 'Aura',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['aura'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-aura-${key}`, name: `Aura ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: 'aura', upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.('aura', key) });
      return [mk('damage', 'Damage+'), mk('radius', 'Radius+'), mk('tick', 'Tick Faster')];
    },
  },
  {
    id: 'chainLightning',
    name: 'Chain Lightning',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['chainLightning'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-chainLightning-${key}`, name: `Chain Lightning ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: 'chainLightning', upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.('chainLightning', key) });
      return [
        mk('damage', 'Damage+'),
        mk('cooldown', 'Faster Cooldown'),
        mk('range', 'Range+'),
        mk('radius', 'Chain Range+'),
        mk('projectiles', 'More Chains'),
      ];
    },
  },
  {
    id: 'fireball',
    name: 'Fireball',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['fireball'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-fireball-${key}`, name: `Fireball ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: 'fireball', upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.('fireball', key) });
      return [
        mk('damage', 'Damage+'),
        mk('cooldown', 'Faster Cast'),
        mk('range', 'Range+'),
        mk('speed', 'Projectile Speed+'),
        mk('radius', 'Explosion Radius+'),
        mk('projectiles', 'More Projectiles'),
      ];
    },
  },
  {
    id: 'slam',
    name: 'Slam',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['slam'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-slam-${key}`, name: `Slam ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: 'slam', upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.('slam', key) });
      return [mk('damage', 'Damage+'), mk('cooldown', 'Faster Cooldown'), mk('radius', 'Max Radius+'), mk('growth', 'Faster Growth')];
    },
  },
];


