/**
 * API yanıtları için standart format
 */
export interface IApiYaniti<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Sohbet mesajı türleri
 */
export type ChatMesajTuru = 'kullanici' | 'asistan';

/**
 * Sohbet mesajı interface'i
 */
export interface IChatMesaji {
  id: string;
  tur: ChatMesajTuru;
  icerik: string;
  zaman: Date;
}

/**
 * Yüklenen dosya bilgileri
 */
export interface IYuklenenDosya {
  id: string;
  ad: string;
  boyut: number;
  tur: string;
  yuklenmeTarihi: Date;
  metinParcacigiSayisi: number;
}

/**
 * Döküman metin parçacığı
 */
export interface IDokumanParcacigi {
  id: string;
  dosyaId: string;
  metin: string;
  siraNo: number;
  vektor?: number[];
}

/**
 * Pinecone arama sonucu
 */
export interface IPineconeAramaSonucu {
  id: string;
  skor: number;
  metin: string;
  dosyaId: string;
}

/**
 * Dosya yükleme isteği
 */
export interface IDosyaYuklemeIstegi {
  dosya: File;
}

/**
 * Dosya yükleme yanıtı
 */
export interface IDosyaYuklemeYaniti {
  dosyaId: string;
  ad: string;
  boyut: number;
  metinParcacigiSayisi: number;
}

/**
 * Sohbet isteği
 */
export interface ISohbetIstegi {
  soru: string;
  dosyaId?: string;
}

/**
 * Sohbet yanıtı
 */
export interface ISohbetYaniti {
  cevap: string;
  kullanılanBaglamlar: IPineconeAramaSonucu[];
}

/**
 * Desteklenen dosya türleri
 */
export const DESTEKLENEN_DOSYA_TURLERI = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

/**
 * Dosya türü kontrol fonksiyonu
 */
export function desteklenenDosyaTuruMu(dosyaTuru: string): boolean {
  return DESTEKLENEN_DOSYA_TURLERI.includes(
    dosyaTuru as (typeof DESTEKLENEN_DOSYA_TURLERI)[number]
  );
}
