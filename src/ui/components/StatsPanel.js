import { EventBus } from '../../state/EventBus.js';
import { playerState } from '../../state/PlayerState.js';

export class StatsPanel {
	constructor(scene) {
		this.scene = scene;
		this.container = scene.add.container(0, 0);
		this.bg = scene.add.graphics();
		this.container.add(this.bg);
		this.labels = [];
		this.values = [];
		this.margin = 10;
		this.width = 180;
		this.lineH = 18;
		this.title = scene.add.text(0, 0, 'Stats', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' });
		this.container.add(this.title);
		this._draw(playerState.getStats());

		this.onStats = (stats) => this._draw(stats);
		EventBus.on('stats:update', this.onStats);
		// Also refresh when XP progress changes so we can show current/needed
		this.onXp = () => this._draw(playerState.getStats());
		EventBus.on('xp:progress', this.onXp);
		// Refresh when weapons list changes
		this.onWeapons = () => this._draw(playerState.getStats());
		this.scene.game?.events?.on('weapons:update', this.onWeapons);
	}

	setPosition(x, y) {
		this.container.setPosition(x, y);
	}

	_draw(stats) {
		// clear previous labels/values
		this.labels.forEach((t) => t.destroy());
		this.values.forEach((t) => t.destroy());
		this.labels.length = 0;
		this.values.length = 0;

		// Player block (without XP Prog)
		const playerEntries = [
			['Area', stats.area?.toFixed?.(2) ?? String(stats.area)],
			['Damage', stats.damage?.toFixed?.(2) ?? String(stats.damage)],
			['Projectiles', stats.projectiles?.toFixed?.(2) ?? String(stats.projectiles)],
			['Atk Speed', stats.attackSpeed?.toFixed?.(2) ?? String(stats.attackSpeed)],
			['Pickup', stats.pickup?.toFixed?.(2) ?? String(stats.pickup)],
			['XP', stats.xp?.toFixed?.(2) ?? String(stats.xp)],
		];
		const cur = playerState.getXpCurrent?.() ?? 0;
		const need = playerState.getXpNeeded?.() ?? 0;
		if (this.scene && this.scene.scale) {
			const basePickup = window?.gameConfig?.xpPickup?.baseRadius || 60;
			const baseAura = window?.gameConfig?.aura?.radius || 100;
			const pickupR = Math.floor(basePickup * (stats.pickup || 1) * (stats.area || 1));
			const auraR = Math.floor(baseAura * (stats.area || 1));
			playerEntries.push(['Pickup R', String(pickupR)]);
			playerEntries.push(['Aura R', String(auraR)]);
		}

		// Groups: player first, then weapons with headers
		const groups = [{ name: 'Player', entries: playerEntries }];
		try {
			const play = this.scene.scene.get('PlayScene');
			const weapons = play?.weaponManager?.weapons || [];
			for (const w of weapons) {
				const id = w?.getId?.() || 'weapon';
				const rp = w?.getRuntimeParams?.(playerState) || {};
				if (id === 'aura') {
					groups.push({
						name: 'Aura',
						entries: [
							['Aura tick', `${rp.tickIntervalMs ?? w.tickIntervalMs}ms`],
							['Aura dmg', `${rp.damagePerTick ?? w.damagePerTick}`],
							['Aura rad', `${rp.radius ?? w.radius}`],
						],
					});
				} else if (id === 'fireball') {
					groups.push({
						name: 'Fireball',
						entries: [
							['Fire cd', `${rp.cooldownMs ?? w.cooldownMs}ms`],
							['Fire dmg', `${rp.damage ?? w.baseDamage}`],
							['Fire proj', `${rp.projectiles ?? 1}`],
							['Fire rng', `${rp.range ?? w.range}`],
							['Fire spd', `${Math.round(rp.projectileSpeed ?? w.projectileSpeed)}`],
							['Fire rad', `${rp.radius ?? w.radius}`],
						],
					});
				}
			}
		} catch (_) {}

		// Render: XP Prog first, then groups
		this.title.setPosition(this.margin, this.margin);
		let y = this.margin + 20;
		// XP Prog
		{
			const labelText = this.scene.add.text(this.margin, y, 'XP Prog:', { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(0, 0);
			const valueText = this.scene.add.text(this.width - this.margin, y, `${cur}/${need}`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(1, 0);
			this.container.add(labelText);
			this.container.add(valueText);
			this.labels.push(labelText);
			this.values.push(valueText);
			y += this.lineH;
			// small spacing before sections
			y += Math.floor(this.lineH * 0.2);
		}

		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi];
			// Section header for each group
			const header = this.scene.add.text(this.margin, y, group.name, { fontFamily: 'monospace', fontSize: '12px', color: '#b0bec5' }).setOrigin(0, 0);
			this.container.add(header);
			this.labels.push(header);
			y += Math.floor(this.lineH * 0.8);
			for (let i = 0; i < group.entries.length; i++) {
				const [k, v] = group.entries[i];
				const labelText = this.scene.add.text(this.margin, y, `${k}:`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(0, 0);
				const valueText = this.scene.add.text(this.width - this.margin, y, `${v}`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(1, 0);
				this.container.add(labelText);
				this.container.add(valueText);
				this.labels.push(labelText);
				this.values.push(valueText);
				y += this.lineH;
			}
			if (gi < groups.length - 1) {
				// spacing between sections
				y += Math.floor(this.lineH * 0.4);
			}
		}

		const height = Math.ceil(y + this.margin);
		this.bg.clear();
		this.bg.fillStyle(0x151515, 0.7);
		this.bg.fillRoundedRect(0, 0, this.width, height, 8);
		this.bg.lineStyle(1, 0x444444, 1);
		this.bg.strokeRoundedRect(0, 0, this.width, height, 8);
	}

	destroy() {
		EventBus.off('stats:update', this.onStats);
		EventBus.off('xp:progress', this.onXp);
		this.scene.game?.events?.off('weapons:update', this.onWeapons);
		this.container?.destroy();
	}
}


