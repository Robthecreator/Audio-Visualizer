const fileInput = document.getElementById('file');
const playPauseBtn = document.getElementById('playPause');
const info = document.getElementById('info');
const dropZone = document.getElementById('dropZone');
const freqCanvas = document.getElementById('freqCanvas');
const waveCanvas = document.getElementById('waveCanvas');

var animId = null;
var playing = false;
var frame = 0;
var currentTime = 0;
var startTime = 0;

var audioContext = null;
var audioSource = null;
var analyser = null;
var frequencyData = null;
var smoothedFrequencyData = null;
var audioBuffer = null;

function resize() {
  var pixelRatio = window.devicePixelRatio || 1;
  var rect = dropZone.getBoundingClientRect();
  
  freqCanvas.width = Math.floor(rect.width * pixelRatio);
  freqCanvas.height = Math.floor(rect.height * pixelRatio);
  waveCanvas.width = freqCanvas.width;
  waveCanvas.height = freqCanvas.height;
  
  freqCanvas.style.width = rect.width + 'px';
  freqCanvas.style.height = rect.height + 'px';
  waveCanvas.style.width = rect.width + 'px';
  waveCanvas.style.height = rect.height + 'px';
}

function setupAudio() {
  if (audioContext) return;
  
  try {
    var ContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new ContextClass();
    
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    
    var binCount = analyser.frequencyBinCount;
    frequencyData = new Uint8Array(binCount);
    smoothedFrequencyData = new Uint8Array(binCount);
    
  } catch (error) {
    console.error('Error setting up audio:', error);
  }
}

function loadAudioFile(file) {
  setupAudio();
  
  if (!audioContext) return;
  
  currentTime = 0;
  
  var reader = new FileReader();
  reader.onload = function(event) {
    var arrayBuffer = event.target.result;
    
    audioContext.decodeAudioData(arrayBuffer, function(decodedBuffer) {
      audioBuffer = decodedBuffer;
      console.log('Audio loaded: ' + decodedBuffer.duration.toFixed(2) + ' seconds');
    }, function(error) {
      console.error('Error decoding audio:', error);
    });
  };
  
  reader.readAsArrayBuffer(file);
}

function draw() {
  var canvas = freqCanvas;
  var context = canvas.getContext('2d');
  var width = canvas.width;
  var height = canvas.height;
  
  context.clearRect(0, 0, width, height);
  
  if (analyser) {
    analyser.getByteFrequencyData(frequencyData);
    
    for (var i = 0; i < frequencyData.length; i++) {
      var smoothing = 0.85;
      smoothedFrequencyData[i] = smoothedFrequencyData[i] * smoothing + frequencyData[i] * (1 - smoothing);
    }
  }
  
  var barCount = 32;
  var barWidth = width / barCount;
  
  var startBin = Math.floor((100 / 22050) * smoothedFrequencyData.length);
  var maxBin = Math.floor(smoothedFrequencyData.length * 0.5);
  var availableBins = maxBin - startBin;
  
  for (var i = 0; i < barCount; i++) {
    var binStart = Math.floor(startBin + (i / barCount) * availableBins);
    var binEnd = Math.floor(startBin + ((i + 1) / barCount) * availableBins);
    
    var sum = 0;
    var count = 0;
    
    for (var bin = binStart; bin < binEnd; bin++) {
      if (bin < smoothedFrequencyData.length) {
        sum += smoothedFrequencyData[bin];
        count++;
      }
    }
    
    var average = count > 0 ? sum / count : 0;
    var value = average / 255;
    var barHeight = Math.pow(value, 0.6) * height * 0.8;
    
    var hue = (i / barCount * 360 + frame * 0.5) % 360;
    context.fillStyle = 'hsl(' + hue + ', 70%, 60%)';
    context.fillRect(i * barWidth, height - barHeight, barWidth * 0.85, barHeight);
    
    context.fillStyle = 'rgba(255, 255, 255, 0.02)';
    context.fillRect(i * barWidth, height - barHeight, barWidth * 0.85, 2);
  }
  
  frame += 0.5;
  animId = requestAnimationFrame(draw);
}

function play() {
  if (playing || !audioBuffer) return;
  
  playing = true;
  frame = 0;
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);
  
  startTime = audioContext.currentTime;
  audioSource.start(0, currentTime);
  
  audioSource.onended = function() {
    if (playing) {
      playing = false;
      playPauseBtn.textContent = 'Play';
      currentTime = 0;
    }
  };
  
  draw();
}

function pause() {
  if (!playing) return;
  
  playing = false;
  
  if (audioSource) {
    var elapsed = audioContext.currentTime - startTime;
    currentTime += elapsed;
    
    if (currentTime >= audioBuffer.duration) {
      currentTime = 0;
    }
    
    audioSource.stop();
    audioSource = null;
  }
  
  if (animId) {
    cancelAnimationFrame(animId);
  }
}

fileInput.addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  info.textContent = file.name;
  loadAudioFile(file);
  playPauseBtn.disabled = false;
});

playPauseBtn.addEventListener('click', function() {
  if (!playing) {
    play();
    playPauseBtn.textContent = 'Pause';
  } else {
    pause();
    playPauseBtn.textContent = 'Play';
  }
});

dropZone.addEventListener('dragover', function(event) {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(event) {
  event.preventDefault();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(event) {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  
  var file = event.dataTransfer.files[0];
  if (!file) return;
  
  fileInput.files = event.dataTransfer.files;
  info.textContent = file.name;
  loadAudioFile(file);
  playPauseBtn.disabled = false;
});

window.addEventListener('resize', resize);
window.addEventListener('load', resize);