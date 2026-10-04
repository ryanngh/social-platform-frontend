const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/readVisibility.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject,window:{innerWidth:1200,innerHeight:800}});
const node=(options={})=>({getBoundingClientRect:()=>({top:100,bottom:600,left:100,right:500}),getClientRects:()=>[{}],scrollHeight:1000,scrollTop:500,clientHeight:500,...options});
test('focused and visible chat at the newest message can mark read',()=>assert.equal(exportsObject.canReadVisibleConversation(node(),true,true),true));
test('background, minimized and offscreen chats cannot mark read',()=>{
 assert.equal(exportsObject.canReadVisibleConversation(node(),false,true),false);
 assert.equal(exportsObject.canReadVisibleConversation(node(),true,false),false);
 assert.equal(exportsObject.canReadVisibleConversation(node({getClientRects:()=>[]}),true,true),false);
 assert.equal(exportsObject.canReadVisibleConversation(node({getBoundingClientRect:()=>({top:900,bottom:1400,left:0,right:500})}),true,true),false);
});
test('reading older messages cannot acknowledge newly arrived messages',()=>assert.equal(exportsObject.canReadVisibleConversation(node({scrollTop:100}),true,true),false));

test('a partially visible chat cannot acknowledge messages below the viewport',()=>assert.equal(exportsObject.canReadVisibleConversation(node({getBoundingClientRect:()=>({top:600,bottom:1100,left:100,right:500})}),true,true),false));
