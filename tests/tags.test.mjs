import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitTags,availableTags,mergeTags,tagPickerMarkup} from '../dist/record-ui.js';
test('現有標籤去除井號與重複，包含其他場次及目前紀錄',()=>{assert.deepEqual(splitTags('#小卡 ＃貼紙,小卡，現場'),['小卡','貼紙','現場']);const tags=availableTags([{tags:'小卡 #貼紙'},{tags:'貼紙 現場'}],'舊標籤');assert.equal(tags.length,4);assert.ok(tags.includes('舊標籤'))});
test('多選與自訂合併去重，取消選取不會回填舊標籤',()=>{assert.equal(mergeTags(['小卡','貼紙'],'#小卡 ＃票卡'),'小卡 貼紙 票卡');assert.equal(mergeTags([],''),'');assert.equal(mergeTags(['貼紙'],''),'貼紙')});
test('編輯預選已有標籤；沒有可選標籤時直接提供自訂欄位',()=>{const html=tagPickerMarkup([{tags:'小卡 貼紙'}],'小卡');assert.match(html,/value="小卡" checked/);assert.match(html,/value="貼紙" >/);assert.ok(html.includes('name="customTags"'));assert.ok(tagPickerMarkup([]).includes('目前沒有可選的標籤'));assert.ok(!tagPickerMarkup([{tags:'<img>'}]).includes('value="<img>"'))});
