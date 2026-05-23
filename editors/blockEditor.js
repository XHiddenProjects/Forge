/**
 * BlockEditorPatch.js
 * ═══════════════════════════════════════════════════════
 * Drop-in enhancement for FORGE GameEditor.js.
 *
 * What this patch adds:
 *  1. Plain-English labels & "What does this do?" tooltips on every block
 *  2. Beginner hint banners inside the Block Editor canvas
 *  3. Param labels that show real names instead of cryptic keys (e.g. "Width (px)" not "w")
 *  4. A fully-featured Live Run Panel that shows execution step-by-step
 *     while in "Game Mode" — with animated progress, active-block highlight,
 *     an execution log written in plain English, and a mini game preview.
 *
 * Usage
 * ─────
 * Import this file AFTER GameEditor.js has been mounted:
 *
 *   import { GameEditor } from './GameEditor.js';
 *   import './BlockEditorPatch.js';   // ← add this
 *
 *   GameEditor.mount(document.body);
 *
 * The patch auto-applies itself once the DOM is ready and re-applies
 * every time the Block Editor tab becomes active.
 */

// ─── Block descriptions in plain English ──────────────────────────────────────
const BLOCK_DESCRIPTIONS = {
  // Events
  'On Key Press':     'Runs the connected blocks when a keyboard key is pressed.',
  'On Key Release':   'Runs the connected blocks when a keyboard key is let go.',
  'On Click':         'Runs the connected blocks when the mouse button is clicked.',
  'On Collision':     'Runs when two objects touch each other.',
  'On Timer':         'Runs on a repeating timer — like a clock tick.',
  'On Trigger Enter': 'Runs when an object enters a zone.',
  'On Trigger Exit':  'Runs when an object leaves a zone.',
  'Emit Event':       'Sends a custom signal that other blocks can listen for.',
  'On Event':         'Waits for a custom signal, then runs connected blocks.',
  // Physics
  'Apply Force':      'Pushes an object in a direction — like a wind gust.',
  'Apply Impulse':    'Gives an instant push — like a jump or explosion.',
  'Set Velocity':     'Sets how fast an object moves in X and Y directions.',
  'Stop Movement':    'Immediately stops an object from moving.',
  'Add Gravity':      'Adds gravitational pull to an object.',
  'Set Gravity':      'Changes the gravity strength for an object.',
  'Detect Collision': 'Checks if two specific objects are touching.',
  'Raycast':          'Shoots an invisible ray and checks what it hits.',
  'Enable Physics':   'Turns on realistic physics (gravity, collisions) for an object.',
  // Transform
  'Move To':          'Moves an object to an exact X/Y position instantly.',
  'Move By':          'Moves an object by a relative amount from where it is.',
  'Rotate':           'Spins an object by a number of degrees.',
  'Rotate To':        'Sets an object\'s rotation to an exact angle.',
  'Scale':            'Resizes an object by multiplying its size.',
  'Set Size':         'Sets an object\'s exact width and height.',
  'Flip':             'Mirrors an object horizontally, vertically, or both.',
  'Look At':          'Rotates one object so it faces another object.',
  'Lerp To':          'Smoothly slides an object towards a target position.',
  // Sprites
  'Load Sprite':      'Loads an image file and applies it to an object.',
  'Play Animation':   'Starts a sprite animation (e.g. "run", "idle").',
  'Stop Animation':   'Stops the current sprite animation.',
  'Set Frame':        'Jumps the sprite to a specific animation frame.',
  'Set Opacity':      'Changes how transparent an object is (0 = invisible, 1 = solid).',
  'Set Tint':         'Applies a color tint/overlay to a sprite.',
  'Set Visible':      'Shows or hides an object.',
  'Draw Sprite':      'Draws an image at a specific position on the canvas.',
  // Sound
  'Play Sound':       'Plays an audio file.',
  'Stop Sound':       'Stops a specific sound from playing.',
  'Stop All':         'Stops all sounds immediately.',
  'Set Volume':       'Changes the master volume (0 = silent, 1 = full).',
  'Fade In':          'Gradually increases a sound\'s volume from silence.',
  'Fade Out':         'Gradually lowers a sound\'s volume until silent.',
  // Logic
  'If / Else':        'Runs one path if a condition is true, another path if false.',
  'Compare':          'Compares two values (e.g. score > 10) and outputs the result.',
  'AND Gate':         'Output is true only when BOTH inputs are true.',
  'OR Gate':          'Output is true when EITHER input is true.',
  'NOT Gate':         'Flips true to false and false to true.',
  'Switch':           'Routes execution to different paths based on a value.',
  // Camera
  'Follow Target':    'Makes the camera smoothly follow an object.',
  'Shake':            'Shakes the camera — great for explosions or impacts.',
  'Set Zoom':         'Zooms the camera in or out.',
  'Move Camera':      'Moves the camera to a position.',
  'Reset Camera':     'Resets the camera to its starting position.',
  'Set Background':   'Changes the background/sky color.',
  // Flow
  'Sequence':         'Runs blocks one after another in order.',
  'Delay':            'Waits for a number of milliseconds before continuing.',
  'Loop':             'Repeats connected blocks a set number of times.',
  'While':            'Keeps repeating as long as a condition is true.',
  'Wait For':         'Waits a number of game frames before continuing.',
  'Run Script':       'Calls a custom JavaScript function by name.',
  'Stop Flow':        'Immediately stops the current execution chain.',
  // Canvas
  'Create Canvas':    'Creates a new drawing surface with a width and height.',
  'Clear':            'Wipes the canvas and fills it with a background color.',
  'Fill Rect':        'Draws a solid filled rectangle.',
  'Draw Text':        'Draws text at a position with a specific size and color.',
  'Draw Line':        'Draws a straight line between two points.',
  'Draw Circle':      'Draws a circle at a position.',
  // Particles
  'Emit Burst':       'Sprays a burst of particles in all directions.',
  'Start Emitter':    'Starts continuously emitting particles.',
  'Stop Emitter':     'Turns off the particle emitter.',
  'Set Gravity':      'Sets how quickly particles fall downward.',
  // Lights
  'Add Light':        'Creates a light source on an object.',
  'Remove Light':     'Removes the light source from an object.',
  'Set Intensity':    'Changes how bright a light is.',
  'Flicker':          'Makes a light flicker like a candle or faulty bulb.',
  // Text
  'Show Text':        'Draws text on screen at a position.',
  'Set Text':         'Updates the text displayed by a text object.',
  'Typewriter':       'Types out text one character at a time.',
  // Triggers
  'Create Trigger':   'Creates an invisible zone that detects when objects enter.',
  'Remove Trigger':   'Deletes an invisible trigger zone.',
  'Is Inside':        'Checks if an object is currently inside a zone.',
};

// ─── Friendly param label lookup ──────────────────────────────────────────────
const PARAM_LABELS = {
  k:       'Key',      key:      'Key',      ms:     'Duration (ms)', mag: 'Strength',
  x:       'X (pos)',  y:        'Y (pos)',  z:      'Depth (Z)',
  dx:      'Move X',  dy:       'Move Y',   deg:    'Degrees',
  w:       'Width',   h:        'Height',   d:      'Depth',
  r:       'Radius',  g:        'Gravity',  t:      'Blend (0–1)',
  src:     'File',    anim:     'Anim Name',frame:  'Frame #',
  val:     'Value',   vol:      'Volume',   loop:   'Loop?',
  color:   'Color',   text:     'Text',     size:   'Font Size',
  fn:      'Function Name',     event:  'Event Name',
  target:  'Object',  zone:     'Zone',     tag:    'Tag / Label',
  speed:   'Speed',   lag:      'Lag',      zoom:   'Zoom Level',
  ease:    'Ease?',   repeat:   'Repeat?',  n:      'Count',
  rate:    'Rate/sec',intensity: 'Brightness', radius: 'Radius',
  range:   'Range',   from:     'Start Color', to:   'End Color',
  alpha:   'Opacity', sides:    'Sides',    stroke: 'Border Color',
  width:   'Thickness', angle:  'Angle (°)', dist:  'Distance',
  fromX:   'From X',  fromY:    'From Y',   a:      'Value A',
  b:       'Value B', op:       'Operator', mass:   'Mass',
  bounciness: 'Bounciness', A:  'Case A',   B:      'Case B',
  C:       'Case C',  data:     'Data (JSON)', frames: 'Frames to Wait',
  x1: 'Start X', y1: 'Start Y', x2: 'End X', y2: 'End Y',
  x3d: '3D X', y3d: '3D Y', z3d: '3D Z',
};

// ─── Port friendly names ───────────────────────────────────────────────────────
const PORT_LABELS = {
  exec:  '▶ Run',  done:  '✓ Done',  then:  '→ Then',
  tick:  '⏱ Tick', enter: '⤵ Enter', exit:  '⤴ Exit',
  true:  '✓ True', false: '✗ False', hit:   '✦ Hit',
  miss:  '○ Miss', 'other': '↔ Other', end:  '⏹ End',
  body:  '↺ Body', result: '= Result', out:  '→ Out',
  a:     'A',      b:     'B',        cond:  '? Cond',
  value: '= Value', '1': '1st', '2': '2nd', '3': '3rd',
  yes:   '✓ Yes',  no:    '✗ No',
};

function friendlyPort(p) {
  return PORT_LABELS[p] || p;
}

function friendlyParam(k) {
  return PARAM_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
}

// ─── Plain-English execution explanations ─────────────────────────────────────
function explainExecution(block) {
  const p = {};
  (block.params || []).forEach(param => { p[param.k] = param.v; });

  const type = block.type;
  if (type === 'Move To')        return `Moving "${p.target || 'object'}" to position (${p.x}, ${p.y})`;
  if (type === 'Move By')        return `Shifting "${p.target || 'object'}" by (${p.dx}, ${p.dy})`;
  if (type === 'Rotate')         return `Rotating "${p.target || 'object'}" by ${p.deg}°`;
  if (type === 'Scale')          return `Scaling "${p.target || 'object'}" to (${p.x}x, ${p.y}x)`;
  if (type === 'Apply Force')    return `Pushing "${p.target || 'object'}" with force (${p.x}, ${p.y})`;
  if (type === 'Apply Impulse')  return `Launching "${p.target || 'object'}" with impulse (${p.x}, ${p.y})`;
  if (type === 'Set Velocity')   return `Setting speed of "${p.target || 'object'}" to (${p.x}, ${p.y})`;
  if (type === 'Stop Movement')  return `Stopping all movement on "${p.target || 'object'}"`;
  if (type === 'Play Sound')     return `Playing sound: "${p.src || 'audio file'}" at volume ${p.volume ?? 1}`;
  if (type === 'Stop Sound')     return `Stopping sound: "${p.src || 'audio file'}"`;
  if (type === 'Stop All')       return `Stopping ALL sounds`;
  if (type === 'Set Volume')     return `Setting master volume to ${Math.round((p.vol ?? 1) * 100)}%`;
  if (type === 'Follow Target')  return `Camera now following "${p.target || 'object'}" at speed ${p.speed}`;
  if (type === 'Shake')          return `Shaking camera — magnitude: ${p.mag}, duration: ${p.ms}ms`;
  if (type === 'Set Zoom')       return `Zooming camera to ${p.zoom}x`;
  if (type === 'Clear')          return `Clearing canvas to ${p.color || 'background color'}`;
  if (type === 'Fill Rect')      return `Drawing a ${p.color || 'colored'} rectangle at (${p.x}, ${p.y}) — ${p.w}×${p.h}px`;
  if (type === 'Draw Text')      return `Displaying "${p.text || 'text'}" at (${p.x}, ${p.y}) in size ${p.size}`;
  if (type === 'Draw Line')      return `Drawing a line from (${p.x1}, ${p.y1}) to (${p.x2}, ${p.y2})`;
  if (type === 'Draw Circle')    return `Drawing a ${p.color || 'colored'} circle at (${p.x}, ${p.y}), radius ${p.r}`;
  if (type === 'Delay')          return `Waiting ${p.ms}ms before continuing...`;
  if (type === 'Loop')           return `Repeating the next step ${p.n} times`;
  if (type === 'Load Sprite')    return `Loading sprite "${p.src}" onto "${p.target || 'object'}"`;
  if (type === 'Play Animation') return `Playing animation "${p.anim}" on "${p.target || 'object'}"`;
  if (type === 'Set Visible')    return `Making "${p.target || 'object'}" ${p.visible === 'false' ? 'invisible' : 'visible'}`;
  if (type === 'Set Opacity')    return `Setting opacity of "${p.target || 'object'}" to ${Math.round((p.val ?? 1) * 100)}%`;
  if (type === 'Emit Burst')     return `Emitting ${p.count} particles from "${p.target || 'emitter'}"`;
  if (type === 'Emit Event')     return `Sending event "${p.event}" to any listeners`;
  if (type === 'Show Text')      return `Showing "${p.text || 'text'}" at (${p.x}, ${p.y})`;
  if (type === 'Set Text')       return `Updating "${p.target || 'text object'}" to say "${p.text}"`;
  if (type === 'Add Light')      return `Adding a ${p.color || 'white'} light to "${p.target || 'object'}" at intensity ${p.intensity}`;
  if (type === 'Sequence')       return `Running outputs 1 → 2 → 3 in order`;
  if (type === 'If / Else')      return `Checking condition — routing to True or False branch`;
  if (type === 'Stop Flow')      return `Halting execution here`;
  return `Executing: ${type}`;
}

// ─── CSS injected once ────────────────────────────────────────────────────────
const PATCH_CSS = `
/* ── BeginnerPatch styles ── */
.bpatch-desc {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  font-size: 9.5px;
  color: #8b96b8;
  line-height: 1.4;
  padding: 4px 10px 6px;
  border-top: 1px solid rgba(255,255,255,.05);
  font-style: italic;
  max-width: 220px;
  word-break: break-word;
  pointer-events: none;
}
.be-block .be-block-body > .bpatch-desc,
.be-block.selected .be-block-body > .bpatch-desc,
.be-block:hover .be-block-body > .bpatch-desc {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
.bpatch-port-label {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: .2px;
}
.bpatch-param-label {
  font-size: 9px;
  color: #7c8db5;
  min-width: 72px;
  flex-shrink: 0;
  padding-right: 4px;
}
.bpatch-hint-banner {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,212,255,.08);
  border: 1px solid rgba(0,212,255,.2);
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 11px;
  color: #7ec8e3;
  pointer-events: none;
  z-index: 20;
  white-space: nowrap;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: .4px;
}
.bpatch-hint-banner b { color: #00d4ff; }

/* ── Live Run Panel ── */
#bpatch-run-panel {
  position: absolute;
  right: 18px;
  top: 18px;
  width: 320px;
  background: #0d0f18;
  border: 1px solid #252a3a;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(0,212,255,.08);
  z-index: 600;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  transition: box-shadow .2s;
}
#bpatch-run-panel.running {
  border-color: rgba(0,212,255,.5);
  box-shadow: 0 8px 40px rgba(0,0,0,.7), 0 0 20px rgba(0,212,255,.15);
}
.bpatch-run-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0,212,255,.06);
  border-bottom: 1px solid #1e2232;
  cursor: default;
  user-select: none;
}
.bpatch-run-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #00d4ff;
  text-transform: uppercase;
  flex: 1;
}
.bpatch-run-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3d4357;
  transition: background .2s, box-shadow .2s;
}
.bpatch-run-dot.live {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: bpatch-pulse 1s infinite;
}
@keyframes bpatch-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .5; }
}
.bpatch-run-close {
  font-size: 13px;
  color: #3d4357;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: color .15s, background .15s;
}
.bpatch-run-close:hover { color: #ef4444; background: rgba(239,68,68,.1); }

/* Progress bar */
.bpatch-progress-wrap {
  height: 4px;
  background: #12141e;
}
.bpatch-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0091ff);
  transition: width .3s ease;
  width: 0%;
}

/* Step indicator */
.bpatch-step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 4px;
  font-size: 10px;
  color: #6b7280;
}
.bpatch-step-label { color: #00d4ff; font-weight: 700; }

/* Active block info */
.bpatch-active-block {
  margin: 4px 12px 0;
  padding: 8px 10px;
  background: rgba(0,212,255,.06);
  border: 1px solid rgba(0,212,255,.15);
  border-radius: 6px;
  font-size: 11px;
  color: #c8d3f5;
  min-height: 36px;
  line-height: 1.5;
  transition: all .2s;
}
.bpatch-active-block .block-name {
  font-weight: 700;
  color: #00d4ff;
  display: inline;
}
.bpatch-active-block .block-explain {
  display: block;
  font-size: 10px;
  color: #8b96b8;
  margin-top: 2px;
  font-style: italic;
}

/* Execution log */
.bpatch-log-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #3d4357;
  text-transform: uppercase;
  padding: 10px 14px 3px;
}
.bpatch-log {
  height: 140px;
  overflow-y: auto;
  padding: 0 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.bpatch-log::-webkit-scrollbar { width: 3px; }
.bpatch-log::-webkit-scrollbar-track { background: transparent; }
.bpatch-log::-webkit-scrollbar-thumb { background: #252a3a; border-radius: 2px; }
.bpatch-log-entry {
  font-size: 10px;
  line-height: 1.5;
  padding: 2px 0;
  display: flex;
  gap: 6px;
  align-items: baseline;
}
.bpatch-log-entry .icon { flex-shrink: 0; }
.bpatch-log-entry.info  { color: #6b7280; }
.bpatch-log-entry.ok    { color: #22c55e; }
.bpatch-log-entry.warn  { color: #f59e0b; }
.bpatch-log-entry.error { color: #ef4444; }
.bpatch-log-entry.step  { color: #00d4ff; font-weight: 600; }

/* Mini game canvas */
.bpatch-game-wrap {
  margin: 0 12px 12px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #1e2232;
  position: relative;
  background: #08090d;
}
#bpatch-game-canvas {
  display: block;
  width: 100%;
  height: 120px;
  image-rendering: pixelated;
}
.bpatch-game-label {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(0,212,255,.6);
  text-transform: uppercase;
  pointer-events: none;
}

/* Run/Stop buttons inside panel */
.bpatch-btn-row {
  display: flex;
  gap: 6px;
  padding: 4px 12px 12px;
}
.bpatch-btn {
  flex: 1;
  padding: 8px 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .8px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all .15s;
  font-family: 'Rajdhani', sans-serif;
}
.bpatch-btn.run {
  background: linear-gradient(135deg, #00d4ff, #0091ff);
  color: #000;
}
.bpatch-btn.run:hover { filter: brightness(1.1); }
.bpatch-btn.stop {
  background: rgba(239,68,68,.12);
  color: #ef4444;
  border: 1px solid rgba(239,68,68,.3);
}
.bpatch-btn.stop:hover { background: rgba(239,68,68,.2); }

/* Block executing highlight */
.bpatch-executing {
  outline: 2px solid #00ffcc !important;
  outline-offset: 2px;
  box-shadow: 0 0 18px rgba(0,255,200,.55) !important;
  transform: scale(1.03) !important;
  z-index: 1000 !important;
  transition: outline .15s, box-shadow .15s, transform .15s;
}

/* ── Add-block drag hint ── */
.bpatch-drag-hint {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,.6);
  border: 1px dashed rgba(0,212,255,.25);
  border-radius: 8px;
  padding: 10px 20px;
  text-align: center;
  color: #3d4357;
  font-size: 11px;
  pointer-events: none;
  z-index: 5;
  letter-spacing: .3px;
}
.bpatch-drag-hint b { color: rgba(0,212,255,.55); }
`;

// ─── Inject CSS once ───────────────────────────────────────────────────────────
function injectPatchCSS() {
  if (document.getElementById('bpatch-css')) return;
  const s = document.createElement('style');
  s.id = 'bpatch-css';
  s.textContent = PATCH_CSS;
  document.head.appendChild(s);
}

// ─── Build the Live Run Panel (injected into #block-editor) ────────────────────
function buildRunPanel() {
  if (document.getElementById('bpatch-run-panel')) return;
  const be = document.getElementById('block-editor');
  if (!be) return;

  const panel = document.createElement('div');
  panel.id = 'bpatch-run-panel';
  panel.innerHTML = `
    <div class="bpatch-run-header">
      <div class="bpatch-run-dot" id="bpatch-dot"></div>
      <div class="bpatch-run-title">▶ Live Run</div>
      <div class="bpatch-run-close" id="bpatch-panel-close" title="Hide panel">✕</div>
    </div>
    <div class="bpatch-progress-wrap">
      <div class="bpatch-progress-bar" id="bpatch-progress"></div>
    </div>
    <div class="bpatch-step-row">
      <span id="bpatch-step-label">Ready to run</span>
      <span id="bpatch-step-counter" style="color:#3d4357">0 / 0</span>
    </div>
    <div class="bpatch-active-block" id="bpatch-active-block">
      <span style="color:#3d4357;font-style:italic">No block executing</span>
    </div>
    <div class="bpatch-game-wrap">
      <canvas id="bpatch-game-canvas" width="296" height="120" style="display:block;background:#000;"></canvas>
      <div class="bpatch-game-label">Game Preview</div>
    </div>
    <div class="bpatch-log-title">Execution Log</div>
    <div class="bpatch-log" id="bpatch-log"></div>
    <div class="bpatch-btn-row">
      <button class="bpatch-btn run" id="bpatch-run-btn">▶ Run Blocks</button>
      <button class="bpatch-btn stop" id="bpatch-stop-btn">■ Stop</button>
    </div>
  `;
  be.appendChild(panel);

  document.getElementById('bpatch-run-btn').onclick  = () => runBlocksPatched();
  document.getElementById('bpatch-stop-btn').onclick = () => stopBlocksPatched();
  document.getElementById('bpatch-panel-close').onclick = () => {
    panel.style.display = 'none';
  };

  initGamePreviewCanvas();
}

// ─── Mini Game Preview Canvas (using actual game canvas) ───────────────────────
let _gameCanvas, _gameCtx;
let _gameObjects  = [];
let _gameMessages = [];
let _gameLoop;
let _realGameCanvas = null;
let _lastCanvasCheck = 0;
let _canvasCheckInterval = 500; // Re-search for canvas every 500ms

function findRealGameCanvas() {
  // Try multiple strategies to find the actual game canvas
  
  // 1. Look for canvas with id containing 'game'
  let canvas = document.querySelector('#game-canvas') ||
               document.querySelector('[id*="gameCanvas"]') ||
               document.querySelector('[id*="game-canvas"]');
  
  if (canvas && canvas.id !== 'bpatch-game-canvas') return canvas;
  
  // 2. Search in GameEditor container or similar
  const gameEditor = document.querySelector('#game-editor') ||
                     document.querySelector('[data-editor="game"]') ||
                     document.querySelector('.game-editor');
  
  if (gameEditor) {
    canvas = gameEditor.querySelector('canvas:not(#bpatch-game-canvas)');
    if (canvas) return canvas;
  }
  
  // 3. Look for any canvas that has been drawn to (has width/height > 0)
  const allCanvases = Array.from(document.querySelectorAll('canvas'));
  for (let c of allCanvases) {
    if (c.id !== 'bpatch-game-canvas' && c.width > 0 && c.height > 0) {
      // Verify it's likely the game canvas (not UI element)
      const rect = c.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        return c;
      }
    }
  }
  
  // 4. Last resort: get first visible canvas
  for (let c of allCanvases) {
    if (c.id !== 'bpatch-game-canvas' && c.offsetParent !== null) {
      return c;
    }
  }
  
  return null;
}

function initGamePreviewCanvas() {
  // Try to find the real game canvas in the main editor
  _gameCanvas = document.getElementById('bpatch-game-canvas');
  if (_gameCanvas) {
    _gameCtx = _gameCanvas.getContext('2d');
  }

  // Initial canvas search
  _realGameCanvas = findRealGameCanvas();
  
  if (_realGameCanvas) {
    panelLog('info', `Connected to live game canvas (${_realGameCanvas.width}×${_realGameCanvas.height})`);
  } else {
    panelLog('warn', 'Game canvas not found — searching dynamically...');
  }

  // High-frequency tick for real-time rendering
  if (_gameLoop) clearInterval(_gameLoop);
  _gameLoop = setInterval(tickGamePreview, 16); // ~60fps
}

function drawGamePreview() {
  if (!_gameCtx || !_gameCanvas) return;

  const now = Date.now();
  
  // Periodically search for real canvas (in case it's added dynamically)
  if (now - _lastCanvasCheck > _canvasCheckInterval) {
    _lastCanvasCheck = now;
    if (!_realGameCanvas || !_realGameCanvas.parentElement) {
      const found = findRealGameCanvas();
      if (found && found !== _realGameCanvas) {
        _realGameCanvas = found;
        if (BPATCH_STATE.running) {
          panelLog('info', `Reconnected to game canvas (${found.width}×${found.height})`);
        }
      }
    }
  }

  // PRIMARY: If real game canvas exists, copy its content (live rendering)
  if (_realGameCanvas && _realGameCanvas.width > 0 && _realGameCanvas.height > 0) {
    try {
      const realCtx = _realGameCanvas.getContext('2d', { willReadFrequently: true });
      if (realCtx) {
        // Clear preview canvas
        _gameCtx.clearRect(0, 0, _gameCanvas.width, _gameCanvas.height);
        
        // Calculate scaling to fit preview
        const scaleX = _gameCanvas.width / _realGameCanvas.width;
        const scaleY = _gameCanvas.height / _realGameCanvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Center scaled content
        const offsetX = (_gameCanvas.width - (_realGameCanvas.width * scale)) / 2;
        const offsetY = (_gameCanvas.height - (_realGameCanvas.height * scale)) / 2;
        
        _gameCtx.save();
        _gameCtx.translate(offsetX, offsetY);
        _gameCtx.scale(scale, scale);
        
        // Draw the actual game canvas
        try {
          _gameCtx.drawImage(_realGameCanvas, 0, 0);
        } catch (drawErr) {
          // If drawImage fails, might be CORS issue
          _gameCtx.fillStyle = 'rgba(255,255,255,.1)';
          _gameCtx.fillRect(0, 0, _realGameCanvas.width, _realGameCanvas.height);
          _gameCtx.fillStyle = '#888';
          _gameCtx.font = '12px monospace';
          _gameCtx.textAlign = 'center';
          _gameCtx.fillText('Live canvas (CORS protected)', _realGameCanvas.width / 2, _realGameCanvas.height / 2);
        }
        
        _gameCtx.restore();
        
        // Overlay execution messages on top of live canvas
        _gameMessages = _gameMessages.filter(m => m.life > 0);
        _gameMessages.forEach(m => {
          m.y -= 0.5;
          m.life--;
          _gameCtx.globalAlpha = Math.min(1, m.life / 20);
          _gameCtx.fillStyle = m.color || '#00d4ff';
          _gameCtx.font = 'bold 9px monospace';
          _gameCtx.textAlign = 'left';
          _gameCtx.shadowColor = 'rgba(0,0,0,.8)';
          _gameCtx.shadowBlur = 4;
          _gameCtx.fillText(m.text, m.x, m.y);
          _gameCtx.shadowBlur = 0;
          _gameCtx.globalAlpha = 1;
        });
        
        return;
      }
    } catch (e) {
      // Silently continue to fallback
    }
  }

  // FALLBACK: Draw animated preview with placeholder
  const W = _gameCanvas.width, H = _gameCanvas.height;
  _gameCtx.clearRect(0, 0, W, H);

  // Background gradient
  const grad = _gameCtx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0c14');
  grad.addColorStop(1, '#0d0f18');
  _gameCtx.fillStyle = grad;
  _gameCtx.fillRect(0, 0, W, H);
  
  // Grid pattern
  _gameCtx.strokeStyle = 'rgba(255,255,255,.03)';
  _gameCtx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) { 
    _gameCtx.beginPath(); 
    _gameCtx.moveTo(x, 0); 
    _gameCtx.lineTo(x, H); 
    _gameCtx.stroke(); 
  }
  for (let y = 0; y < H; y += 20) { 
    _gameCtx.beginPath(); 
    _gameCtx.moveTo(0, y); 
    _gameCtx.lineTo(W, y); 
    _gameCtx.stroke(); 
  }

  // Waiting message
  _gameCtx.fillStyle = 'rgba(255,255,255,.2)';
  _gameCtx.font = '11px monospace';
  _gameCtx.textAlign = 'center';
  _gameCtx.fillText('Searching for game canvas...', W / 2, H / 2);

  // Draw animated objects if available
  _gameObjects.forEach(obj => {
    if (obj.hidden) return;
    _gameCtx.save();
    _gameCtx.translate(obj.x, obj.y);

    _gameCtx.shadowColor  = obj.color;
    _gameCtx.shadowBlur   = obj.glow || 0;

    _gameCtx.fillStyle = obj.color;
    _gameCtx.globalAlpha = obj.opacity || 1;
    _gameCtx.fillRect(-obj.w / 2, -obj.h / 2, obj.w, obj.h);

    _gameCtx.shadowBlur = 0;
    _gameCtx.globalAlpha = 1;
    _gameCtx.fillStyle = 'rgba(255,255,255,.55)';
    _gameCtx.font = 'bold 7px monospace';
    _gameCtx.textAlign = 'center';
    _gameCtx.fillText(obj.label, 0, obj.h / 2 + 9);

    _gameCtx.restore();
  });

  // Messages overlay
  _gameMessages = _gameMessages.filter(m => m.life > 0);
  _gameMessages.forEach(m => {
    m.y -= 0.5;
    m.life--;
    _gameCtx.globalAlpha = Math.min(1, m.life / 20);
    _gameCtx.fillStyle = m.color || '#00d4ff';
    _gameCtx.font = 'bold 10px monospace';
    _gameCtx.textAlign = 'left';
    _gameCtx.fillText(m.text, m.x, m.y);
    _gameCtx.globalAlpha = 1;
  });
}

function tickGamePreview() {
  // Update simulated objects
  _gameObjects.forEach(obj => {
    if (obj.vx) { obj.x += obj.vx; if (obj.x < 10 || obj.x > 286) obj.vx *= -1; }
    if (obj.vy) { obj.y += obj.vy; if (obj.y < 10 || obj.y > 110) obj.vy *= -1; }
    if (obj.glow > 0) obj.glow = Math.max(0, obj.glow - 1);
  });
  
  // Draw live game canvas or fallback
  drawGamePreview();
}

function applyBlockToPreview(block) {
  const p = {};
  (block.params || []).forEach(param => { p[param.k] = param.v; });
  const type = block.type;

  const obj = _gameObjects[0]; // Default: act on player

  if (type === 'Move To') {
    const nx = Math.max(14, Math.min(282, +(p.x) || obj.x));
    const ny = Math.max(14, Math.min(106, +(p.y) || obj.y));
    obj.x = nx; obj.y = ny;
    _gameMessages.push({ text: `→ (${nx}, ${ny})`, x: nx, y: ny - 14, life: 60, color: '#00d4ff' });
  } else if (type === 'Move By') {
    obj.x = Math.max(14, Math.min(282, obj.x + (+(p.dx) || 0)));
    obj.y = Math.max(14, Math.min(106, obj.y + (+(p.dy) || 0)));
    obj.glow = 12;
    _gameMessages.push({ text: `+${p.dx || 0}, +${p.dy || 0}`, x: obj.x, y: obj.y - 16, life: 50, color: '#0ea5e9' });
  } else if (type === 'Set Velocity') {
    obj.vx = (+(p.x) || 0) * 0.05;
    obj.vy = (+(p.y) || 0) * 0.05;
    obj.glow = 15;
  } else if (type === 'Stop Movement') {
    obj.vx = 0; obj.vy = 0;
    _gameMessages.push({ text: 'STOPPED', x: obj.x - 20, y: obj.y - 16, life: 50, color: '#ef4444' });
  } else if (type === 'Apply Force' || type === 'Apply Impulse') {
    obj.vx += (+(p.x) || 0) * 0.015;
    obj.vy += (+(p.y) || 0) * 0.015;
    obj.glow = 18;
    _gameMessages.push({ text: '💥', x: obj.x, y: obj.y - 12, life: 40, color: '#f59e0b' });
  } else if (type === 'Scale') {
    const sx = +(p.x) || 1, sy = +(p.y) || 1;
    obj.w = Math.max(4, Math.min(40, 22 * sx));
    obj.h = Math.max(4, Math.min(40, 22 * sy));
    obj.glow = 14;
  } else if (type === 'Set Visible') {
    obj.hidden = (p.visible === 'false');
  } else if (type === 'Play Sound') {
    _gameMessages.push({ text: `♪ ${p.src || 'sound'}`, x: 10, y: 20, life: 70, color: '#1abc9c' });
  } else if (type === 'Shake') {
    _gameObjects.forEach(o => { o.x += (Math.random() - .5) * (+(p.mag) || 5); });
    _gameMessages.push({ text: '📳', x: 130, y: 30, life: 30, color: '#fbbf24' });
  } else if (type === 'Fill Rect' || type === 'Draw Circle' || type === 'Draw Text') {
    _gameMessages.push({ text: `🎨 ${type}`, x: 8, y: 30, life: 60, color: '#ec4899' });
  } else if (type === 'Emit Burst') {
    const cnt = Math.min(+(p.count) || 8, 12);
    for (let i = 0; i < cnt; i++) {
      const angle = (i / cnt) * Math.PI * 2;
      const speed = ((+(p.speed) || 60) / 60) * 0.8;
      _gameObjects.push({
        id: `particle_${Date.now()}_${i}`,
        label: '', x: obj.x, y: obj.y, w: 4, h: 4,
        color: p.color || '#fbbf24',
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 60,
        isParticle: true
      });
    }
  } else if (type === 'Set Opacity') {
    obj.opacity = +(p.val) || 1;
  } else if (type === 'Use Color' || type === 'Set Tint') {
    obj.color = p.color || obj.color;
    obj.glow = 14;
  } else if (type === 'Add Light') {
    _gameMessages.push({ text: '💡', x: obj.x, y: obj.y - 16, life: 60, color: '#fbbf24' });
    obj.glow = 20;
  } else if (type === 'Rotate') {
    _gameMessages.push({ text: `↻ ${p.deg || 0}°`, x: obj.x, y: obj.y - 14, life: 50, color: '#8b5cf6' });
  } else if (type === 'Delay') {
    _gameMessages.push({ text: `⏱ ${p.ms}ms`, x: 10, y: 15, life: 60, color: '#6b7280' });
  } else {
    obj.glow = 8;
  }

  // Prune dead particles
  _gameObjects = _gameObjects.filter(o => !o.isParticle || (o.life = (o.life || 0) - 1) > 0);
}

// ─── Live Execution State ─────────────────────────────────────────────────────
const BPATCH_STATE = {
  running:    false,
  aborted:    false,
  previewLoop: null,
};

function panelLog(type, text) {
  const log = document.getElementById('bpatch-log');
  if (!log) return;
  const icons = { info: '◦', ok: '✓', warn: '⚠', error: '✕', step: '▶' };
  const entry = document.createElement('div');
  entry.className = `bpatch-log-entry ${type}`;
  entry.innerHTML = `<span class="icon">${icons[type] || '◦'}</span><span>${text}</span>`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function setProgress(current, total) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  const bar = document.getElementById('bpatch-progress');
  if (bar) bar.style.width = `${pct}%`;

  const counter = document.getElementById('bpatch-step-counter');
  if (counter) counter.textContent = `${current} / ${total}`;
}

function setActiveBlockDisplay(block) {
  const el = document.getElementById('bpatch-active-block');
  if (!el) return;
  if (!block) {
    el.innerHTML = `<span style="color:#3d4357;font-style:italic">No block executing</span>`;
    return;
  }
  const explain = explainExecution(block);
  el.innerHTML = `
    <span class="block-name">[${block.cat}] ${block.type}</span>
    <span class="block-explain">${explain}</span>
  `;
}

async function runBlocksPatched() {
  try {
    const beState = getBlockEditorState();
    if (!beState || !Array.isArray(beState.blocks) || !beState.blocks.length) {
      panelLog('warn', 'No blocks to run — add some blocks first!');
      return;
    }

    if (BPATCH_STATE.running) {
      panelLog('warn', 'Already running!');
      return;
    }

    const logEl = document.getElementById('bpatch-log');
    if (logEl) logEl.innerHTML = '';

    BPATCH_STATE.running = true;
    BPATCH_STATE.aborted = false;

    const panel = document.getElementById('bpatch-run-panel');
    const dot = document.getElementById('bpatch-dot');
    const stepLabel = document.getElementById('bpatch-step-label');

    if (panel) panel.classList.add('running');
    if (dot) dot.classList.add('live');
    if (stepLabel) stepLabel.textContent = 'Running…';

    if (_gameLoop) clearInterval(_gameLoop);
    _gameLoop = setInterval(tickGamePreview, 33);

    panelLog('info', `Starting execution of ${beState.blocks.length} block(s)…`);
    setProgress(0, beState.blocks.length);

    const ordered = sortBlocksForExecution(beState.blocks, beState.connections || []);

    if (!_gameObjects.length) {
      _gameObjects = [
        { id: 'player', label: 'P', x: 50, y: 60, w: 22, h: 22, color: '#00d4ff', vx: 0, vy: 0, glow: 0, opacity: 1 }
      ];
    }

    panelLog('info', 'Running blocks with live preview…');

    for (let i = 0; i < ordered.length; i++) {
      if (BPATCH_STATE.aborted) break;
      
      try {
        const block = ordered[i];

        setActiveBlockDisplay(block);
        setProgress(i + 1, ordered.length);
        panelLog('step', `${i + 1}/${ordered.length} — ${block.type}`);

        clearAllBlockHighlights();
        const dom = Array.from(document.querySelectorAll('.be-block')).find(el => {
          const title = el.querySelector('.be-block-title');
          return title && title.textContent && title.textContent.trim() === block.type;
        });
        
        if (dom) {
          dom.classList.add('bpatch-executing');
        }

        try { 
          applyBlockToPreview(block); 
        } catch (previewErr) {
          console.warn('Preview error:', previewErr);
        }

        await sleep(350);
      } catch (stepErr) {
        panelLog('error', `Step error: ${stepErr.message}`);
      }
    }
  } catch (err) {
    panelLog('error', 'Execution error: ' + (err && err.message ? err.message : String(err)));
    console.error('runBlocksPatched error:', err);
  } finally {
    BPATCH_STATE.running = false;
    const panel = document.getElementById('bpatch-run-panel');
    const dot = document.getElementById('bpatch-dot');
    if (panel) panel.classList.remove('running');
    if (dot) dot.classList.remove('live');
    clearAllBlockHighlights();
    setActiveBlockDisplay(null);
    panelLog('ok', 'Execution finished.');
    if (_gameLoop) { clearInterval(_gameLoop); _gameLoop = null; }
  }
}

function stopBlocksPatched() {
  BPATCH_STATE.aborted = true;
  BPATCH_STATE.running = false;
  clearAllBlockHighlights();
  const panel = document.getElementById('bpatch-run-panel');
  const dot   = document.getElementById('bpatch-dot');
  if (panel) panel.classList.remove('running');
  if (dot) dot.classList.remove('live');
  panelLog('warn', 'Execution stopped.');
  const stepLabel = document.getElementById('bpatch-step-label');
  if (stepLabel) stepLabel.textContent = 'Stopped';
  setActiveBlockDisplay(null);
  if (_gameLoop) { clearInterval(_gameLoop); _gameLoop = null; }
}

function clearAllBlockHighlights() {
  try {
    document.querySelectorAll('.bpatch-executing').forEach(el => {
      el.classList.remove('bpatch-executing');
    });
  } catch (e) {
    console.warn('Error clearing highlights:', e);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Sort blocks: event/root nodes first, then follow connections
function sortBlocksForExecution(blocks, connections) {
  if (!blocks || !blocks.length) return [];
  // Find root blocks (blocks with no incoming exec connections)
  const hasInput = new Set(connections.map(c => c.to));
  const roots    = blocks.filter(b => !hasInput.has(b.id));
  if (!roots.length) return [...blocks]; // fallback: use original order

  const visited = new Set();
  const result  = [];
  const queue   = [...roots];

  while (queue.length) {
    const block = queue.shift();
    if (visited.has(block.id)) continue;
    visited.add(block.id);
    result.push(block);

    // Find blocks connected from this block's output ports
    const outConns = connections.filter(c => c.from === block.id);
    outConns.forEach(conn => {
      const next = blocks.find(b => b.id === conn.to);
      if (next && !visited.has(next.id)) queue.push(next);
    });
  }

  // Add any remaining disconnected blocks
  blocks.forEach(b => {
    if (!visited.has(b.id)) result.push(b);
  });

  return result;
}


// ─── Beginner hints + existing block UI patch helpers ────────────────────────
function getBlockEditorHost() {
  return document.getElementById('be-canvas') ||
         document.getElementById('block-editor') ||
         document.querySelector('.block-editor');
}

function getBlockEditorState() {
  return window.BE ||
         window.__FORGE_BE ||
         window.__forgeRuntime?.BE ||
         null;
}

function ensureHintBanner() {
  const host = getBlockEditorHost();
  if (!host) return null;

  let banner = document.getElementById('bpatch-hint-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'bpatch-hint-banner';
    banner.className = 'bpatch-hint-banner';
    banner.innerHTML = '<b>Blocks tip:</b> drag blocks to move them • drag connector dots to link blocks • press Run Blocks to preview';
  }

  if (banner.parentElement !== host) {
    host.appendChild(banner);
  }

  const style = window.getComputedStyle(host);
  if (style.position === 'static') {
    host.style.position = 'relative';
  }

  return banner;
}

function ensureEmptyStateHint() {
  const host = getBlockEditorHost();
  if (!host) return null;

  const beState = getBlockEditorState();
  const hasBlocks = !!(beState && Array.isArray(beState.blocks) && beState.blocks.length);
  let hint = document.getElementById('bpatch-empty-state-hint');

  if (hasBlocks) {
    if (hint) hint.remove();
    return null;
  }

  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'bpatch-empty-state-hint';
    hint.className = 'bpatch-drag-hint';
    hint.innerHTML = '<b>Drag a block here</b><br>Start with an Event block, then connect actions.';
  }

  if (hint.parentElement !== host) {
    host.appendChild(hint);
  }

  const style = window.getComputedStyle(host);
  if (style.position === 'static') {
    host.style.position = 'relative';
  }

  return hint;
}


function forceDescriptionVisible(desc, description) {
  if (!desc) return;
  if (typeof description === 'string' && description.length && desc.textContent !== description) {
    desc.textContent = description;
  }
  desc.classList.add('bpatch-desc');
  desc.classList.remove('hidden');
  desc.removeAttribute('hidden');
  desc.setAttribute('aria-hidden', 'false');
  desc.style.setProperty('display', 'block', 'important');
  desc.style.setProperty('visibility', 'visible', 'important');
  desc.style.setProperty('opacity', '1', 'important');
  desc.style.setProperty('height', 'auto', 'important');
  desc.style.setProperty('max-height', 'none', 'important');
  desc.style.setProperty('overflow', 'visible', 'important');
}

function ensureBlockDescriptionElement(blockEl, description) {
  if (!blockEl || !description) return null;
  const body = blockEl.querySelector('.be-block-body');
  if (!body) return null;
  let desc = body.querySelector('.bpatch-desc');
  if (!desc) {
    desc = document.createElement('div');
    desc.className = 'bpatch-desc';
    body.appendChild(desc);
  }
  forceDescriptionVisible(desc, description);
  return desc;
}

function patchExistingBlocks() {
  try {
    const beState = getBlockEditorState();
    if (!beState || !Array.isArray(beState.blocks)) return;
    
    const blocks = beState.blocks;
    if (blocks.length === 0) return;
    
    const blocksById = new Map(blocks.map(block => [String(block.id), block]));

    const blockEls = document.querySelectorAll('.be-block');
    if (blockEls.length === 0) return;

    blockEls.forEach(el => {
      try {
        // Validate element has required structure
        if (!el || !el.id) return;
        
        const id = String((el.id || '').replace(/^be-block-/, ''));
        if (!id) return;
        
        const block = blocksById.get(id);
        if (!block) return; // Block not found in state, skip patching
        
        // Double-check element still exists in DOM
        if (!el.parentElement || !document.contains(el)) return;
        
        const title = el.querySelector('.be-block-title');
        if (!title) return; // Element structure incomplete, skip
        
        const blockType = block.type || title.textContent?.trim() || '';
        if (!blockType) return;
        
        const description = BLOCK_DESCRIPTIONS[blockType] || '';

        // Patch title with tooltip
        try {
          title.title = description || blockType;
        } catch (e) {
          console.warn('Error setting title:', e);
        }

        // Patch port labels (connectors) - only if they exist
        try {
          const connectors = el.querySelectorAll('.be-connector');
          if (connectors.length > 0) {
            connectors.forEach(connector => {
              try {
                const row = connector.closest('.be-port');
                const label = row ? row.querySelector('span:not(.be-connector)') : null;
                const portName = connector.dataset?.port;
                
                if (label && portName && label.textContent) {
                  label.textContent = friendlyPort(portName);
                  label.classList.add('bpatch-port-label');
                  label.title = portName;
                }
              } catch (e) {
                // Silently skip this connector
              }
            });
          }
        } catch (e) {
          console.warn('Error patching connectors:', e);
        }

        // Patch parameter labels using block state or DOM
        try {
          const paramElements = el.querySelectorAll('.be-param-label');
          const blockParams = Array.isArray(block.params) ? block.params : [];
          
          if (paramElements.length > 0) {
            paramElements.forEach((label, index) => {
              try {
                if (!label || !label.textContent) return;
                
                let key = label.dataset?.paramKey;
                
                // Try to get key from block params first
                if (!key && blockParams.length > index && blockParams[index]) {
                  key = blockParams[index].k || blockParams[index].key;
                }
                
                // Fallback to label text
                if (!key) {
                  key = label.textContent.trim();
                }
                
                if (key && key.length > 0) {
                  label.dataset.paramKey = key;
                  label.textContent = friendlyParam(key);
                  label.classList.add('bpatch-param-label');
                  label.title = key;
                }
              } catch (e) {
                // Silently skip this param
              }
            });
          }
        } catch (e) {
          console.warn('Error patching params:', e);
        }

        // Add or preserve description in block body - ALWAYS keep it visible
        try {
          ensureBlockDescriptionElement(el, description);
        } catch (e) {
          console.warn('Error adding description:', e);
        }
      } catch (blockErr) {
        console.warn('Error patching block element:', blockErr);
      }
    });
  } catch (err) {
    console.warn('Error in patchExistingBlocks:', err);
  }
}

// ─── Override the existing "Run Blocks" button in the toolbar ─────────────────
function patchRunButton() {
  const be = document.getElementById('block-editor');
  if (!be) return;

  // Find existing run blocks button injected by addRunBlocksButtonV4
  be.querySelectorAll('button').forEach(btn => {
    if (btn.textContent.includes('Run Blocks')) {
      btn.onclick = () => {
        const panel = document.getElementById('bpatch-run-panel');
        if (panel) {
          panel.style.display = '';
          runBlocksPatched();
        }
      };
    }
  });

  // Do NOT alias window.runBlocksLiveV4 to runBlocksPatched.
  // That creates runBlocksPatched → runBlocksLiveV4 → runBlocksPatched recursion.
}

// ─── Main: apply patch whenever Block Editor is active ────────────────────────

let _descriptionGuardInstalled = false;
let _descriptionGuardTimer = null;

function scheduleDescriptionPatch() {
  if (_descriptionGuardTimer) cancelAnimationFrame(_descriptionGuardTimer);
  _descriptionGuardTimer = requestAnimationFrame(() => {
    _descriptionGuardTimer = null;
    try { patchExistingBlocks(); } catch (e) { console.warn('Description guard error:', e); }
  });
}

function installDescriptionVisibilityGuard() {
  if (_descriptionGuardInstalled) return;
  _descriptionGuardInstalled = true;

  // Patch immediately after common block-editor interactions/redraw triggers.
  ['click', 'mousedown', 'mouseup', 'input', 'change', 'dragend', 'drop'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.target && (e.target.closest?.('#block-editor') || e.target.closest?.('.modal-overlay'))) {
        scheduleDescriptionPatch();
      }
    }, true);
  });

  // If the host app exposes renderBlockEditor on window, wrap it so descriptions
  // are re-added during the same frame as the redraw instead of popping in later.
  const wrapRender = () => {
    if (typeof window.renderBlockEditor !== 'function' || window.renderBlockEditor.__bpatchDescGuard) return;
    const originalRenderBlockEditor = window.renderBlockEditor;
    window.renderBlockEditor = function(...args) {
      const result = originalRenderBlockEditor.apply(this, args);
      scheduleDescriptionPatch();
      return result;
    };
    window.renderBlockEditor.__bpatchDescGuard = true;
  };
  wrapRender();
  setTimeout(wrapRender, 0);
  setTimeout(wrapRender, 250);
}

function applyPatch() {
  try {
    injectPatchCSS();
    installDescriptionVisibilityGuard();
    
    // Only build run panel once
    if (!document.getElementById('bpatch-run-panel')) {
      buildRunPanel();
    }
    
    ensureHintBanner();
    ensureEmptyStateHint();
    patchExistingBlocks();
    patchRunButton();
  } catch (e) {
    console.error('Error in applyPatch:', e);
  }
}

// ─── Re-apply on every Block Editor tab activation ────────────────────────────
let _blockEditorObserver = null;
let _patchTimeout = null;

function startObserver() {
  if (_blockEditorObserver) return; // already watching
  
  _blockEditorObserver = new MutationObserver(() => {
    // Re-apply on the next animation frame so descriptions are restored immediately
    // after renderBlockEditor() redraws the canvas.
    if (_patchTimeout) cancelAnimationFrame(_patchTimeout);
    _patchTimeout = requestAnimationFrame(() => {
      try {
        const be = document.getElementById('block-editor');
        if (be && !be.classList.contains('hidden')) {
          patchExistingBlocks();
        }
      } catch (e) {
        console.warn('Observer patch error:', e);
      }
    });
  });
  
  _blockEditorObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden'],
    characterData: false,
  });
}

/**
 * applyBlockEditorPatch()
 * ────────────────────────
 * Call this once, AFTER GameEditor.mount() has finished.
 * It runs the initial patch pass and starts the MutationObserver
 * so the patch re-applies whenever the Block Editor tab is reopened.
 */
export function applyBlockEditorPatch() {
  applyPatch();
  startObserver();

  // Expose helpers on window so FORGE's own runtime can reach them
  window.applyBlockEditorPatch = applyPatch;
  window.runBlocksPatched      = runBlocksPatched;
  window.stopBlocksPatched     = stopBlocksPatched;
}

// COPILOT FIX V19: recursion-safe delegation to GameEditor's event-driven block runtime.
// The old V18 patch could create this loop:
//   runBlocksPatched() -> window.runBlocksLiveV4() -> runBlocksPatched() -> ...
// This version delegates only when runBlocksLiveV4 is a different function.
try {
  const __bpatchOriginalRunBlocksImplV19 = runBlocksPatched;
  const __bpatchOriginalStopBlocksImplV19 = stopBlocksPatched;

  runBlocksPatched = async function(){
    const liveRunner = (typeof window !== 'undefined') ? window.runBlocksLiveV4 : null;

    // Delegate to GameEditor's runtime only if it exists AND is not this patch function.
    if (typeof liveRunner === 'function' && liveRunner !== runBlocksPatched) {
      BPATCH_STATE.running = true;
      try { await liveRunner(); }
      finally { BPATCH_STATE.running = false; }
      return;
    }

    // Fallback to the patch panel's original local runner.
    return __bpatchOriginalRunBlocksImplV19();
  };

  stopBlocksPatched = function(){
    const liveStopper = (typeof window !== 'undefined') ? window.stopBlocksLiveV4 : null;

    // Avoid calling ourselves if any external code accidentally aliases it.
    if (typeof liveStopper === 'function' && liveStopper !== stopBlocksPatched) {
      try { liveStopper(); } catch (_) {}
    }

    return __bpatchOriginalStopBlocksImplV19();
  };

  if (typeof window !== 'undefined') {
    window.runBlocksPatched = runBlocksPatched;
    window.stopBlocksPatched = stopBlocksPatched;
  }
} catch (_) {}
