package com.kervangame.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.core.graphics.toColorInt
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

/**
 * Kervan'ın Android kabuğu. Oyun, uygulamanın içindeki assets/ klasöründen
 * internetsiz yüklenir; kayıt WebView'in yerel depolamasında tutulur.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var pageReady = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        splash.setKeepOnScreenCondition { !pageReady }

        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )

        // https://appassets.androidplatform.net/assets/... adresini uygulama içi dosyalara bağlar.
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(SKY)
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isHapticFeedbackEnabled = true
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                textZoom = 100
            }
            addJavascriptInterface(Bridge(), "KervanNative")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                // Oyun dışındaki bağlantılar tarayıcıda açılır.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == WebViewAssetLoader.DEFAULT_DOMAIN) return false
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                    return true
                }

                override fun onPageFinished(view: WebView, url: String) {
                    pageReady = true
                }
            }
        }

        // Sistem çubuklarının arkası oyunun renkleriyle boyanır, oyun çubukların arasına sığar.
        val navBand = View(this).apply { setBackgroundColor(DOCK) }
        val root = FrameLayout(this).apply {
            setBackgroundColor(SKY)
            addView(webView, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            addView(navBand, FrameLayout.LayoutParams(MATCH_PARENT, 0, Gravity.BOTTOM))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            webView.layoutParams = (webView.layoutParams as FrameLayout.LayoutParams).apply {
                setMargins(bars.left, bars.top, bars.right, bars.bottom)
            }
            navBand.layoutParams = (navBand.layoutParams as FrameLayout.LayoutParams).apply { height = bars.bottom }
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)

        // Geri tuşu önce oyundaki pencereyi kapatır; oyun "işim yok" derse uygulama arka plana geçer.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("window.kervanBack ? window.kervanBack() : false") { handled ->
                    if (handled != "true") moveTaskToBack(true)
                }
            }
        })

        webView.loadUrl(START_URL)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    /** Oyunun JavaScript tarafından çağrılır: window.KervanNative.haptic("roll" | "gain" | "tick"). */
    inner class Bridge {
        @JavascriptInterface
        fun haptic(kind: String) {
            val effect = when (kind) {
                "gain" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.VIRTUAL_KEY
                "roll" -> HapticFeedbackConstants.VIRTUAL_KEY
                else -> HapticFeedbackConstants.CLOCK_TICK
            }
            webView.post { webView.performHapticFeedback(effect) }
        }
    }

    private companion object {
        const val START_URL = "https://${WebViewAssetLoader.DEFAULT_DOMAIN}/assets/index.html"
        val SKY = "#121842".toColorInt()
        val DOCK = "#1A1339".toColorInt()
    }
}
