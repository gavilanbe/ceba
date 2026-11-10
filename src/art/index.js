// registro de modelos para el taller
import { makeCeba } from './hero.js';
export const MODELS = {
  ceba: () => { const c = makeCeba(); c.setHoja(true); c.handL.position.set(-0.6, 0.4, 0.1); c.handR.position.set(0.6, 0.4, 0.1); c.footL.position.set(-0.2, 0, 0); c.footR.position.set(0.2, 0, 0); return c; },
  ceba0: () => { const c = makeCeba(); c.handL.position.set(-0.6, 0.4, 0.1); c.handR.position.set(0.6, 0.4, 0.1); c.footL.position.set(-0.2, 0, 0); c.footR.position.set(0.2, 0, 0); return c; },
};
