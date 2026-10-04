const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function runtime(devices) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/callDevices.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,navigator:{mediaDevices:devices},DOMException,Error});
 return exports;
}
function track(kind,id) { return {kind,enabled:true,readyState:'live',stopped:false,getSettings:()=>({deviceId:id}),stop(){this.stopped=true;this.readyState='ended';}}; }
function stream(...tracks) { return {tracks,getTracks(){return [...this.tracks]},removeTrack(t){this.tracks=this.tracks.filter(x=>x!==t)},addTrack(t){this.tracks.push(t)}}; }

test('default speaker does not invoke restricted output API on Safari/page load',async()=>{
 let calls=0;const r=runtime({selectAudioOutput:async()=>{throw Error('must not request permission')}});
 assert.equal(await r.switchCallOutput({sinkId:'',setSinkId:async()=>{calls++}},'default',()=>true),'');assert.equal(calls,0);
});
test('speaker permission uses the authorized device ID before committing output',async()=>{
 const order=[];const r=runtime({selectAudioOutput:async options=>{order.push('grant:'+options.deviceId);return {deviceId:'authorized-id'}}});
 const selected=await r.switchCallOutput({sinkId:'',setSinkId:async id=>order.push('sink:'+id)},'old-id',()=>true);
 assert.equal(selected,'authorized-id');assert.deepEqual(order,['grant:old-id','sink:authorized-id']);
});
test('speaker permission denial preserves previous sink and produces a specific error',async()=>{
 let switches=0;const r=runtime({selectAudioOutput:async()=>{throw new DOMException('denied','NotAllowedError')}});
 await assert.rejects(r.switchCallOutput({sinkId:'old',setSinkId:async()=>switches++},'new',()=>true),error=>r.callDeviceErrorKey(error)==='calls.devicePermissionError');assert.equal(switches,0);
});
test('cancel during speaker permission does not change the output',async()=>{
 let active=true,switches=0;const r=runtime({selectAudioOutput:async()=>{active=false;return {deviceId:'new'}}});
 assert.equal(await r.switchCallOutput({sinkId:'old',setSinkId:async()=>switches++},'new',()=>active),null);assert.equal(switches,0);
});
test('unsupported Safari output API is reported without affecting microphone',async()=>{
 const r=runtime({});await assert.rejects(r.switchCallOutput({sinkId:''},'new',()=>true),error=>r.callDeviceErrorKey(error)==='calls.deviceUnsupportedError');
});
test('failed sender replacement retains old microphone and stops replacement',async()=>{
 const old=track('audio','old'),next=track('audio','new'),local=stream(old);const r=runtime({getUserMedia:async()=>stream(next)});
 await assert.rejects(r.switchCallInput('audio','new',{stream:local,current:()=>true,enabled:()=>true,replace:async()=>{throw new DOMException('format','InvalidModificationError')}}));
 assert.equal(old.stopped,false);assert.equal(next.stopped,true);assert.equal(local.getTracks()[0],old);
});
test('successful input switch uses bounded video constraints and preserves mute/camera state',async()=>{
 const old=track('video','old'),next=track('video','new'),local=stream(old);let constraints;const r=runtime({getUserMedia:async c=>{constraints=c;return stream(next)}});
 const selected=await r.switchCallInput('video','new',{stream:local,current:()=>true,enabled:()=>false,replace:async(kind,t)=>{assert.equal(kind,'video');assert.equal(t,next);assert.equal(old.stopped,false)}});
 assert.equal(selected,next);assert.equal(old.stopped,true);assert.equal(next.enabled,false);assert.equal(constraints.video.width.max,1280);assert.equal(constraints.video.frameRate.max,30);
});
test('cancel while acquiring input stops the new track without replacing the active one',async()=>{
 const old=track('audio','old'),next=track('audio','new'),local=stream(old);let active=true,replaced=false;const r=runtime({getUserMedia:async()=>{active=false;return stream(next)}});
 assert.equal(await r.switchCallInput('audio','new',{stream:local,current:()=>active,enabled:()=>true,replace:async()=>{replaced=true}}),null);assert.equal(replaced,false);assert.equal(old.stopped,false);assert.equal(next.stopped,true);
});
test('choosing an already active camera does not reacquire exclusive hardware',async()=>{
 const old=track('video','same'),local=stream(old);const r=runtime({getUserMedia:async()=>{throw Error('must not reacquire')}});
 assert.equal(await r.switchCallInput('video','same',{stream:local,current:()=>true,enabled:()=>true,replace:async()=>{throw Error('must not replace')}}),old);
});
test('insecure LAN origin produces a device support error without crashing',async()=>{
 const r=runtime(undefined);await assert.rejects(r.switchCallInput('audio','',{stream:stream(),current:()=>true,enabled:()=>true,replace:()=>undefined}),error=>r.callDeviceErrorKey(error)==='calls.deviceUnsupportedError');
});
