# Oyunun JavaScript tarafından çağrılan yerel köprü
-keepattributes JavascriptInterface
-keepclassmembers class com.karwangame.app.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
