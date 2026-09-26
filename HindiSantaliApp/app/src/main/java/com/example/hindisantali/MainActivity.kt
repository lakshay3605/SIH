package com.example.hindisantali

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.example.hindisantali.asr.HindiSpeechRecognizerEngine
import com.example.hindisantali.tts.SantaliTtsEngine
import com.example.hindisantali.theme.HindiSantaliTheme

class MainActivity : ComponentActivity() {

    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* mic permission handled */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Request microphone permission on launch
        micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)

        setContent {
            HindiSantaliTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    SamvaadAppView()
                }
            }
        }
    }
}

/**
 * Robust asset resolver that serves assets from app/src/main/assets/www
 * Handles both relative and absolute paths cleanly.
 */
class SamvaadAssetsHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        val cleanPath = path.trimStart('/')
        val candidates = listOf(
            cleanPath,
            "www/$cleanPath",
            "www/assets/$cleanPath",
            if (cleanPath.startsWith("assets/")) "www/$cleanPath" else "www/assets/${cleanPath.removePrefix("assets/")}"
        ).distinct()

        for (candidate in candidates) {
            try {
                val stream = context.assets.open(candidate)
                val mimeType = when {
                    candidate.endsWith(".html") -> "text/html"
                    candidate.endsWith(".js") -> "application/javascript"
                    candidate.endsWith(".css") -> "text/css"
                    candidate.endsWith(".png") -> "image/png"
                    candidate.endsWith(".jpg") || candidate.endsWith(".jpeg") -> "image/jpeg"
                    candidate.endsWith(".svg") -> "image/svg+xml"
                    candidate.endsWith(".json") -> "application/json"
                    candidate.endsWith(".woff2") -> "font/woff2"
                    candidate.endsWith(".woff") -> "font/woff"
                    candidate.endsWith(".ttf") -> "font/ttf"
                    else -> "application/octet-stream"
                }
                return WebResourceResponse(mimeType, "UTF-8", stream)
            } catch (_: Exception) {
                // Try next candidate
            }
        }
        Log.w("SamvaadWeb", "Asset not found: $path (tried: $candidates)")
        return null
    }
}

class SamvaadAndroidBridge(
    private val activity: ComponentActivity?
) {
    private var webViewRef: java.lang.ref.WeakReference<WebView>? = null
    private val ttsEngine by lazy {
        activity?.let { SantaliTtsEngine(it).apply { initialize() } }
    }
    private val asrEngine by lazy {
        activity?.let { HindiSpeechRecognizerEngine(it) }
    }

    fun setWebView(webView: WebView) {
        webViewRef = java.lang.ref.WeakReference(webView)
    }

    @android.webkit.JavascriptInterface
    fun isNativeApp(): Boolean = true

    @android.webkit.JavascriptInterface
    fun speakSantali(text: String) {
        activity?.runOnUiThread {
            try {
                ttsEngine?.speakAsync(text, isOlChiki = true)
            } catch (e: Exception) {
                Log.e("SamvaadBridge", "speakSantali error: ${e.message}")
            }
        }
    }

    @android.webkit.JavascriptInterface
    fun speakHindi(text: String) {
        activity?.runOnUiThread {
            try {
                ttsEngine?.speakAsync(text, isOlChiki = false)
            } catch (e: Exception) {
                Log.e("SamvaadBridge", "speakHindi error: ${e.message}")
            }
        }
    }

    @android.webkit.JavascriptInterface
    fun stopSpeech() {
        activity?.runOnUiThread {
            try {
                ttsEngine?.release()
                ttsEngine?.initialize()
            } catch (_: Exception) {}
        }
    }

    @android.webkit.JavascriptInterface
    fun startNativeSpeechRecognition(speaker: String) {
        val act = activity ?: return
        act.runOnUiThread {
            val wv = webViewRef?.get()
            val asr = asrEngine
            if (asr == null || !asr.isAvailable()) {
                wv?.evaluateJavascript("window.onNativeSpeechError && window.onNativeSpeechError('recognition_unavailable');", null)
                return@runOnUiThread
            }
            act.lifecycleScope.launch {
                try {
                    val result = asr.recognize(timeoutMs = 4500)
                    if (result.isNotBlank()) {
                        val clean = result.replace("'", "\\'").replace("\"", "\\\"").replace("\n", " ").trim()
                        wv?.evaluateJavascript("window.onNativeSpeechResult && window.onNativeSpeechResult('$clean', '$speaker');", null)
                    } else {
                        wv?.evaluateJavascript("window.onNativeSpeechEnd && window.onNativeSpeechEnd('$speaker');", null)
                    }
                } catch (e: Exception) {
                    Log.w("SamvaadBridge", "ASR error: ${e.message}")
                    val msg = e.message?.replace("'", "") ?: "error"
                    wv?.evaluateJavascript("window.onNativeSpeechError && window.onNativeSpeechError('$msg');", null)
                }
            }
        }
    }

    @android.webkit.JavascriptInterface
    fun stopNativeSpeechRecognition() {
        activity?.runOnUiThread {
            try {
                asrEngine?.stopListening()
                asrEngine?.destroy()
                val wv = webViewRef?.get()
                wv?.evaluateJavascript("window.onNativeSpeechEnd && window.onNativeSpeechEnd('');", null)
            } catch (_: Exception) {}
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SamvaadAppView() {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }

    BackHandler(enabled = true) {
        if (webViewInstance?.canGoBack() == true) {
            webViewInstance?.goBack()
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            val act = context as? ComponentActivity
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                setBackgroundColor(Color.parseColor("#FAF7EE"))

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    mediaPlaybackRequiresUserGesture = false
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    useWideViewPort = true
                    loadWithOverviewMode = true
                }

                val bridge = SamvaadAndroidBridge(act)
                bridge.setWebView(this)
                addJavascriptInterface(bridge, "AndroidBridge")

                val assetLoader = WebViewAssetLoader.Builder()
                    .setDomain("appassets.androidplatform.net")
                    .addPathHandler("/assets/", SamvaadAssetsHandler(context))
                    .build()

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        request?.grant(request.resources)
                    }

                    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                        Log.d("SamvaadWeb", "${consoleMessage?.message()} [line ${consoleMessage?.lineNumber()}]")
                        return true
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest
                    ): WebResourceResponse? {
                        val response = assetLoader.shouldInterceptRequest(request.url)
                        if (response != null) return response
                        return super.shouldInterceptRequest(view, request)
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): Boolean {
                        return false
                    }
                }

                loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
                webViewInstance = this
            }
        },
        update = { webView ->
            webViewInstance = webView
        }
    )
}
