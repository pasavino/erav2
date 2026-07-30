package com.easyrideafrica.erav2

import android.app.Activity
import android.app.AlertDialog
import android.os.Build
import android.os.Bundle
import android.util.Log

import androidx.activity.result.contract.ActivityResultContracts

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  private lateinit var appUpdateManager: AppUpdateManager
  private var updateReadyDialog: AlertDialog? = null

  private val installStateUpdatedListener = InstallStateUpdatedListener { state ->
    when (state.installStatus()) {
      InstallStatus.DOWNLOADED -> showUpdateReadyDialog()
      InstallStatus.FAILED -> Log.e(TAG, "Google Play update download failed.")
    }
  }

  private val updateResultLauncher = registerForActivityResult(
    ActivityResultContracts.StartIntentSenderForResult()
  ) { result ->
    if (result.resultCode != Activity.RESULT_OK) {
      Log.w(TAG, "Google Play update was cancelled or failed: ${result.resultCode}")
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme)
    super.onCreate(null)

    appUpdateManager = AppUpdateManagerFactory.create(this)
    appUpdateManager.registerListener(installStateUpdatedListener)

    checkForAvailableUpdate()
  }

  override fun onResume() {
    super.onResume()

    if (::appUpdateManager.isInitialized) {
      checkForDownloadedUpdate()
    }
  }

  override fun onDestroy() {
    if (::appUpdateManager.isInitialized) {
      appUpdateManager.unregisterListener(installStateUpdatedListener)
    }

    updateReadyDialog?.dismiss()
    updateReadyDialog = null

    super.onDestroy()
  }

  private fun checkForAvailableUpdate() {
    appUpdateManager.appUpdateInfo
      .addOnSuccessListener { appUpdateInfo ->
        if (
          appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
          appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
        ) {
          val updateStarted = appUpdateManager.startUpdateFlowForResult(
            appUpdateInfo,
            updateResultLauncher,
            AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build()
          )

          if (!updateStarted) {
            Log.w(TAG, "Google Play did not start the update flow.")
          }
        }
      }
      .addOnFailureListener { error ->
        Log.e(TAG, "Could not check for a Google Play update.", error)
      }
  }

  private fun checkForDownloadedUpdate() {
    appUpdateManager.appUpdateInfo
      .addOnSuccessListener { appUpdateInfo ->
        if (appUpdateInfo.installStatus() == InstallStatus.DOWNLOADED) {
          showUpdateReadyDialog()
        }
      }
      .addOnFailureListener { error ->
        Log.e(TAG, "Could not check the downloaded update status.", error)
      }
  }

  private fun showUpdateReadyDialog() {
    runOnUiThread {
      if (isFinishing || isDestroyed || updateReadyDialog?.isShowing == true) {
        return@runOnUiThread
      }

      updateReadyDialog = AlertDialog.Builder(this)
        .setTitle("Update ready")
        .setMessage("The new version has been downloaded. Restart the app to install it.")
        .setCancelable(false)
        .setPositiveButton("Restart now") { _, _ ->
          appUpdateManager.completeUpdate()
            .addOnFailureListener { error ->
              Log.e(TAG, "Could not complete the Google Play update.", error)
            }
        }
        .create()

      updateReadyDialog?.setOnDismissListener {
        updateReadyDialog = null
      }

      updateReadyDialog?.show()
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )
  }

  /**
   * Align the back button behavior with Android S
   * where moving root activities to background instead of finishing activities.
   * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
   */
  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        // For non-root activities, use the default implementation to finish them.
        super.invokeDefaultOnBackPressed()
      }
      return
    }

    // Use the default back button implementation on Android S
    // because it's doing more than [Activity.moveTaskToBack] in fact.
    super.invokeDefaultOnBackPressed()
  }

  companion object {
    private const val TAG = "MainActivity"
  }
}
