export interface LyricLine {
  id: string;
  time: number; // in seconds
  text: string;
}

export interface ID3Metadata {
  title: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  trackNumber: string;
  composer: string;
  coverUrl?: string; // Data URL or Object URL for image preview
  coverBuffer?: ArrayBuffer; // Raw image byte buffer for ID3 writer
  coverMime?: string; // e.g. 'image/jpeg' or 'image/png'
}

export interface HistoryState {
  metadata: ID3Metadata;
  lyrics: LyricLine[];
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
