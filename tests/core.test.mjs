import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matches,parseCSV,duplicate,validBackup} from '../dist/core.js';
test('搜尋跨欄位、不分大小寫、忽略 @/# 並交集查找',()=>{const r={name:'小葵',account:'@Aoi_21',tags:'小卡 現場',type:'對方來領取',notes:'北門'};assert.ok(matches(r,'aOI #小卡 領取'));assert.ok(matches(r,'小葵 北門'));assert.ok(!matches(r,'小葵 明信片'))});
test('CSV 支援 BOM、逗號、換行及跳脫引號',()=>{assert.deepEqual(parseCSV('\uFEFF暱稱,備註\r\n小葵,"第一行,\n第二行"\r\nMika,"她說""你好"""\r\n'),[['暱稱','備註'],['小葵','第一行,\n第二行'],['Mika','她說"你好"']]);assert.throws(()=>parseCSV('a,b\nx,"oops'))});
test('重複依帳號、平台與類型判斷，沒有帳號才使用暱稱',()=>{assert.ok(duplicate({account:'@AOI',platform:'Instagram',type:'互相交換'},{account:'aoi',platform:'Instagram',type:'互相交換'}));assert.ok(!duplicate({account:'@AOI',platform:'Instagram',type:'互相交換'},{account:'aoi',platform:'Threads',type:'互相交換'}))});
test('還原拒絕失去所屬場次、重複 ID 與不安全圖片',()=>{const d={version:1,events:[{id:'e',name:'台北'}],records:[{id:'r',eventId:'e',name:'小葵',type:'互相交換',status:'待確認',images:[]}]};assert.ok(validBackup(d));assert.ok(!validBackup({...d,events:[]}));assert.ok(!validBackup({...d,records:[...d.records,...d.records]}));assert.ok(!validBackup({...d,records:[{...d.records[0],images:['https://example.com/image.png']}]}))});
