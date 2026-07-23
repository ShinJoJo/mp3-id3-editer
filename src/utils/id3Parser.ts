import { ID3Writer } from 'browser-id3-writer';
import { ID3Metadata, LyricLine } from '../types';
import { parseLrcText, stringifyLrc } from './lrcParser';

/**
 * Native ID3v2 parser to read metadata & cover art & USLT lyrics from ArrayBuffer
 */
export function parseID3Tags(buffer: ArrayBuffer): { metadata: ID3Metadata; lyrics: LyricLine[] } {
  const defaultMeta: ID3Metadata = {
    title: '未命名歌曲',
    artist: '未知歌手',
    album: '未知专辑',
    year: new Date().getFullYear().toString(),
    genre: 'Pop',
    trackNumber: '1',
    composer: '',
  };

  let lyrics: LyricLine[] = [];

  try {
    const view = new DataView(buffer);
    // Check ID3 header magic "ID3"
    if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
      return { metadata: defaultMeta, lyrics };
    }

    const versionMajor = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
    const size =
      ((view.getUint8(6) & 0x7f) << 21) |
      ((view.getUint8(7) & 0x7f) << 14) |
      ((view.getUint8(8) & 0x7f) << 7) |
      (view.getUint8(9) & 0x7f);

    let offset = 10;
    const end = Math.min(offset + size, buffer.byteLength);

    while (offset < end - 10) {
      const frameId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );

      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      let frameSize = 0;
      if (versionMajor === 4) {
        frameSize =
          ((view.getUint8(offset + 4) & 0x7f) << 21) |
          ((view.getUint8(offset + 5) & 0x7f) << 14) |
          ((view.getUint8(offset + 6) & 0x7f) << 7) |
          (view.getUint8(offset + 7) & 0x7f);
      } else {
        frameSize = view.getUint32(offset + 4, false);
      }

      if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) break;

      const frameDataOffset = offset + 10;

      // Extract Text Frames (TIT2, TPE1, TALB, TYER, TCON, TRCK, TCOM)
      if (frameId.startsWith('T') && frameId !== 'TXXX') {
        const encoding = view.getUint8(frameDataOffset);
        const textStr = readID3String(buffer, frameDataOffset + 1, frameSize - 1, encoding);
        if (textStr) {
          switch (frameId) {
            case 'TIT2':
              defaultMeta.title = textStr;
              break;
            case 'TPE1':
              defaultMeta.artist = textStr;
              break;
            case 'TALB':
              defaultMeta.album = textStr;
              break;
            case 'TYER':
            case 'TDRC':
              defaultMeta.year = textStr.slice(0, 4);
              break;
            case 'TCON':
              defaultMeta.genre = textStr;
              break;
            case 'TRCK':
              defaultMeta.trackNumber = textStr;
              break;
            case 'TCOM':
              defaultMeta.composer = textStr;
              break;
          }
        }
      }

      // Extract Cover Art Frame (APIC)
      if (frameId === 'APIC') {
        const encoding = view.getUint8(frameDataOffset);
        let pos = frameDataOffset + 1;
        // Read Mime Type
        let mime = '';
        while (pos < frameDataOffset + frameSize && view.getUint8(pos) !== 0) {
          mime += String.fromCharCode(view.getUint8(pos));
          pos++;
        }
        pos++; // Skip null terminator
        pos++; // Skip picture type byte

        // Skip description string
        if (encoding === 1 || encoding === 2) {
          // UTF-16 with BOM (2 bytes null terminator)
          while (pos < frameDataOffset + frameSize - 1) {
            if (view.getUint16(pos, false) === 0) {
              pos += 2;
              break;
            }
            pos += 2;
          }
        } else {
          while (pos < frameDataOffset + frameSize && view.getUint8(pos) !== 0) {
            pos++;
          }
          pos++;
        }

        const imgData = buffer.slice(pos, frameDataOffset + frameSize);
        if (imgData.byteLength > 0) {
          defaultMeta.coverBuffer = imgData;
          defaultMeta.coverMime = mime || 'image/jpeg';
          const blob = new Blob([imgData], { type: defaultMeta.coverMime });
          defaultMeta.coverUrl = URL.createObjectURL(blob);
        }
      }

      // Extract Unsynchronized / Synchronized Lyrics Frame (USLT / SYLT)
      if (frameId === 'USLT' || frameId === 'SYLT') {
        const encoding = view.getUint8(frameDataOffset);
        // pos skips encoding (1) + lang (3)
        let pos = frameDataOffset + 4;
        // Skip descriptor
        if (encoding === 1 || encoding === 2) {
          while (pos < frameDataOffset + frameSize - 1) {
            if (view.getUint16(pos, false) === 0) {
              pos += 2;
              break;
            }
            pos += 2;
          }
        } else {
          while (pos < frameDataOffset + frameSize && view.getUint8(pos) !== 0) {
            pos++;
          }
          pos++;
        }

        const lrcContent = readID3String(buffer, pos, frameDataOffset + frameSize - pos, encoding);
        if (lrcContent) {
          lyrics = parseLrcText(lrcContent);
        }
      }

      offset += 10 + frameSize;
    }
  } catch (err) {
    console.warn('Error reading ID3 tags:', err);
  }

  return { metadata: defaultMeta, lyrics };
}

/**
 * Decode ID3 text strings with encoding handling (ISO-8859-1, UTF-16 LE/BE, UTF-8)
 */
function readID3String(buffer: ArrayBuffer, offset: number, length: number, encoding: number): string {
  if (length <= 0 || offset + length > buffer.byteLength) return '';
  const bytes = new Uint8Array(buffer, offset, length);

  try {
    if (encoding === 1 || encoding === 2) {
      // UTF-16
      const decoder = new TextDecoder('utf-16');
      return decoder.decode(bytes).replace(/\0/g, '').trim();
    } else if (encoding === 3) {
      // UTF-8
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes).replace(/\0/g, '').trim();
    } else {
      // ISO-8859-1 / GBK fallback
      try {
        const decoder = new TextDecoder('gbk');
        return decoder.decode(bytes).replace(/\0/g, '').trim();
      } catch {
        const decoder = new TextDecoder('iso-8859-1');
        return decoder.decode(bytes).replace(/\0/g, '').trim();
      }
    }
  } catch (e) {
    return '';
  }
}

/**
 * Write updated ID3 v2.3 metadata and lyrics into MP3 ArrayBuffer using browser-id3-writer
 */
export function buildTaggedMp3Blob(
  originalBuffer: ArrayBuffer,
  metadata: ID3Metadata,
  lyrics: LyricLine[]
): Blob {
  try {
    const writer = new ID3Writer(originalBuffer);

    // Basic ID3 v2.3 fields
    if (metadata.title) writer.setFrame('TIT2', metadata.title);
    if (metadata.artist) writer.setFrame('TPE1', [metadata.artist]);
    if (metadata.album) writer.setFrame('TALB', metadata.album);
    
    const yearVal = parseInt(metadata.year) || new Date().getFullYear();
    writer.setFrame('TYER', yearVal);

    if (metadata.genre) writer.setFrame('TCON', [metadata.genre]);
    if (metadata.trackNumber) writer.setFrame('TRCK', metadata.trackNumber);
    if (metadata.composer) writer.setFrame('TCOM', [metadata.composer]);

    // Embed Cover Artwork (APIC)
    if (metadata.coverBuffer && metadata.coverBuffer.byteLength > 0) {
      writer.setFrame('APIC', {
        type: 3, // Front cover
        data: metadata.coverBuffer,
        description: 'Album Cover',
        mimeType: metadata.coverMime || 'image/jpeg',
      });
    }

    // Embed Synchronized / Timestamped Lyrics (USLT frame in LRC format)
    if (lyrics && lyrics.length > 0) {
      const lrcText = stringifyLrc(lyrics, metadata.title, metadata.artist, metadata.album);
      writer.setFrame('USLT', {
        description: 'Lyrics',
        lyrics: lrcText,
        language: 'zho',
      });
    }

    writer.addTag();
    return writer.getBlob();
  } catch (err) {
    console.error('Failed to write ID3 tags:', err);
    // Return original audio blob if tagging fails
    return new Blob([originalBuffer], { type: 'audio/mp3' });
  }
}
