import { EventBus } from '../../state/EventBus.js';
import { playerState } from '../../state/PlayerState.js';
import { TomeCatalog } from '../../items/tomes/Tomes.js';

export class StatsPanel {
	constructor(scene) {
		this.scene = scene;
		this.container = scene.add.container(0, 0);
		this.bg = scene.add.graphics();
		this.container.add(this.bg);
		this.labels = [];
		this.values = [];
		this.margin = 10;
		this.width = scene.scale.gameSize.width;
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
		// Start hidden off-screen for slide-in
		this.container.setY(-this.container.height - 20);
		this.container.setVisible(false);
	}

	setPosition(x, y) {
		this.container.setPosition(x, y);
	}

  setVisible(visible) {
    this.container.setVisible(!!visible);
  }

	slideIn() {
		this.container.setVisible(true);
		// compute latest layout height before animating
		const prevY = this.container.y;
		this.container.y = 0; // temp to draw
		this._draw(playerState.getStats());
		const h = this.bg?.geom?.height || this.container.getBounds().height || 160;
		this.container.y = -h - 20;
		this.scene.tweens.add({ targets: this.container, y: 0, duration: 220, ease: 'sine.out' });
	}

	slideOut() {
		const h = this.bg?.geom?.height || this.container.getBounds().height || 160;
		this.scene.tweens.add({ targets: this.container, y: -h - 20, duration: 180, ease: 'sine.in', onComplete: () => this.container.setVisible(false) });
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
		}

		// Groups: player first, then each owned tome, then weapons
		const groups = [{ name: 'Player', entries: playerEntries }];
		try {
            const tomeState = playerState.getTomeState?.() || {};
            const ownedTomeIds = Object.keys(tomeState).filter(id => (tomeState[id]?.level || 0) > 0);
            ownedTomeIds.forEach((tid) => {
                const t = TomeCatalog.find(x => x.id === tid);
                if (!t) return;
                const level = tomeState[tid]?.level || 0;
                const rolls = tomeState[tid]?.rolls || [];
                const mods = t.getModifiers?.({ tomeLevel: level, rolls }) || [];
                const entries = [ ['Level', String(level)] ];
				for (const m of mods) {
					if (!m || !m.stat) continue;
					const statName = String(m.stat);
					const type = m.type || 'mult';
					const val = Number(m.value) || 0;
					if (type === 'mult') entries.push([`${statName} mult`, `x${val.toFixed(2)}`]);
					else if (type === 'add') entries.push([`${statName} add`, `+${val}`]);
					else if (type === 'set') entries.push([`${statName} set`, `=${val}`]);
				}
				groups.push({ name: t.name, entries });
			});
		} catch (_) {}
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
							['Aura cd', `${rp.cooldownMs ?? w.cooldownMs}ms`],
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
				} else if (id === 'slam') {
					groups.push({
						name: 'Slam',
						entries: [
							['Slam cd', `${rp.cooldownMs ?? w.cooldownMs}ms`],
							['Slam dmg', `${rp.damage ?? w.baseDamage}`],
							['Slam maxR', `${rp.maxRadius ?? w.maxRadius}`],
							['Slam grow', `${Math.round(rp.growthSpeed ?? w.growthSpeed)}/s`],
						],
					});
				} else if (id === 'chainLightning') {
					groups.push({
						name: 'Chain Lightning',
						entries: [
							['CL cd', `${rp.cooldownMs ?? w.cooldownMs}ms`],
							['CL dmg', `${rp.damage ?? w.baseDamage}`],
							['CL jumps', `${rp.maxJumps ?? w.maxJumps}`],
							['CL range', `${rp.range ?? w.range}`],
							['CL chainR', `${rp.chainRange ?? w.chainRange}`],
						],
					});
				} else if (id === 'boomerang') {
					groups.push({
						name: 'Boomerang',
						entries: [
							['Boom cd', `${rp.cooldownMs ?? w.cooldownMs}ms`],
							['Boom dmg', `${rp.damage ?? w.baseDamage}`],
							['Boom count', `${rp.projectiles ?? 1}`],
							['Boom rng', `${rp.range ?? w.range}`],
							['Boom spd', `${Math.round(rp.projectileSpeed ?? w.projectileSpeed)}`],
							['Boom rad', `${rp.radius ?? w.radius}`],
						],
					});
				} else if (id === 'blades') {
					groups.push({
						name: 'Blades',
						entries: [
							['Blade rot', `${Math.round(rp.rotationSpeed ?? w.rotationSpeed)}`],
							['Blade dmg', `${rp.damage ?? w.baseDamage}`],
							['Blade cnt', `${rp.bladeCount ?? 1}`],
							['Blade rad', `${rp.radius ?? w.orbitRadius}`],
						],
					});
				}
			}
		} catch (_) {}

		// Build columns: Player, Weapons, Tomes
		let weaponEntries = [];
		let tomeEntries = [];
		for (let gi = 1; gi < groups.length; gi++) {
			const g = groups[gi];
			if (g.name === 'Aura' || g.name === 'Fireball' || g.name === 'Slam' || g.name === 'Chain Lightning' || g.name === 'Boomerang' || g.name === 'Blades') {
				weaponEntries.push([`— ${g.name} —`, '']);
				for (const e of g.entries) weaponEntries.push(e);
			} else if (g.name !== 'Player') {
				// tomes: strip leading "Tome of " from display name
				const nameClean = String(g.name).replace(/^Tome\s+of\s+/i, '');
				tomeEntries.push([`— ${nameClean} —`, '']);
				for (const e of g.entries) tomeEntries.push(e);
			}
		}

		const w = this.scene.scale.gameSize.width;
		this.width = w;
		const margin = this.margin;
		const colGap = 24;
		const colW = Math.floor((w - margin * 2 - colGap * 2) / 3);
		const colXs = [margin, margin + colW + colGap, margin + (colW + colGap) * 2];
		const columns = [playerEntries, weaponEntries, tomeEntries];

		this.title.setPosition(margin, margin);
		const headerH = 38; // leave room for title above column headers
		const startY = margin + headerH;
		let panelHeight = startY;
		for (let ci = 0; ci < columns.length; ci++) {
			let y = startY;
			const list = columns[ci];
			const headerName = ci === 0 ? 'Player' : (ci === 1 ? 'Weapons' : 'Tomes');
			const hdr = this.scene.add.text(colXs[ci], margin + 18, headerName, { fontFamily: 'monospace', fontSize: '12px', color: '#b0bec5' }).setOrigin(0, 0);
			this.container.add(hdr);
			this.labels.push(hdr);
			for (let i = 0; i < list.length; i++) {
				const [k, v] = list[i];
				const labelText = this.scene.add.text(colXs[ci], y, `${k}:`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(0, 0);
				const valueText = this.scene.add.text(colXs[ci] + colW, y, `${v}`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' }).setOrigin(1, 0);
				this.container.add(labelText);
				this.container.add(valueText);
				this.labels.push(labelText);
				this.values.push(valueText);
				y += this.lineH;
			}
			panelHeight = Math.max(panelHeight, y);
		}

		const height = Math.ceil(panelHeight + margin);
		this.bg.clear();
		this.bg.fillStyle(0x151515, 0.82);
		this.bg.fillRect(0, 0, this.width, height);
		this.bg.lineStyle(1, 0x444444, 1);
		this.bg.strokeRect(0, 0, this.width, height);
	}

	destroy() {
		EventBus.off('stats:update', this.onStats);
		EventBus.off('xp:progress', this.onXp);
		this.scene.game?.events?.off('weapons:update', this.onWeapons);
		this.container?.destroy();
	}
}


