import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Yükleme anahtarı android/keystore.properties dosyasından ya da ortam değişkenlerinden okunur.
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun secret(key: String, env: String): String? = keystoreProps.getProperty(key) ?: System.getenv(env)

android {
    namespace = "com.karwangame.app"
    compileSdk = 36

    defaultConfig {
        // Mağazaya ilk yüklemeden sonra applicationId bir daha değiştirilemez.
        applicationId = "com.karwangame.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    signingConfigs {
        create("release") {
            secret("storeFile", "KARWAN_KEYSTORE")?.let { path ->
                storeFile = rootProject.file(path)
                storePassword = secret("storePassword", "KARWAN_KEYSTORE_PASSWORD")
                keyAlias = secret("keyAlias", "KARWAN_KEY_ALIAS")
                keyPassword = secret("keyPassword", "KARWAN_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            val release = signingConfigs.getByName("release")
            if (release.storeFile != null) signingConfig = release
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Türkçe ve İngilizce metinler her cihaza birlikte gelsin.
    bundle { language { enableSplit = false } }
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.webkit:webkit:1.14.0")
}

val checkGameAssets by tasks.registering {
    doLast {
        require(file("src/main/assets/index.html").exists()) {
            "Oyun dosyaları yok. Önce proje kökünde `npm run build` çalıştırın."
        }
    }
}
tasks.named("preBuild") { dependsOn(checkGameAssets) }
