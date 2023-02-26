// interacting with wasm =======================================================

// WASM module
let mod = undefined;
_ = mod;
// WASM instance
let instance = undefined;

async function initModule() {
  const memory = new WebAssembly.Memory({
    initial: 10,
    maximum: 100,
    shared: true,
  });

  const src = await WebAssembly.instantiateStreaming(fetch("index.wasm"), {
    js: { mem: memory },
    env: ENV,
  });

  mod = src.module;
  instance = src.instance;
}

// gets a dataview into wasm memory
function getView() {
  return new DataView(instance.exports.memory.buffer);
}

// loads a js string
function getString(addr, len) {
  const memory = instance.exports.memory;

  const buf = new Uint8Array(memory.buffer, addr, len);
  return new TextDecoder().decode(buf);
}

// dupe a js string into wasm module, returns address
function dupeString(str) {
  const alloc = instance.exports.alloc;
  const memory = instance.exports.memory;
  const len = str.length;

  const addr = alloc(len);
  const buf = new Uint8Array(memory.buffer, addr, len);
  buf.set(new TextEncoder().encode(str));

  return addr;
}

// call a wasm function if it exists
// don't use this in a loop if you can avoid it
function call(name, ...args) {
  const ex = instance.exports;
  if (name in ex) ex[name](args);
}

// imports =====================================================================

// provided to WASM
const ENV = {
  debug,
  get_window_size: getWindowSize,
  get_mouse_pos: getMousePos,
};

function debug(msg_addr, msg_len) {
  console.debug(getString(msg_addr, msg_len));
}

// page state and events =======================================================

const state = {
  mouse: {
    x: 0,
    y: 0,
  },
};

function getWindowSize(width_addr, height_addr) {
  const view = getView();
  view.setUint32(width_addr, window.innerWidth, true);
  view.setUint32(height_addr, window.innerHeight, true);
}

function getMousePos(x_addr, y_addr) {
  view.setUint32(x_addr, state.mouse.x, true);
  view.setUint32(y_addr, state.mouse.y, true);
}

addEventListener('mousemove', (e) => {
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;
});

// canvas management ===========================================================

let canvas = undefined;
let ctx = undefined;
let draw_buffer = undefined;

function drawBufLen() {
  return 4 * canvas.width * canvas.height;
}

function allocDrawBuf() {
  draw_buffer = instance.exports.alloc(drawBufLen());
}

function freeDrawBuf() {
  instance.exports.free(draw_buffer, drawBufLen());
}

function initDrawing() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  allocDrawBuf();

  const redraw = async () => {
    await draw();
    requestAnimationFrame(redraw);
  };

  requestAnimationFrame(redraw);
}

function deinitDrawing() {
  freeDrawBuf();
}

function resizeCanvas() {
  freeDrawBuf();

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  allocDrawBuf();
}

async function draw() {
  const ex = instance.exports;
  const len = drawBufLen();

  ex.draw(draw_buffer, canvas.width, canvas.height);

  // write image data
  const src = new Uint8ClampedArray(ex.memory.buffer, draw_buffer, len);
  const img = new ImageData(src, canvas.width, canvas.height)

  img.data.set(src);

  await ctx.putImageData(img, 0, 0);
}

addEventListener('resize', () => {
  resizeCanvas();
});

// input events ================================================================

function onMouseEvent(kind, e) {
  instance.exports.on_mouse_event(kind, e.button, e.clientX, e.clientY);
}

function onKeyEvent(kind, e) {
  const code = dupeString(e.code);
  const code_len = e.code.length;

  instance.exports.on_key_event(kind, code, code_len);
  instance.exports.free(code, code_len);
}

function initInputListeners() {
  const ex = instance.exports;

  if ('on_mouse_event' in ex) {
    const MOUSE_DOWN = 0;
    const MOUSE_UP = 1;

    addEventListener('mousedown', (e) => onMouseEvent(MOUSE_DOWN, e));
    addEventListener('mouseup', (e) => onMouseEvent(MOUSE_UP, e));
  }

  if ('on_key_event' in ex) {
    const KEY_DOWN = 0;
    const KEY_UP = 1;

    addEventListener('keydown', (e) => onKeyEvent(KEY_DOWN, e));
    addEventListener('keyup', (e) => onKeyEvent(KEY_UP, e));
  }
}

// run the module ==============================================================

// call init + continuously update
function run() {
  const ex = instance.exports;

  call('init');

  // find update fn
  if ('update' in ex) {
    // update + draw
    let last_ms = Date.now();

    const update = () => {
      // calc dt
      const cur_ms = Date.now();
      const dt = cur_ms - last_ms;
      last_ms = cur_ms;

      // call update, draw, and loop
      ex.update(dt);

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }
}

addEventListener('load', async () => {
  await initModule();
  initDrawing();
  initInputListeners();

  run();
})

addEventListener('unload', () => {
  call('deinit');
  deinitDrawing();
});