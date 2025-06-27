/**
 * Pinecone istemcisini runtime'da başlatır
 * Vektör veritabanı işlemleri için kullanılır
 */
async function getPineconeClient() {
  const { Pinecone } = await import('@pinecone-database/pinecone');
  
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
}

/**
 * Pinecone index referansını alır
 * Döküman vektörlerini saklamak için kullanılır
 */
async function getPineconeIndex() {
  const pinecone = await getPineconeClient();
  return pinecone.index(
    process.env.PINECONE_INDEX_NAME!,
    process.env.PINECONE_HOST || undefined
  );
}

/**
 * Döküman metni parçacığını Pinecone'a kaydet
 * @param id - Benzersiz ID
 * @param metin - Orijinal metin parçacığı
 * @param vektor - Metin vektörü
 * @param dosyaId - Hangi dosyaya ait olduğu
 */
export async function dokumanParcaciginiKaydet(
  id: string,
  metin: string,
  vektor: number[],
  dosyaId: string
) {
  try {
    const pineconeIndex = await getPineconeIndex();
    
    await pineconeIndex.upsert([
      {
        id: id,
        values: vektor,
        metadata: {
          metin: metin,
          dosyaId: dosyaId,
          olusturmaTarihi: new Date().toISOString(),
        },
      },
    ]);
  } catch (hata) {
    console.error("Pinecone'a kaydetme hatası:", hata);
    throw new Error('Döküman parçacığı kaydedilemedi');
  }
}

/**
 * Benzer metin parçacıklarını Pinecone'dan arar
 * @param soruVektoru - Kullanıcı sorusunun vektörü
 * @param dosyaId - Hangi dosyada arama yapılacağı
 * @param topK - Kaç sonuç getirileceği (varsayılan: 5)
 * @returns Benzer metin parçacıkları
 */
export async function benzerParcaciklariAra(
  soruVektoru: number[],
  dosyaId?: string,
  topK: number = 5
) {
  try {
    const pineconeIndex = await getPineconeIndex();
    const aramaFiltresi = dosyaId ? { dosyaId } : undefined;

    const aramaSonucu = await pineconeIndex.query({
      vector: soruVektoru,
      topK: topK,
      includeMetadata: true,
      filter: aramaFiltresi,
    });

    return aramaSonucu.matches.map(eslesme => ({
      id: eslesme.id,
      skor: eslesme.score || 0,
      metin: (eslesme.metadata?.metin as string) || '',
      dosyaId: (eslesme.metadata?.dosyaId as string) || '',
    }));
  } catch (hata) {
    console.error('Pinecone araması hatası:', hata);
    throw new Error('Benzer parçacıklar aranırken hata oluştu');
  }
}
