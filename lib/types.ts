import { DESTEKLENEN_DOSYA_TURLERI } from './constants';

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
 * Dosya yükleme yanıtı
 */
export interface IDosyaYuklemeYaniti {
  dosyaId: string;
  ad: string;
  boyut: number;
  metinParcacigiSayisi: number;
}

/**
 * Dosya türü kontrol fonksiyonu (MIME türü veya dosya uzantısına göre esnek kontrol)
 */
export function desteklenenDosyaTuruMu(dosyaTuru: string, dosyaAdi?: string): boolean {
  if ((DESTEKLENEN_DOSYA_TURLERI as readonly string[]).includes(dosyaTuru)) {
    return true;
  }
  if (dosyaAdi) {
    const ext = dosyaAdi.toLowerCase();
    return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.txt');
  }
  return false;
}
