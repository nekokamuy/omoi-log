import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanAccount,displayAccount,recordNumber,notesMarkup,imagesMarkup} from '../dist/record-ui.js';
test('帳號相容原始輸入、舊資料與重複的全形前綴',()=>{assert.equal(cleanAccount('  ＠@@aoi.21  '),'aoi.21');assert.equal(displayAccount('@aoi.21'),'@aoi.21');assert.equal(displayAccount('aoi.21'),'@aoi.21');assert.equal(displayAccount('  '),'')});
test('編號依各場次的原始順序建立',()=>{const records=[{id:'a',eventId:'one'},{id:'b',eventId:'two'},{id:'c',eventId:'one'}];assert.equal(recordNumber(records[2],records),'02');assert.equal(recordNumber(records[1],records),'01')});
test('備註依 Unicode 字元截斷至 80 字，保留完整且安全的展開內容',()=>{assert.equal(notesMarkup('  '),'');assert.ok(!notesMarkup('短備註').includes('<details'));const long='🎵'.repeat(81)+'<script>';const html=notesMarkup(long);assert.ok(html.includes('🎵'.repeat(80)+'...</span>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'))});
test('圖片以原生開合區塊顯示，不建立彈跳視窗',()=>{assert.equal(imagesMarkup([]),'');const html=imagesMarkup(['data:image/png;base64,aA==']);assert.ok(html.startsWith('<details'));assert.ok(html.includes('1張圖片，'));assert.ok(html.includes('點選展開'));assert.ok(!html.includes('<dialog'));assert.ok(!html.includes('截圖'))});
