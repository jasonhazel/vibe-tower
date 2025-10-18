import { playerState } from '../state/PlayerState.js';

export const TomeCatalog = [
  { id: 'tome-area', name: 'Tome of Area', key: 'area', apply: () => playerState.addTome('area') },
  { id: 'tome-damage', name: 'Tome of Damage', key: 'damage', apply: () => playerState.addTome('damage') },
  { id: 'tome-projectiles', name: 'Tome of Projectiles', key: 'projectiles', apply: () => playerState.addTome('projectiles') },
  { id: 'tome-attackSpeed', name: 'Tome of Attack Speed', key: 'attackSpeed', apply: () => playerState.addTome('attackSpeed') },
  { id: 'tome-xp', name: 'Tome of Learning', key: 'xp', apply: () => playerState.addTome('xp') },
];

export function tomeUpgradeOptions(ownedIds) {
  // For each owned tome id, produce an upgrade option
  const options = [];
  for (const t of TomeCatalog) {
    if (ownedIds.includes(t.id)) {
      options.push({ id: `upg-${t.id}`, name: `${t.name}+`, apply: () => playerState.upgradeTome(t.key) });
    }
  }
  return options;
}


