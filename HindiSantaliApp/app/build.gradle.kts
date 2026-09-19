plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.compose.compiler)
  alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.example.hindisantali"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.example.hindisantali"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
      compose = true
      aidl = false
      buildConfig = false
      shaders = false
    }

    packaging {
      resources {
        excludes += "/META-INF/{AL2.0,LGPL2.1}"
        excludes += "META-INF/native-image/**"
        excludes += "META-INF/INDEX.LIST"
        excludes += "META-INF/io.netty.versions.properties"
        excludes += "META-INF/*.kotlin_module"
        pickFirsts.add("META-INF/DEPENDENCIES")
        pickFirsts.add("META-INF/LICENSE")
        pickFirsts.add("META-INF/LICENSE.txt")
        pickFirsts.add("META-INF/NOTICE")
        pickFirsts.add("META-INF/NOTICE.txt")
      }
      jniLibs {
        pickFirsts.add("lib/**/libonnxruntime.so")
        pickFirsts.add("lib/**/libc++_shared.so")
      }
    }

    aaptOptions {
        noCompress += listOf("onnx", "bin", "vocab", "json", "model")
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
  val composeBom = platform(libs.androidx.compose.bom)
  implementation(composeBom)
  androidTestImplementation(composeBom)

  // Core Android dependencies
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.activity.compose)

  // Arch Components
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.viewmodel.compose)

  // Compose
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.compose.material3)
  // Tooling
  debugImplementation(libs.androidx.compose.ui.tooling)
  // Instrumented tests
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  debugImplementation(libs.androidx.compose.ui.test.manifest)

  // Local tests: jUnit, coroutines, Android runner
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)

  // Instrumented tests: jUnit rules and runners
  androidTestImplementation(libs.androidx.test.core)
  androidTestImplementation(libs.androidx.test.ext.junit)
  androidTestImplementation(libs.androidx.test.runner)
  androidTestImplementation(libs.androidx.test.espresso.core)

  // Navigation
  implementation(libs.androidx.navigation3.ui)
  implementation(libs.androidx.navigation3.runtime)
  implementation(libs.androidx.lifecycle.viewmodel.navigation3)

  // SherpaOnnx - offline Hindi ASR (stripped of libonnxruntime.so to prevent conflict)
  implementation(files("libs/sherpa-onnx-1.11.3-patched.aar"))

  // ONNX Runtime - for translation and TTS inference
  implementation(libs.onnxruntime.android)

  // SentencePiece tokenization - pure Java, no native libs needed
  implementation("io.github.eix128:sentencepiece4j:1.0.2")

  // TensorFlow Lite Support
}
