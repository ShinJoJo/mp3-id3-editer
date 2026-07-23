import { LyricLine } from '../types';

/**
 * Format seconds to [mm:ss.xx] timestamp string
 */
export function formatLrcTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '[00:00.00]';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const xx = String(ms).padStart(2, '0');

  return `[${mm}:${ss}.${xx}]`;
}

/**
 * Format seconds to mm:ss for display
 */
export function formatTimeShort(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Parse [mm:ss.xx] or [mm:ss:xx] or [mm:ss] to seconds number
 */
export function parseLrcTime(timeStr: string): number {
  const clean = timeStr.replace('[', '').replace(']', '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return 0;

  const mins = parseFloat(parts[0]) || 0;
  const secsParts = parts[1].split('.');
  const secs = parseFloat(secsParts[0]) || 0;
  const ms = secsParts[1] ? parseFloat(secsParts[1]) : 0;

  // Handle 2 digit vs 3 digit millisecond precision
  const fraction = secsParts[1]
    ? secsParts[1].length === 3
      ? ms / 1000
      : ms / 100
    : 0;

  return mins * 60 + secs + fraction;
}

/**
 * Parse a full .lrc file text content into LyricLine array
 */
export function parseLrcText(lrcText: string): LyricLine[] {
  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  lines.forEach((line, lineIndex) => {
    const matches = Array.from(line.matchAll(timeRegex));
    if (matches.length > 0) {
      // Extract lyrics text after all timestamp tags
      const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      matches.forEach((match) => {
        const timeStr = match[0];
        const timeSecs = parseLrcTime(timeStr);
        result.push({
          id: `lyric_${lineIndex}_${Math.random().toString(36).substr(2, 5)}`,
          time: timeSecs,
          text: text,
        });
      });
    }
  });

  // Sort lyrics by timestamp ascending
  result.sort((a, b) => a.time - b.time);

  // If no timestamp tags found, treat as plain text lines
  if (result.length === 0) {
    return parsePlainTextLyrics(lrcText, 180); // Default 3 min song duration estimate
  }

  return result;
}

/**
 * Parse plain text (no timestamp tags) and evenly distribute timestamps across song duration
 */
export function parsePlainTextLyrics(plainText: string, songDuration: number = 180): LyricLine[] {
  const rawLines = plainText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  const interval = songDuration > 0 ? (songDuration - 4) / Math.max(1, rawLines.length) : 3;

  return rawLines.map((text, index) => ({
    id: `txt_${index}_${Math.random().toString(36).substr(2, 5)}`,
    time: Math.max(0, Math.round((2 + index * interval) * 100) / 100),
    text: text,
  }));
}

/**
 * Convert LyricLine array back to .lrc text string format
 */
export function stringifyLrc(lyrics: LyricLine[], title?: string, artist?: string, album?: string): string {
  let output = '';
  if (title) output += `[ti:${title}]\n`;
  if (artist) output += `[ar:${artist}]\n`;
  if (album) output += `[al:${album}]\n`;
  output += `[by:MP3 ID3 Editer v1.0]\n\n`;

  const sorted = [...lyrics].sort((a, b) => a.time - b.time);
  sorted.forEach((line) => {
    output += `${formatLrcTime(line.time)}${line.text}\n`;
  });

  return output;
}
