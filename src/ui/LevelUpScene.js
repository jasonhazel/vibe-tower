import { TomeCatalog, tomeUpgradeOptions } from '../items/tomes/Tomes.js';
import { WeaponCatalog } from '../items/weapons/WeaponCatalog.js';
import { playerState } from '../state/PlayerState.js';

export class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUp'); }

  create(data) {
    const { chosenIds = [], maxTomes = 4 } = data || {};
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    this.cameras.main.setScroll(0, 0);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0, 0);
    const panelW = Math.min(520, w - 40);
    const panelH = Math.min(420, h - 80);
    const x = (w - panelW) / 2;
    const y = (h - panelH) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1e1e, 0.95);
    panel.fillRect(x, y, panelW, panelH);
    panel.lineStyle(2, 0x8bc34a, 1);
    panel.strokeRect(x, y, panelW, panelH);

    this.add.text(w / 2, y + 18, 'Choose a Perk', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    // Determine available tomes
    const availableTomes = TomeCatalog.filter((t) => !chosenIds.includes(t.id));
    const tomeSlotsAvailable = (chosenIds.length < maxTomes);
    const tomeOpts = tomeSlotsAvailable ? availableTomes : [];
    const upgOpts = tomeUpgradeOptions(chosenIds);

    // Weapons: new unlocks (if not owned) and upgrades for owned
    const ws = playerState.getWeaponState();
    const ownedWeaponIds = Object.keys(ws || {}).filter(id => ws[id]?.level > 0);
    const unownedWeapons = WeaponCatalog.filter(w => !ownedWeaponIds.includes(w.id));
    const weaponUnlocks = unownedWeapons.map(w => ({ id: `w-${w.id}`, name: w.name, isWeapon: true, weaponId: w.id, apply: () => playerState.addWeaponById(w.id) }));
    const weaponUpgrades = WeaponCatalog.flatMap(w => w.getUpgradeOptions?.(playerState) || []);

    // Build weighted pool so tomes are more likely when slots available
    const weighted = [];
    const pushWeighted = (arr, weight) => arr.forEach(it => weighted.push({ item: it, weight }));
    pushWeighted(tomeOpts, tomeSlotsAvailable ? 3 : 1);
    pushWeighted(upgOpts, 1);
    // Weapons weighted even higher than tomes when unlocking; upgrades normal
    pushWeighted(weaponUnlocks, tomeSlotsAvailable ? 4 : 2);
    pushWeighted(weaponUpgrades, 1);

    // Sample up to 3 items without replacement using weights
    const bag = [];
    weighted.forEach((e, idx) => { for (let i = 0; i < Math.max(1, e.weight|0); i++) bag.push(idx); });
    // shuffle bag
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    const picked = new Set();
    const items = [];
    for (let i = 0; i < bag.length && items.length < 3; i++) {
      const idx = bag[i];
      const it = weighted[idx]?.item;
      if (!it) continue;
      const key = it.id || it.name || String(idx);
      if (picked.has(key)) continue;
      picked.add(key);
      items.push(it);
    }

    const bw = Math.min(360, panelW - 40); // equal width buttons, stacked
    const btnH = 44;
    const bx = Math.floor(w / 2 - bw / 2);
    const by = y + 54;

    const makeBtn = (bx, by, label, onClick) => {
      const bh = btnH;
      const g = this.add.graphics();
      const draw = (bg = 0x263238, stroke = 0x8bc34a) => {
        g.clear();
        g.fillStyle(bg, 1);
        g.fillRect(bx, by, bw, bh);
        g.lineStyle(2, stroke, 1);
        g.strokeRect(bx, by, bw, bh);
      };
      draw();
      const txt = this.add.text(bx + bw / 2, by + bh / 2, label, { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', wordWrap: { width: bw - 24 } }).setOrigin(0.5);
      const zone = this.add.zone(bx, by, bw, bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => draw(0x2e3b43));
      zone.on('pointerout', () => draw());
      zone.on('pointerdown', () => draw(0x1b252b));
      zone.on('pointerup', () => { draw(); onClick?.(); });
    };

    // Stacked options with rarity rolls for tomes and weapon upgrades
    const play = this.scene.get('PlayScene');
    items.forEach((t, i) => {
      let roll = null;
      if (!t.isWeapon) {
        roll = t.rollImpact?.() || null;
      } else if (t.isUpgrade && t.rollImpact) {
        // get weapon instance from PlayScene
        const wInst = play?.weaponManager?.weapons?.find?.(w => w.getId?.() === t.weaponId);
        roll = t.rollImpact(wInst) || null;
      }
      const rollText = roll ? `  [${roll.rarityName || 'Roll'} +${(roll.value ?? 0).toFixed(2)}]` : '';
      const label = `${t.name}${rollText}`;
      makeBtn(bx, by + i * 52, label, () => {
        // Apply choice (include roll for tomes)
        if (!t.isWeapon) {
          t.apply(playerState, { roll });
        } else {
          t.apply(playerState);
        }
        // Branch by type
        if (t.isWeapon) {
          if (!t.isUpgrade && t.weaponId) {
            // unlock: ask PlayScene to instantiate and equip
            this.game.events.emit('weapon:add', t.weaponId);
          } else if (t.isUpgrade && t.weaponId) {
            // pass rolled value to weapon upgrade
            playerState.upgradeWeaponById?.(t.weaponId, t.upgradeKey, roll?.value);
            this.game.events.emit('weapon:upgraded', { weaponId: t.weaponId, key: t.upgradeKey });
          }
          // weapon upgrades don't change tome slots
        } else {
          // Tome logic
          if (!t.isUpgrade) {
            this.game.events.emit('tome:selected', t.id);
          } else {
            playerState.upgradeTomeById?.(t.id, roll?.value);
            this.game.events.emit('tome:upgraded', t.id);
          }
        }
        // Clear deferred XP after selection
        playerState.finalizeLevelUp?.();
        this.scene.stop();
        this.scene.resume('PlayScene');
      });
    });

    // Skip button
    makeBtn(bx, y + panelH - (btnH + 16), 'Skip', () => {
      playerState.finalizeLevelUp?.();
      this.game.events.emit('tome:skipped');
      this.scene.stop();
      this.scene.resume('PlayScene');
    });
  }
}


