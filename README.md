# Karwan

İpek Yolu'nda geçen sosyal zar-ticaret oyununun oynanabilir prototipi.

## Oyun döngüsü

1. **Zar at:** Kervan 24 duraklı yol halkasında ilerler. Şian'dan her geçiş bir seferdir ve han geliri getirir.
2. **Pazarda al-sat:** Altı şehirde dört mal (ipek, baharat, çay, kilim) işlem görür. Fiyat stoka bağlıdır; sen ve rakip kervanlar aldıkça yükselir, sattıkça düşer.
3. **Tezgâhta doku:** Dokuma bulmacasını ne kadar az iplik bekleterek bitirirsen bir sonraki pazardaki satış çarpanın o kadar yüksek olur (×1,25 / ×1,5 / ×2). İki yıldız ve üstü albüme bir motif ekler.
4. **Pusudan sakın:** Rakip kervanlar yük çalar; handan tutulan muhafız bir pusuyu püskürtür.
5. **Hanı büyüt:** Her kat kervan kapasitesini ve sefer gelirini artırır. Beşinci kat Büyük Han'dır.

## Prototipte olmayanlar

- Gerçek çok oyunculu yapı yok. Rakip kervanlar ve pusular yerel botlarla taklit ediliyor.
- Ortak kervan, sezon rotaları ve mağaza yok. "Gün doğsun" düğmesi zar yenileme zamanlayıcısının yerini tutuyor.
- Ekonomi sayıları ilk tahmindir, dengelenmedi.

## Çalıştırma

```bash
npm install
npm test        # kural testleri
npm run build   # dist/index.html üretir
npm run dev     # derler ve yerelde sunar
```

## Yapı

| Dosya | İçerik |
| --- | --- |
| `src/game.js` | Oyun kuralları: yol, pazar, botlar, han, albüm. Arayüzden bağımsız. |
| `src/loom.js` | Dokuma bulmacası: üretici, çözücü, yıldız hesabı. |
| `src/ui.js`, `src/style.css` | Tek ekranlık web arayüzü. |
| `tests/` | Kural testleri (`node --test`). |
| `build.mjs` | Her şeyi tek HTML dosyasına paketler. |

## Android

`android/` klasörü oyunu internetsiz çalıştıran yerel bir Android uygulamasıdır (Kotlin, WebView). Oyun dosyaları ve yazı tipleri uygulamanın içine paketlenir; internet izni yoktur.

```bash
npm run android   # oyunu derler, imzalı AAB ve APK üretir
```

İmza anahtarı (`android/kervan-upload.jks`) ve parolası (`android/keystore.properties`) depoya girmez. Mağaza metinleri, görseller, gizlilik politikası ve yükleme adımları `store/` klasöründedir; başlangıç noktası `store/PLAY-STORE-REHBERI.md`.
