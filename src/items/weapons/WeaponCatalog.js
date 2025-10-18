// Lightweight catalog describing available weapons and their upgrade options.
// Creation of actual weapon instances is handled by PlayScene on selection.

export const WeaponCatalog = [
  {
    id: 'aura',
    name: 'Aura',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['aura'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-aura-${key}`, name: `Aura ${label}`, isUpgrade: true, isWeapon: true, weaponId: 'aura', upgradeKey: key, apply: () => ps.upgradeWeaponById?.('aura', key) });
      return [mk('damage', 'Damage+'), mk('radius', 'Radius+'), mk('tick', 'Tick Faster')];
    },
  },
  {
    id: 'fireball',
    name: 'Fireball',
    getUpgradeOptions(ps) {
      const s = ps?.getWeaponState?.()?.['fireball'];
      if (!s || s.level <= 0) return [];
      const mk = (key, label) => ({ id: `wupg-fireball-${key}`, name: `Fireball ${label}`, isUpgrade: true, isWeapon: true, weaponId: 'fireball', upgradeKey: key, apply: () => ps.upgradeWeaponById?.('fireball', key) });
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
];


