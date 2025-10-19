import { TomeCatalog, tomeUpgradeOptions } from '../items/tomes/Tomes.js';
import { WeaponCatalog } from '../items/weapons/WeaponCatalog.js';
import { playerState } from '../state/PlayerState.js';
import { PerkButton } from './components/PerkButton.js';

export class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUp'); }

  create(data) {
    const { chosenIds = [], maxTomes = 4, startingWeaponSelect = false } = data || {};
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
    const tomeOpts = startingWeaponSelect ? [] : (tomeSlotsAvailable ? availableTomes : []);
    const upgOpts = startingWeaponSelect ? [] : tomeUpgradeOptions(chosenIds);

    // Weapons: new unlocks (if not owned) and bundled upgrades for owned
    const ws = playerState.getWeaponState();
    const ownedWeaponIds = Object.keys(ws || {}).filter(id => ws[id]?.level > 0);
    const maxWeaponSlots = 4;
    const weaponSlotsAvailable = ownedWeaponIds.length < maxWeaponSlots;
    const unownedWeapons = startingWeaponSelect ? WeaponCatalog : (weaponSlotsAvailable ? WeaponCatalog.filter(w => !ownedWeaponIds.includes(w.id)) : []);
    const weaponUnlocks = unownedWeapons.map(w => ({ id: `w-${w.id}`, name: w.name, isWeapon: true, weaponId: w.id, apply: () => playerState.addWeaponById(w.id) }));

    // Build bundled upgrades: for each owned weapon, pick two distinct upgrade keys and present as one option
    const weaponUpgrades = [];
    for (const wMeta of WeaponCatalog) {
      if (!ownedWeaponIds.includes(wMeta.id)) continue;
      const opts = (wMeta.getUpgradeOptions?.(playerState) || []);
      if (opts.length < 1) continue;
      // choose two distinct if available
      const shuffled = opts.slice();
      for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
      const first = shuffled[0];
      const second = shuffled.find(o => o.upgradeKey !== first.upgradeKey) || null;
      const bundle = [first, second].filter(Boolean);
      if (bundle.length === 0) continue;
      weaponUpgrades.push({
        id: `wupg-bundle-${wMeta.id}-${first.upgradeKey}${second ? '-' + second.upgradeKey : ''}`,
        name: `${wMeta.name} Upgrade Bundle`,
        isUpgrade: true,
        isWeapon: true,
        weaponId: wMeta.id,
        bundle,
      });
    }

    // Build weighted pool so tomes are more likely when slots available
    const weighted = [];
    const pushWeighted = (arr, weight) => arr.forEach(it => weighted.push({ item: it, weight }));
    if (!startingWeaponSelect) {
      pushWeighted(tomeOpts, tomeSlotsAvailable ? 3 : 1);
      pushWeighted(upgOpts, 1);
      // Weapons weighted even higher than tomes when unlocking; upgrades normal
      if (weaponSlotsAvailable) pushWeighted(weaponUnlocks, tomeSlotsAvailable ? 4 : 2);
      pushWeighted(weaponUpgrades, 1);
    } else {
      // Starting selection: only weapons, heavier weight for variety
      pushWeighted(weaponUnlocks, 5);
    }

    // Sample up to 3 items without replacement using weights
    const bag = [];
    weighted.forEach((e, idx) => { for (let i = 0; i < Math.max(1, e.weight|0); i++) bag.push(idx); });
    // shuffle bag
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    const picked = new Set();
    const items = [];
    const maxChoices = startingWeaponSelect ? 3 : 3;
    for (let i = 0; i < bag.length && items.length < maxChoices; i++) {
      const idx = bag[i];
      const it = weighted[idx]?.item;
      if (!it) continue;
      const key = it.id || it.name || String(idx);
      if (picked.has(key)) continue;
      picked.add(key);
      items.push(it);
    }

    const bw = Math.min(360, panelW - 40); // equal width buttons, stacked
    const btnH = 78; // fixed height for 3 lines
    const btnGap = 12; // vertical spacing between buttons
    const bx = Math.floor(w / 2 - bw / 2);
    const by = y + 54;

    const makeBtn = (bx, by, { title, line2, line3, strokeColor }, onClick) => {
      const btn = new PerkButton(this, { x: bx, y: by, width: bw, height: btnH, rarityColor: strokeColor, title, line2, line3, onClick });
      return btn;
    };

    // Stacked options with rarity rolls for tomes and weapon upgrades
    const play = this.scene.get('PlayScene');
    items.forEach((t, i) => {
      let roll = null;
      if (!t.isWeapon) {
        roll = t.rollImpact?.() || null;
      } else if (t.isUpgrade && t.bundle) {
        // Build combined label and color using best rarity among two rolls
        const wInst = play?.weaponManager?.weapons?.find?.(w => w.getId?.() === t.weaponId);
        const r1 = t.bundle[0]?.rollImpact?.(wInst) || null;
        const r2 = t.bundle[1]?.rollImpact?.(wInst) || null;
        // choose the rarer roll by rarityName rank (fallback to larger value)
        const rank = (r) => {
          if (!r) return 0;
          const name = String(r.rarityName || '').toLowerCase();
          const map = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          return map[name] || 0;
        };
        roll = (rank(r1) > rank(r2)) ? r1 : (rank(r2) > rank(r1) ? r2 : ((r1 && r2) ? ((r1.value||0) >= (r2.value||0) ? r1 : r2) : (r1 || r2)));
        // embed rolls so we can apply on click
        t._bundleRolls = [r1, r2];
      }
      let title = t.name;
      let line2 = '';
      let line3 = '';
      if (t.isUpgrade && t.bundle) {
        const [a, b] = t.bundle;
        const [ra, rb] = t._bundleRolls || [];
        line2 = a ? `${a.short}${ra && typeof ra.value === 'number' ? ` +${ra.value.toFixed(a.upgradeKey === 'projectiles' ? 0 : 2)}` : ''}` : '';
        line3 = b ? `${b.short}${rb && typeof rb.value === 'number' ? ` +${rb.value.toFixed(b.upgradeKey === 'projectiles' ? 0 : 2)}` : ''}` : '';
      } else if (!t.isWeapon && roll) {
        line2 = `${roll.rarityName || 'Roll'} +${(roll.value ?? 0).toFixed(2)}`;
      }
      const strokeColor = roll?.rarityColor ? parseInt(String(roll.rarityColor).replace('#','0x')) : undefined;
      makeBtn(bx, by + i * (btnH + btnGap), { title, line2, line3, strokeColor }, () => {
        // Apply choice
        if (!t.isWeapon) {
          if (t.isUpgrade) {
            // Use tomeId when present and add rolled value to the tome's sum
            const tid = t.tomeId || t.id;
            playerState.upgradeTomeById?.(tid, roll?.value);
          } else {
            t.apply(playerState, { roll });
          }
        } else {
          if (t.bundle) {
            // Apply both upgrades with their rolls
            const [a, b] = t.bundle;
            const [ra, rb] = t._bundleRolls || [];
            if (a) playerState.upgradeWeaponById?.(t.weaponId, a.upgradeKey, ra?.value);
            if (b) playerState.upgradeWeaponById?.(t.weaponId, b.upgradeKey, rb?.value);
          } else {
            t.apply(playerState);
          }
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
            this.game.events.emit('tome:upgraded', t.tomeId || t.id);
          }
        }
        // Consume one pending level-up and update XP bar to remainder or keep full for next queued
        playerState.consumePendingLevelUp?.();
        this.scene.stop();
      });
    });

    // Skip button
    makeBtn(bx, y + panelH - (btnH + 16), 'Skip', () => {
      playerState.consumePendingLevelUp?.();
      this.game.events.emit('tome:skipped');
      this.scene.stop();
    });
  }
}


