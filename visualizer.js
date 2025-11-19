const fileInput = document.getElementById('file');
const playPauseBtn = document.getElementById('playPause');
const info = document.getElementById('info');
const dropZone = document.getElementById('dropZone');
const freqCanvas = document.getElementById('freqCanvas');
const waveCanvas = document.getElementById('waveCanvas');

var animId = null;
var playing = false;
var frame = 0;

function resize() {
  var r = window.devicePixelRatio || 1;
  var rect = dropZone.getBoundingClientRect();
  freqCanvas.width = Math.max(1, Math.floor(rect.width * r));
  freqCanvas.height = Math.max(1, Math.floor(rect.height * r));
  waveCanvas.width = freqCanvas.width;
  waveCanvas.height = freqCanvas.height;
  freqCanvas.style.width = rect.width + 'px';
  freqCanvas.style.height = rect.height + 'px';
  waveCanvas.style.width = rect.width + 'px';
  waveCanvas.style.height = rect.height + 'px';
}

function draw() {
  var fctx = freqCanvas.getContext('2d');
  var wctx = waveCanvas.getContext('2d');
  var fw = freqCanvas.width, fh = freqCanvas.height;
  var ww = waveCanvas.width, wh = waveCanvas.height;

  fctx.clearRect(0,0,fw,fh);
  wctx.clearRect(0,0,ww,wh);

  var bars = 64;
  var bw = fw / bars;
  for (var i = 0; i < bars; i++) {
    var v = ((i * 37 + frame * 1.0) % 100) / 100;
    var h = v * fh * 0.8;
    var hue = Math.floor(((i / bars) * 360 + frame * 0.5) % 360);
    fctx.fillStyle = 'hsl(' + hue + ',70%,60%)';
    fctx.fillRect(i * bw, fh - h, bw * 0.85, h);

    fctx.fillStyle = 'rgba(255,255,255,0.02)';
    fctx.fillRect(i * bw, fh - h, bw * 0.85, 2);
  }
  frame += 0.5;
  animId = requestAnimationFrame(draw);
}

function startAnimation() {
  if (playing) return;
  playing = true;
  frame = 0;
  draw();
}

function stopAnimation() {
  playing = false;
  if (animId) cancelAnimationFrame(animId);
}

fileInput.addEventListener('change', function(e) {
  var f = e.target.files && e.target.files[0];
  if (!f) return;
  info.textContent = f.name;
  playPauseBtn.disabled = false;
});

playPauseBtn.addEventListener('click', function() {
  if (!playing) startAnimation(); else stopAnimation();
  playPauseBtn.textContent = playing ? 'Pause' : 'Play';
});

dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!f) return;
  fileInput.files = e.dataTransfer.files;
  info.textContent = f.name;
  playPauseBtn.disabled = false;
});

window.addEventListener('resize', resize);
window.addEventListener('load', resize);