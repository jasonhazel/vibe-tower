import { playerState } from '../../state/PlayerState.js';

export class TomeBase {
  constructor() {
    this.id = 'tome-base';
    this.name = 'Tome';
    this.key = null; // stats key
  }

  apply() {
    if (this.key) playerState.addTome(this.key);
  }

  // optional: return a function(gfx, x, y, size) drawing the tome icon
  getSlotIconDrawer() { return null; }
}


