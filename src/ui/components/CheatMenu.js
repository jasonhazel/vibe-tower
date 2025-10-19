import { TomeCatalog } from '../../items/tomes/Tomes.js';
import { playerState } from '../../state/PlayerState.js';

export class CheatMenu {
	constructor(scene) {
		this.scene = scene;
		this.buttons = [];
		this._onTomesUpdate = () => this.render();
		this._onResize = () => this.render();
		this._onLevelClosed = () => this.render();
		this.scene.game?.events?.on('tomes:update', this._onTomesUpdate);
		this.scene.game?.events?.on('weapon:add', this._onLevelClosed);
		this.scene.game?.events?.on('tome:selected', this._onLevelClosed);
		this.scene.game?.events?.on('tome:upgraded', this._onLevelClosed);
		this.scene.game?.events?.on('tome:skipped', this._onLevelClosed);
		this.scene.game?.events?.on('weapon:upgraded', this._onLevelClosed);
		this.scene.scale?.on('resize', this._onResize);
		this.render();
	}

	destroy() {
		if (this.buttons?.length) {
			this.buttons.forEach(b => { b.g?.destroy(); b.txt?.destroy(); b.zone?.destroy(); });
		}
		this.buttons = [];
		this.scene.game?.events?.off('tomes:update', this._onTomesUpdate);
		this.scene.game?.events?.off('weapon:add', this._onLevelClosed);
		this.scene.game?.events?.off('tome:selected', this._onLevelClosed);
		this.scene.game?.events?.off('tome:upgraded', this._onLevelClosed);
		this.scene.game?.events?.off('tome:skipped', this._onLevelClosed);
		this.scene.game?.events?.off('weapon:upgraded', this._onLevelClosed);
		this.scene.scale?.off('resize', this._onResize);
	}

	render() {
		// clear existing
		if (this.buttons?.length) {
			this.buttons.forEach(b => { b.g?.destroy(); b.txt?.destroy(); b.zone?.destroy(); });
		}
		this.buttons = [];

		const margin = 8;
		const bw = 150, bh = 22;
		let y = margin;

		const tomeState = playerState.getTomeState?.() || {};
		const ownedIds = Object.keys(tomeState).filter(id => (tomeState[id]?.level || 0) > 0);
		const maxTomes = 4;
		const isFull = ownedIds.length >= maxTomes;
		const unowned = isFull ? [] : TomeCatalog.filter(t => !ownedIds.includes(t.id));

		const makeBtn = (label, bx, by, onClick, colorCfg = { bg: 0x2a2a2a, hover: 0x333b3f, down: 0x1e2427, stroke: 0x607d8b }) => {
			const g = this.scene.add.graphics();
			const draw = (bg = colorCfg.bg, stroke = colorCfg.stroke) => {
				g.clear();
				g.fillStyle(bg, 0.9);
				g.fillRoundedRect(bx, by, bw, bh, 6);
				g.lineStyle(1, stroke, 1);
				g.strokeRoundedRect(bx, by, bw, bh, 6);
			};
			draw();
			const txt = this.scene.add.text(bx + 8, by + bh / 2, label, { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0, 0.5);
			const zone = this.scene.add.zone(bx, by, bw, bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
			zone.on('pointerover', () => draw(colorCfg.hover));
			zone.on('pointerout', () => draw());
			zone.on('pointerdown', () => draw(colorCfg.down));
			zone.on('pointerup', () => { draw(); onClick?.(); });
			this.buttons.push({ g, txt, zone });
		};

		// Tome grant buttons
		unowned.forEach((t, i) => {
			makeBtn(`Add ${t.name}`, margin, y, () => {
				t.apply(playerState);
				this.scene.game.events.emit('tome:selected', t.id);
				this.render();
			});
			y += bh + 6;
		});

		// Level up button below
		makeBtn('Level Up', margin, y + 8, () => playerState.levelUpOnceDebug?.(), { bg: 0x3a3a3a, hover: 0x414b41, down: 0x2b312b, stroke: 0x8bc34a });
		// XP grant buttons
		y = y + 8 + bh + 6;
		const addXpBtn = (amt, label) => makeBtn(label, margin, y, () => playerState.addXp?.(amt));
		addXpBtn(50, '+50 XP');
		y += bh + 6;
		addXpBtn(100, '+100 XP');
		y += bh + 6;
		addXpBtn(500, '+500 XP');
	}
}


