let audioCtx: AudioContext | null = null;
let alertInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playAlertBurst() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Low pulse (~200Hz) — felt more than heard
  const lowOsc = ctx.createOscillator();
  const lowGain = ctx.createGain();
  lowOsc.type = "sine";
  lowOsc.frequency.setValueAtTime(200, now);
  lowOsc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
  lowGain.gain.setValueAtTime(0.4, now);
  lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  lowOsc.connect(lowGain);
  lowGain.connect(ctx.destination);
  lowOsc.start(now);
  lowOsc.stop(now + 0.25);

  // Sharp high alert (~1000Hz → 1200Hz sweep)
  const highOsc = ctx.createOscillator();
  const highGain = ctx.createGain();
  highOsc.type = "square";
  highOsc.frequency.setValueAtTime(1000, now);
  highOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
  highGain.gain.setValueAtTime(0.25, now);
  highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  highOsc.connect(highGain);
  highGain.connect(ctx.destination);
  highOsc.start(now + 0.02);
  highOsc.stop(now + 0.22);

  // Second high ping
  const highOsc2 = ctx.createOscillator();
  const highGain2 = ctx.createGain();
  highOsc2.type = "square";
  highOsc2.frequency.setValueAtTime(1200, now + 0.28);
  highOsc2.frequency.exponentialRampToValueAtTime(900, now + 0.45);
  highGain2.gain.setValueAtTime(0.2, now + 0.28);
  highGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  highOsc2.connect(highGain2);
  highGain2.connect(ctx.destination);
  highOsc2.start(now + 0.28);
  highOsc2.stop(now + 0.45);
}

export function startAlert() {
  stopAlert();
  playAlertBurst();
  alertInterval = setInterval(playAlertBurst, 500);

  // Vibration pattern: 200ms on, 100ms off, 200ms on, 300ms off — repeat
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 300, 200, 100, 200, 300, 200, 100, 200]);
  }
}

export function stopAlert() {
  if (alertInterval !== null) {
    clearInterval(alertInterval);
    alertInterval = null;
  }
  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}
