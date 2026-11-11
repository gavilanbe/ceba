// bot de prueba contra Cavador (se pega dentro de la página)
window.fight = (max) => { const { G, input, player: p } = game; let n = 0; const log = [];
  while (n < max && G.boss) { const b = G.boss, dx = b.pos.x - p.pos.x, dz = b.pos.z - p.pos.z, d = Math.hypot(dx, dz) || 1;
    const go = (x, z) => { const cy = game.cam.yaw, ax = Math.cos(cy) * x - Math.sin(cy) * z, ay = Math.sin(cy) * x + Math.cos(cy) * z; input.down.right = ax > 0.3; input.down.left = ax < -0.3; input.down.down = ay > 0.3; input.down.up = ay < -0.3; };
    input.down.right = input.down.left = input.down.up = input.down.down = false;
    if (G.lock > 0) { if (n % 14 === 0) input.key('Space', true); if (n % 14 === 2) input.key('Space', false); }
    else if (b.st === 'daze') { if (d > 3.2) go(dx / d, dz / d); if (d < 4.2 && n % 9 === 0) input.pressed.b = true; }
    else if (b.up) { if (d < 6.5) go(-dx / d, -dz / d); else if (p.state === 'free') { p.yaw = Math.atan2(dx, dz); if (n % 18 === 0) input.pressed.c3 = true; } }
    else { const cx = -p.pos.x, cz = -57 - p.pos.z, cd = Math.hypot(cx, cz) || 1; go(-dz / d * 0.8 + cx / cd * 0.6, dx / d * 0.8 + cz / cd * 0.6); }
    game.step(1); n++; if (n % 300 === 0) log.push([b.st, b.hp, p.layers]); }
  input.down.right = input.down.left = input.down.up = input.down.down = false; return [n, log]; };
