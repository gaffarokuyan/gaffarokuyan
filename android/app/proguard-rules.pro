# Oyunun JavaScript tarafından çağrılan yerel köprü
-keepattributes JavascriptInterface
-keepclassmembers class com.kervangame.app.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
