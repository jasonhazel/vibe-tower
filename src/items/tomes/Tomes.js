import { TomeArea } from './TomeArea.js';
import { TomeDamage } from './TomeDamage.js';
import { TomeProjectiles } from './TomeProjectiles.js';
import { TomeAttackSpeed } from './TomeAttackSpeed.js';
import { TomeXP } from './TomeXP.js';
import { TomePickup } from './TomePickup.js';
import { playerState } from '../../state/PlayerState.js';

export const TomeCatalog = [
  new TomeArea(),
  new TomeDamage(),
  new TomeProjectiles(),
  new TomeAttackSpeed(),
  new TomeXP(),
  new TomePickup(),
];

export function tomeUpgradeOptions(ownedIds) {
  // For each owned tome id, produce an upgrade option
  const options = [];
  for (const t of TomeCatalog) {
    if (ownedIds.includes(t.id)) {
      options.push({ id: `upg-${t.id}`, name: `${t.name}+`, isUpgrade: true, apply: () => playerState.upgradeTome(t.key), getSlotIconDrawer: () => t.getSlotIconDrawer?.() });
    }
  }
  return options;
}


