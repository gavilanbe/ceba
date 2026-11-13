// registro de modelos para el taller
import { makeCeba } from './hero.js';
import * as P from './props.js';
import * as F from './folk.js';
import * as Q from './pulpa.js';
const pose = c => { c.handL.position.set(-0.6, 0.4, 0.1); c.handR.position.set(0.6, 0.4, 0.1); c.footL.position.set(-0.2, 0, 0); c.footR.position.set(0.2, 0, 0); return c; };
export const MODELS = {
  ceba: () => { const c = makeCeba(); c.setHoja(true); return pose(c); },
  ceba0: () => pose(makeCeba()),
  ceba2: () => { const c = makeCeba(); c.setHoja(true); c.setLayers(2); return pose(c); },
  ceba1: () => { const c = makeCeba(); c.setHoja(true); c.setLayers(1); return pose(c); },
  casa: () => P.makeHouse(), pozo: () => P.makeWell(), cofre: () => { const c = P.makeChest(); c.lid.rotation.x = -0.9; return c; }, cofreG: () => P.makeChest({ big: true }),
  tinaja: () => P.makePot(), cartel: () => P.makeSign(), estatua: () => P.makeStatue(), cebollino: () => P.makeChive(true),
  lagrima: () => P.makeTear(), anillo: () => P.makeRing(), farol: () => P.makeLantern(), bandera: () => P.makeFlag(),
  mondador: () => P.makeMondador(), llave: () => P.makeKey(), capa: () => P.makeCapa(),
  ajo: () => F.makeAjo(), puerro: () => F.makePuerro(), chalota: () => F.makeChalota(), cebolleta: () => F.makeCebolleta(),
  candela: () => F.makeCandela(), bicho: () => F.makeBicho(), pulgon: () => F.makePulgon(), babosa: () => F.makeBabosa(),
  trips: () => F.makeTrips(), tapona: () => F.makeTapona(),
  lombriz: () => Q.makeLombriz({ hat: true }), lombriz2: () => Q.makeLombriz({ scarf: true, s: 0.7, swap: [14, 15] }), caracol: () => Q.makeCaracol(), mohin: () => Q.makeMohin(1), gorgojo: () => Q.makeGorgojo(),
  cavador: () => Q.makeCavador(), ajobomba: () => Q.makeAjoBomba(), cerbatana: () => Q.makeCerbatana(), pepita: () => Q.makePepita(), llaveraiz: () => Q.makeLlaveRaiz(), zarcillo: () => Q.makeZarcillo(), gancho: () => Q.makeGancho(),
  yema: () => Q.makeYema(), yema2: () => { const y = Q.makeYema(); y.bud.visible = false; y.flower.visible = true; return y; }, mildiu: () => Q.makeMildiu(), raizcol: () => Q.makeRootColumn(6, 0.6), setaluz: () => Q.makeLightShroom(1.4), seta: () => Q.makeSeta(1),
};
