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
  const options = [];
  for (const t of TomeCatalog) {
    if (ownedIds.includes(t.id)) {
      const opts = t.getUpgradeOptions?.(playerState) || [];
      options.push(...opts);
    }
  }
  return options;
}


