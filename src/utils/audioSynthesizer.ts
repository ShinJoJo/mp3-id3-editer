import { ID3Metadata, LyricLine } from '../types';

/**
 * Synthesizes a demo audio buffer (a pleasant synth chord progression melody)
 * and returns AudioBuffer, Blob, and sample metadata + lyrics.
 */
export async function createDemoAudio(
  audioCtx: AudioContext
): Promise<{
  audioBuffer: AudioBuffer;
  arrayBuffer: ArrayBuffer;
  metadata: ID3Metadata;
  lyrics: LyricLine[];
}> {
  const sampleRate = audioCtx.sampleRate || 44100;
  const duration = 24; // 24 seconds demo track
  const numSamples = Math.floor(sampleRate * duration);
  const audioBuffer = audioCtx.createBuffer(2, numSamples, sampleRate);

  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);

  // Musical notes frequencies (C4, E4, G4, A4, B4, C5, D5, E5)
  const notes = [261.63, 329.63, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25];
  const chordProgression = [
    [261.63, 329.63, 392.0], // C major
    [220.0, 261.63, 329.63],  // A minor
    [174.61, 220.0, 261.63],  // F major
    [196.0, 246.94, 293.66],  // G major
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const measure = Math.floor(t / 3) % chordProgression.length;
    const currentChord = chordProgression[measure];

    // Harmony synth waves
    let sampleL = 0;
    let sampleR = 0;

    currentChord.forEach((freq) => {
      const wave = Math.sin(2 * Math.PI * freq * t) * 0.15;
      sampleL += wave;
      sampleR += wave;
    });

    // Melody lead
    const noteIndex = Math.floor(t * 2) % notes.length;
    const leadFreq = notes[noteIndex];
    const env = Math.exp(-3 * ((t * 2) % 1)); // Envelope decay
    const leadWave = Math.sin(2 * Math.PI * leadFreq * t) * 0.25 * env;

    // Beat pulse
    const beat = Math.exp(-15 * ((t * 2) % 0.5));
    const kick = Math.sin(2 * Math.PI * 60 * t) * 0.3 * beat;

    sampleL = (sampleL + leadWave + kick) * 0.5;
    sampleR = (sampleR + leadWave * 0.9 + kick) * 0.5;

    left[i] = sampleL;
    right[i] = sampleR;
  }

  // Create WAV/ArrayBuffer representation for ID3 parser/writer compatibility
  const wavArrayBuffer = audioBufferToWav(audioBuffer);

  // Sample SVG / Cover Art Canvas
  const coverCanvas = document.createElement('canvas');
  coverCanvas.width = 400;
  coverCanvas.height = 400;
  const ctx = coverCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#6366f1');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);

    // Decorative circle
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();

    // Text on Cover
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MP3 ID3 EDITER', 200, 190);
    ctx.font = '18px sans-serif';
    ctx.fillText('示例元数据专辑封面', 200, 230);
  }

  const coverDataUrl = coverCanvas.toDataURL('image/jpeg', 0.9);
  const coverBlob = await (await fetch(coverDataUrl)).blob();
  const coverBuffer = await coverBlob.arrayBuffer();

  const metadata: ID3Metadata = {
    title: '星海飞驰 (Starry Horizon)',
    artist: '声波乐团 (Acoustic Band)',
    album: '未来音轨 Vol.1',
    year: '2026',
    genre: 'Electronic / Synthwave',
    trackNumber: '01',
    composer: 'Google AI Studio',
    coverUrl: coverDataUrl,
    coverBuffer: coverBuffer,
    coverMime: 'image/jpeg',
  };

  const lyrics: LyricLine[] = [
    { id: 'lyric_0', time: 1.5, text: '♪ [前奏] 夜幕降临 星光闪烁' },
    { id: 'lyric_1', time: 4.8, text: '穿过浩瀚宇宙的每一个角落' },
    { id: 'lyric_2', time: 8.2, text: '节拍在心中跳动 旋律不息' },
    { id: 'lyric_3', time: 11.5, text: '感受声音与波形的完美契合' },
    { id: 'lyric_4', time: 15.0, text: '✨ MP3 ID3 Tag & Synced Lyrics Editor' },
    { id: 'lyric_5', time: 18.2, text: '实时波形频谱 拖拽时间标签' },
    { id: 'lyric_6', time: 21.5, text: '♪ [尾奏] 永恒的声音记忆' },
  ];

  return {
    audioBuffer,
    arrayBuffer: wavArrayBuffer,
    metadata,
    lyrics,
  };
}

/**
 * Convert AudioBuffer to WAV ArrayBuffer
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteLength = result.length * bytesPerSample;
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF chunk descriptor */
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  /* fmt sub-chunk */
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  /* data sub-chunk */
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return arrayBuffer;
}
