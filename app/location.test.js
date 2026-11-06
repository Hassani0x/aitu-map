import test from 'node:test';
import assert from 'node:assert/strict';
import {align,project,usable} from './location.js';
const a={fix:{latitude:51,longitude:71,accuracy:3,timestamp:Date.now()},point:[150,200]};
const b={fix:{latitude:51,longitude:71.002,accuracy:3,timestamp:Date.now()},point:[650,200]};
test('alignment maps both known coordinates and their midpoint',()=>{const m=align(a,b);assert.deepEqual(project(a.fix,m),a.point);assert.ok(Math.abs(project(b.fix,m)[0]-650)<.0001);assert.ok(Math.abs(project({...a.fix,longitude:71.001},m)[0]-400)<.0001)});
test('unreliable, stale, unaligned and outside positions cannot drive navigation',()=>{const m=align(a,b);assert.equal(usable(a.fix,m),null);assert.match(usable({...a.fix,accuracy:50},m),/imprecise/);assert.match(usable({...a.fix,timestamp:0},m),/stale/);assert.match(usable(a.fix,null),/Align/);assert.match(usable({...a.fix,longitude:72},m),/outside/)});
test('rejects weak or short-baseline calibration',()=>{assert.throws(()=>align({...a,fix:{...a.fix,accuracy:20}},b));assert.throws(()=>align(a,{...b,fix:{...a.fix,longitude:71.00001}}));});
