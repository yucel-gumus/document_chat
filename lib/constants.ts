/**
 * Proje genelindeki sabitler (Constants)
 */

// Dosya yükleme limitleri
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB_LABEL = '10MB';

// Döküman işleme ve API concurrency limitleri
export const CHUNK_WORD_COUNT = 500;
export const UPLOAD_CONCURRENCY_LIMIT = 5;

// Desteklenen dosya MIME türleri
export const DESTEKLENEN_DOSYA_TURLERI = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export type DesteklenenDosyaTuru = (typeof DESTEKLENEN_DOSYA_TURLERI)[number];

// Kullanıcı arayüzünde gösterilecek format etiketleri
export const SUPPORTED_FILE_EXTENSIONS = '.pdf,.docx,.txt';
export const SUPPORTED_FILE_TYPES_LABEL = 'PDF, Word (.docx) veya metin (.txt)';
