import {test} from 'node:test';
import assert from 'node:assert/strict';
import {concertCountdown} from '../dist/core.js';
test('依當地日曆計算天數，深夜到明天仍為一天',()=>{assert.deepEqual(concertCountdown('2026-11-21',new Date(2026,10,3,12)),{days:18,text:'距離演唱會剩 18 天'});assert.equal(concertCountdown('2026-11-04',new Date(2026,10,3,23,59)).days,1)});
test('當天顯示就是今天，過期與未填日期不顯示',()=>{assert.deepEqual(concertCountdown('2026-11-03',new Date(2026,10,3,23,59)),{days:0,text:'就是今天!'});assert.equal(concertCountdown('2026-11-02',new Date(2026,10,3)),null);assert.equal(concertCountdown('',new Date(2026,10,3)),null);assert.equal(concertCountdown(undefined),null)});
test('跨年與閏日計算正確，不接受不存在的日期',()=>{assert.equal(concertCountdown('2027-01-01',new Date(2026,11,31)).days,1);assert.equal(concertCountdown('2028-03-01',new Date(2028,1,28)).days,2);assert.equal(concertCountdown('2026-02-30',new Date(2026,1,1)),null);assert.equal(concertCountdown('bad-date'),null)});
