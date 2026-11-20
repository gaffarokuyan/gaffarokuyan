# Karwan'ı Google Play'e yükleme rehberi

## Elinizdeki dosyalar

| Dosya | Ne işe yarar |
| --- | --- |
| `app-release.aab` | Play Console'a yüklenecek paket |
| `app-release.apk` | Kendi telefonunuza kurup denemek için |
| `kervan-upload.jks` | Yükleme anahtarı. **Kaybetmeyin, kimseyle paylaşmayın.** |
| `keystore.properties` | Anahtarın parolası. Anahtarla birlikte güvenli bir yerde saklayın. |

Anahtar ve parola depoya girmez (`.gitignore`). İkisini parola yöneticisine ya da şifreli bir yedeğe koyun. Play App Signing açık olduğu için anahtar kaybolursa Play Console'dan yükleme anahtarı sıfırlama istenebilir; yine de saklamak çok daha kolaydır.

## 1. Önce telefonda deneyin

`app-release.apk` dosyasını telefona atın, açın ve "bilinmeyen kaynaklardan yükleme"ye izin verin. Şunlara bakın:

- Açılış ekranında deve görünüyor, sonra oyun açılıyor.
- Geri tuşu: öğreticiyi, pazarı ve sekmeleri kapatıyor; dokuma tezgâhını yarıda bıraktırmıyor; en sonda uygulamayı arka plana alıyor.
- Zar atınca ve satış yapınca hafif titreşim var.
- Uygulamayı kapatıp açınca oyun kaldığı yerden devam ediyor.
- Uçak modunda da çalışıyor.

## 2. Geliştirici hesabı

1. play.google.com/console adresinde geliştirici hesabı açın (tek seferlik 25 ABD doları).
2. Kimlik doğrulamasını tamamlayın.
3. **Kişisel hesaplar için önemli:** Yeni kişisel hesaplar, üretime (herkese açık yayına) geçmeden önce en az 12 test kullanıcısıyla 14 gün kesintisiz kapalı test yapmak zorundadır. Bu yüzden ilk hedef "kapalı test" olmalı. Kurallar değişebilir; Play Console'un size gösterdiği şartı esas alın.

## 3. Uygulamayı oluşturun

Play Console → Uygulama oluştur:

- Ad: Karwan: İpek Yolu Tüccarları
- Varsayılan dil: Türkçe
- Uygulama mı oyun mu: Oyun
- Ücretsiz

## 4. Uygulama içeriği (zorunlu formlar)

- **Gizlilik politikası:** Herkese açık bir adres gerekir. `store/privacy-policy.md` metnini yayımlayın (size verdiğim gizlilik sayfasını Paylaş menüsünden herkese açık yapabilir ya da kendi sitenize koyabilirsiniz) ve adresi girin.
- **Reklamlar:** Hayır, reklam içermiyor.
- **Uygulama erişimi:** Tüm işlevler kısıtlama olmadan kullanılabilir.
- **İçerik derecelendirmesi:** Anketi doldurun. Kılıçlı "pusu" çizimi kansız, karikatür tarzı şiddet sayılabilir; gerçek parayla kumar yok, zar yalnızca oyun içi.
- **Hedef kitle:** 13 yaş ve üstü seçin. 13 yaş altını seçerseniz "Aileler" politikasının ek şartları devreye girer.
- **Veri güvenliği:** "Hiçbir kullanıcı verisi toplanmıyor veya paylaşılmıyor." Uygulamanın internet izni yok.
- Haber uygulaması, sağlık, finans, devlet uygulaması: Hayır.

## 5. Mağaza sayfası

`store/listing.md` dosyasındaki metinleri ve görselleri girin. İngilizceyi "Çeviri ekle" ile ekleyin.

## 6. Paketi yükleyin

1. Test → Kapalı test → Yeni sürüm oluştur.
2. Play App Signing'i kabul edin (varsayılan).
3. `app-release.aab` dosyasını yükleyin. Sürüm notu örneği: "İlk test sürümü."
4. Test kullanıcılarının e-posta adreslerini bir listeye ekleyin, katılım bağlantısını onlara gönderin.
5. 14 gün sonunda Play Console'dan üretim erişimi başvurusu yapın.

## Yeni sürüm çıkarmak

1. `android/app/build.gradle.kts` içinde `versionCode` değerini 1 artırın (2, 3, …), `versionName`'i güncelleyin.
2. Proje kökünde: `npm run android`
3. Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`

Bilgisayarınızda derlemek için: Node.js 22, JDK 17 veya üstü, Android SDK (Android Studio ile gelir) ve `android/keystore.properties` ile `android/kervan-upload.jks` dosyalarının `android/` klasöründe olması gerekir.

## Bilinmesi gerekenler

- `applicationId` = `com.karwangame.app`. İlk yüklemeden sonra **değiştirilemez**. Başka bir kimlik istiyorsanız (ör. kendi alan adınızla) ilk yüklemeden önce `android/app/build.gradle.kts` içinde değiştirin.
- Oyun dikey ekrana sabit. Android 16 büyük ekranlı cihazlarda (tablet, katlanabilir) bu sabitlemeyi yok sayar; oyun ortalanmış tek sütun olduğu için orada da kullanılabilir kalır.
- "Gün doğsun (+10 zar)" düğmesi şimdilik sınırsız ve ücretsiz. Bu, prototipteki zamanlayıcının yerini tutuyor.
