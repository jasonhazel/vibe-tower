import { playerState } from '../state/PlayerState.js';

export const TomeCatalog = [
  { id: 'tome-area', name: 'Tome of Area', apply: () => playerState.modStat('area', 0.2) },
  { id: 'tome-damage', name: 'Tome of Damage', apply: () => playerState.modStat('damage', 0.2) },
  { id: 'tome-projectiles', name: 'Tome of Projectiles', apply: () => playerState.modStat('projectiles', 1) },
  { id: 'tome-attackSpeed', name: 'Tome of Attack Speed', apply: () => playerState.modStat('attackSpeed', 0.2) },
  { id: 'tome-xp', name: 'Tome of Learning', apply: () => playerState.modStat('xp', 0.2) },
];


