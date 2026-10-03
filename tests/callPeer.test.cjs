const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');

class Stream {
  constructor(tracks = []) { this.tracks = [...tracks]; }
  getTracks() { return this.tracks; }
  getAudioTracks() { return this.tracks.filter(t => t.kind === 'audio'); }
  getVideoTracks() { return this.tracks.filter(t => t.kind === 'video'); }
  addTrack(track) { this.tracks.push(track); }
}
const track = kind => ({ kind, stopped: false, stop() { this.stopped = true; } });
function runtime() {
  const sent = [], timers = [], connections = [];
  class Peer {
    signalingState = 'stable'; connectionState = 'new'; remoteDescription = null;
    candidates = []; senders = []; closed = false; restarts = 0;
    constructor() { connections.push(this); }
    addTrack(track) { const sender = { track, replaceTrack: async next => { sender.track = next; } }; this.senders.push(sender); return sender; }
    addTransceiver() { return { sender: this.addTrack(null) }; }
    async createOffer() { return { type: 'offer', sdp: 'offer-sdp' }; }
    async createAnswer() { return { type: 'answer', sdp: 'answer-sdp' }; }
    async setLocalDescription(d) { this.signalingState = d.type === 'offer' ? 'have-local-offer' : 'stable'; }
    async setRemoteDescription(d) { this.remoteDescription = d; this.signalingState = d.type === 'offer' ? 'have-remote-offer' : 'stable'; }
    async addIceCandidate(candidate) { assert.ok(this.remoteDescription, 'ICE applied before remote description'); this.candidates.push(candidate); }
    restartIce() { this.restarts++; }
    setConfiguration(config) { this.config = config; }
    close() { this.closed = true; }
  }
  const api = { get: async () => ({ data: { ice_servers: [{ urls: 'turn:example.test' }], expires_at: new Date(Date.now() + 3600_000).toISOString() } }) };
  const socket = { callSessionId: 'session', sendCall: (type, payload) => { sent.push({ type, payload }); return true; } };
  const exports = {};
  const navigator = { mediaDevices: { getUserMedia: async () => new Stream([track('audio')]) } };
  const context = {
    exports, require: name => name === './chatService' ? { chatApi: api } : { __esModule: true, default: socket },
    RTCPeerConnection: Peer, MediaStream: Stream, crypto, navigator, Date,
    setTimeout: (fn, delay) => { const timer = { fn, delay, cleared: false }; timers.push(timer); return timer; },
    clearTimeout: timer => { if (timer) timer.cleared = true; },
  };
  const source = ts.transpileModule(fs.readFileSync('src/services/callService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, context);
  return { ...exports, sent, timers, connections, navigator };
}
function create(r, caller) { return new r.CallPeer({ id: 'call', type: 'video' }, new Stream([track('audio')]), { ice_servers: [], expires_at: new Date(Date.now() + 3600_000).toISOString() }, { remote() {}, connection() {} }, caller); }

test('callee queues ICE until offer and answers using the same negotiation', async () => {
  const r = runtime(), peer = create(r, false);
  await peer.ice({ candidate: 'early' }, 'offer-id');
  assert.equal(r.connections[0].candidates.length, 0);
  await peer.signal('offer', 'remote-offer', 'offer-id');
  assert.equal(r.connections[0].candidates.length, 1);
  assert.equal(r.sent[0].payload.signal, 'answer');
  assert.equal(r.sent[0].payload.negotiation_id, 'offer-id');
  peer.close();
});
test('caller ignores stale answer and can restart a negotiation', async () => {
  const r = runtime(), peer = create(r, true); await peer.offer();
  const first = r.sent[0].payload.negotiation_id;
  await peer.signal('answer', 'stale', 'old'); assert.equal(r.connections[0].remoteDescription, null);
  await peer.signal('answer', 'answer', first); await peer.restart();
  assert.equal(r.connections[0].restarts, 1);
  assert.notEqual(r.sent[1].payload.negotiation_id, first); peer.close();
});
test('video transceiver supports enabling a camera after audio-only acceptance', async () => {
  const r = runtime(), peer = create(r, false), video = track('video');
  await peer.replace('video', video); assert.equal(r.connections[0].senders[1].track, video);
  peer.close(); const late = track('video'); await peer.replace('video', late); assert.ok(late.stopped);
});
test('closing prevents queued signaling and cancels credential renewal', async () => {
  const r = runtime(), peer = create(r, true); const pending = peer.offer(); peer.close(); await pending;
  assert.equal(r.sent.length, 0); assert.ok(r.connections[0].closed); assert.ok(r.timers[0].cleared);
});
test('credential refresh updates ICE servers and caller restarts', async () => {
  const r = runtime(), peer = create(r, true); assert.ok(r.timers[0].delay > 44 * 60_000);
  r.timers[0].fn(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(r.connections[0].config.iceServers[0].urls, 'turn:example.test');
  assert.equal(r.connections[0].restarts, 1); peer.close();
});
test('cancel while microphone permission is pending stops the returned track', async () => {
  const r = runtime(), audio = track('audio'); let complete, current = true;
  r.navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { complete = resolve; });
  const pending = r.captureCallMedia(false, { current: () => current, audioReady() {}, cameraUnavailable: async () => false });
  current = false; complete(new Stream([audio])); assert.equal(await pending, null); assert.ok(audio.stopped);
});
test('camera denial requires explicit continuation and keeps microphone', async () => {
  const r = runtime(), audio = track('audio'); let prompts = 0;
  r.navigator.mediaDevices.getUserMedia = async options => { if (options.video) throw Error('denied'); return new Stream([audio]); };
  const stream = await r.captureCallMedia(true, { current: () => true, audioReady() {}, cameraUnavailable: async () => { prompts++; return true; } });
  assert.equal(prompts, 1); assert.equal(stream.getAudioTracks()[0], audio); assert.equal(stream.getVideoTracks().length, 0);
});
test('cancel while camera permission is pending stops both captured tracks', async () => {
  const r = runtime(), audio = track('audio'), video = track('video'); let complete, current = true;
  r.navigator.mediaDevices.getUserMedia = options => options.video ? new Promise(resolve => { complete = resolve; }) : Promise.resolve(new Stream([audio]));
  const pending = r.captureCallMedia(true, { current: () => current, audioReady() {}, cameraUnavailable: async () => true });
  await new Promise(resolve => setImmediate(resolve)); current = false; complete(new Stream([video]));
  assert.equal(await pending, null); assert.ok(audio.stopped); assert.ok(video.stopped);
});
