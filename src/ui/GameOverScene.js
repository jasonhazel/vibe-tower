import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
    this.handlers = [];
  }

  create(data) {
    const { runMs = 0, xpTotal = 0, level = 1 } = data || {};
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    this.cameras.main.setScroll(0, 0);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0, 0);

    const panelW = Math.min(360, w - 40);
    const panelH = 200;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1e1e, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0x90caf9, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.add.text(w / 2, panelY + 20, 'Game Over', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0.5);

    const totalSeconds = Math.floor(runMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');

    const stats = [
      `Time: ${mm}:${ss}`,
      `Level: ${level}`,
      `XP: ${xpTotal}`,
      `HP: ${playerState.getHealthCurrent()} / ${playerState.getHealthMax()}`,
    ];
    for (let i = 0; i < stats.length; i++) {
      this.add.text(w / 2, panelY + 60 + i * 22, stats[i], { fontFamily: 'monospace', fontSize: '14px', color: '#e0e0e0' }).setOrigin(0.5, 0.5);
    }

    // Restart button
    const btnW = 140;
    const btnH = 36;
    const btnX = w / 2 - btnW - 8;
    const btnY = panelY + panelH - 54;
    const btn = this.add.graphics();
    const drawBtn = (bg = 0x263238, stroke = 0x90caf9) => {
      btn.clear();
      btn.fillStyle(bg, 1);
      btn.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
      btn.lineStyle(2, stroke, 1);
      btn.strokeRoundedRect(btnX, btnY, btnW, btnH, 8);
    };
    drawBtn();
    const label = this.add.text(btnX + btnW / 2, btnY + btnH / 2, 'Restart', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);

    const hit = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBtn(0x2e3b43, 0xace0ff));
    hit.on('pointerout', () => drawBtn());
    hit.on('pointerdown', () => drawBtn(0x1b252b, 0x6fb7ff));
    hit.on('pointerup', () => {
      drawBtn();
      this.game.events.emit('game:restart');
    });

    // Share button
    const shareW = 140;
    const shareH = 36;
    const shareX = w / 2 + 8;
    const shareY = btnY;
    const shareBtn = this.add.graphics();
    const drawShare = (bg = 0x263238, stroke = 0x90caf9) => {
      shareBtn.clear();
      shareBtn.fillStyle(bg, 1);
      shareBtn.fillRoundedRect(shareX, shareY, shareW, shareH, 8);
      shareBtn.lineStyle(2, stroke, 1);
      shareBtn.strokeRoundedRect(shareX, shareY, shareW, shareH, 8);
    };
    drawShare();
    const shareLabel = this.add.text(shareX + shareW / 2, shareY + shareH / 2, 'Share', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    const shareZone = this.add.zone(shareX, shareY, shareW, shareH).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    shareZone.on('pointerover', () => drawShare(0x2e3b43, 0xace0ff));
    shareZone.on('pointerout', () => drawShare());
    shareZone.on('pointerdown', () => drawShare(0x1b252b, 0x6fb7ff));
    shareZone.on('pointerup', async () => {
      drawShare();
      await this._shareScoreCard({ runMs, xpTotal, level });
    });
  }

  async _shareScoreCard({ runMs, xpTotal, level }) {
    try {
      const w = 720;
      const h = 330; // compact but ensures icons and footer fit without overlap
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      // Background
      ctx.fillStyle = '#0f1418';
      ctx.fillRect(0, 0, w, h);
      // Border
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Vibe Tower - Run Summary', w / 2, 56);
      // Basic stats
      const totalSeconds = Math.floor(runMs / 1000);
      const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      ctx.font = '18px monospace';
      ctx.textAlign = 'left';
      const left = 40;
      let y = 100;
      const dy = 28;
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(`Time: ${mm}:${ss}`, left, y); y += dy;
      ctx.fillText(`Level: ${level}`, left, y); y += dy;
      ctx.fillText(`XP: ${xpTotal}`, left, y); y += dy;

      // Player stats
      const s = playerState.getStats?.() || {};
      const statRows = [
        ['Area', s.area],
        ['Damage', s.damage],
        ['Projectiles', s.projectiles],
        ['Attack Speed', s.attackSpeed],
        ['Pickup', s.pickup],
        ['XP Mult', s.xp],
      ];
      const colX = left + 320;
      let y2 = 100;
      ctx.fillStyle = '#b0bec5';
      ctx.font = '16px monospace';
      ctx.fillText('Stats', colX, y2 - 10);
      ctx.fillStyle = '#e0e0e0';
      statRows.forEach(([label, val]) => {
        const v = (typeof val === 'number') ? (label === 'Projectiles' ? String(Math.floor(val)) : val.toFixed(2)) : String(val ?? '-');
        ctx.fillText(`${label}: ${v}`, colX, y2);
        y2 += 24;
      });

      // Owned weapons and tomes
      const ws = playerState.getWeaponState?.() || {};
      const ownedWeapons = Object.keys(ws).filter(id => (ws[id]?.level || 0) > 0);
      const ts = playerState.getTomeState?.() || {};
      const ownedTomes = Object.keys(ts).filter(id => (ts[id]?.level || 0) > 0);

      // Section titles
      const iconsTop = 240; // place icons below stats
      ctx.fillStyle = '#b0bec5';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Weapons', left, iconsTop);
      ctx.fillText('Tomes', colX, iconsTop);

      // Helpers to draw icons on 2D canvas (approximate in-game icon styles)
      const drawCircleStroke = (x, y, r, color, lineW = 2) => {
        ctx.beginPath(); ctx.lineWidth = lineW; ctx.strokeStyle = color; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      };
      const drawCircleFill = (x, y, r, color) => {
        ctx.beginPath(); ctx.fillStyle = color; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      };
      const drawDiamond = (cx, cy, r, fill, stroke) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
      };

      const drawWeaponIcon = (id, cx, cy, size) => {
        const r = Math.floor(size * 0.42);
        if (id === 'aura') drawCircleStroke(cx, cy, r, '#66bb6a', 3);
        else if (id === 'fireball') drawCircleFill(cx, cy, r, '#ff5252');
        else if (id === 'slam') drawCircleStroke(cx, cy, r, '#ffeb3b', 3);
        else drawCircleStroke(cx, cy, r, '#90caf9', 2);
      };

      const drawTomeIcon = (id, cx, cy, size) => {
        const r = Math.floor(size * 0.42);
        if (id === 'tome-area') drawCircleStroke(cx, cy, r, '#66bb6a', 2);
        else if (id === 'tome-pickup') drawCircleStroke(cx, cy, r, '#42a5f5', 2);
        else if (id === 'tome-damage') drawCircleFill(cx, cy, Math.floor(size * 0.32), '#ef5350');
        else if (id === 'tome-attackSpeed') { ctx.strokeStyle = '#8bc34a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - 8); ctx.lineTo(cx + 8, cy); ctx.stroke(); }
        else if (id === 'tome-projectiles') { const rr = Math.floor(size * 0.12); drawCircleFill(cx - rr * 2.5, cy, rr, '#90caf9'); drawCircleFill(cx, cy, rr, '#90caf9'); drawCircleFill(cx + rr * 2.5, cy, rr, '#90caf9'); }
        else if (id === 'tome-xp') drawDiamond(cx, cy, Math.floor(size * 0.32), '#42a5f5', '#90caf9');
        else drawCircleStroke(cx, cy, r, '#90caf9', 2);
      };

      // Layout icons in rows
      const iconSize = 28;
      const gap = 14;
      const startWY = iconsTop + 26;
      let wx = left + iconSize / 2;
      let wy = startWY;
      ownedWeapons.forEach((id, idx) => {
        drawWeaponIcon(id, wx, wy, iconSize);
        wx += iconSize + gap;
        if ((idx + 1) % 6 === 0) { wx = left + iconSize / 2; wy += iconSize + gap; }
      });

      const startTY = iconsTop + 26;
      let tx = colX + iconSize / 2;
      let ty = startTY;
      ownedTomes.forEach((id, idx) => {
        drawTomeIcon(id, tx, ty, iconSize);
        tx += iconSize + gap;
        if ((idx + 1) % 6 === 0) { tx = colX + iconSize / 2; ty += iconSize + gap; }
      });
      // Footer
      ctx.fillStyle = '#90caf9';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('vibes.tower', w - 16, h - 18);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('toBlob failed');
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      // Optional toast
      try { this._toast?.destroy?.(); } catch (_) {}
      const t = this.add.text(this.scale.gameSize.width / 2, this.scale.gameSize.height - 40, 'Copied image to clipboard!', { fontFamily: 'monospace', fontSize: '14px', color: '#a5d6a7' }).setOrigin(0.5);
      this._toast = t;
      this.time.delayedCall(1500, () => t.destroy());
    } catch (err) {
      console.warn('Share failed', err);
      try { this._toast?.destroy?.(); } catch (_) {}
      const t = this.add.text(this.scale.gameSize.width / 2, this.scale.gameSize.height - 40, 'Share failed (clipboard blocked?)', { fontFamily: 'monospace', fontSize: '14px', color: '#ef9a9a' }).setOrigin(0.5);
      this._toast = t;
      this.time.delayedCall(1500, () => t.destroy());
    }
  }
}


