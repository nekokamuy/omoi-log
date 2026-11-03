import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordStatusGroup,changeRecordStatus,statusBeforeCompletion} from '../dist/core.js';
test('排序分區：進行中、已完成、已取消',()=>{const records=[{status:'已取消'},{status:'已完成'},{status:'已約定'},{status:'待確認'}];const sorted=records.toSorted((a,b)=>recordStatusGroup(a)-recordStatusGroup(b));assert.deepEqual(sorted.map(r=>r.status),['已約定','待確認','已完成','已取消'])});
test('已取消可恢復待確認或已約定，並回到進行中區塊',()=>{for(const status of ['待確認','已約定']){const original={status:'已取消',notes:'保留備註',images:['圖片']};const restored=changeRecordStatus(original,status);assert.equal(restored.status,status);assert.equal(recordStatusGroup(restored),0);assert.equal(restored.notes,original.notes);assert.deepEqual(restored.images,original.images);assert.equal(original.status,'已取消')}});
test('已取消改成完成後也可還原原本的已取消狀態',()=>{const done=changeRecordStatus({status:'已取消'},'已完成');assert.equal(statusBeforeCompletion(done),'已取消');assert.equal(changeRecordStatus(done,statusBeforeCompletion(done)).status,'已取消')});
