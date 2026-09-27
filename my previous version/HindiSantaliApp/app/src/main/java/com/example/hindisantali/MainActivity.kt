package com.example.hindisantali

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.material3.Surface
import com.example.hindisantali.theme.HindiSantaliTheme
import com.example.hindisantali.ui.main.MainScreen

class MainActivity : ComponentActivity() {

    // Request RECORD_AUDIO at runtime (required for Android 6+)
    private val micPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* granted or denied — MainScreen handles the error state */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Request microphone permission immediately on first launch
        micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)

        setContent {
            HindiSantaliTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MainScreen()
                }
            }
        }
    }
}
