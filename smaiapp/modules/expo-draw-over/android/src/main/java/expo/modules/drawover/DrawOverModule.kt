package expo.modules.drawover

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import org.json.JSONObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DrawOverModule : Module() {
    override fun definition() = ModuleDefinition {

        Name("DrawOverNativeModule")
        Function("checkPermission") {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                appContext.reactContext?.let { Settings.canDrawOverlays(it) } ?: false
            } else {
                true
            }
        }

        Function("requestPermission") {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val context = appContext.reactContext
                    ?: throw IllegalStateException("Android context is unavailable")
                if (!Settings.canDrawOverlays(context)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${context.packageName}")
                    )
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)
                    false
                } else {
                    true
                }
            } else {
                true
            }
        }

        // ===== FLOATING BUBBLE CONTROLS =====

        Function("prepareFloatingBubbleService") {
            val context = appContext.reactContext
                ?: throw IllegalStateException("Android context is unavailable")
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)) {
                FloatingBubbleService.prepare(context)
                true
            } else {
                false
            }
        }
        
        Function("startFloatingBubble") {
            FloatingBubbleService.start(appContext.reactContext!!)
            true
        }
        
        Function("stopFloatingBubble") {
            FloatingBubbleService.stop(appContext.reactContext!!)
            true
        }
        
        Function("isFloatingBubbleShowing") {
            FloatingBubbleService.isShowing()
        }
        
        Function("updateBubbleBadge") { count: Int ->
            FloatingBubbleService.updateBadge(appContext.reactContext!!, count)
            true
        }
        
        Function("showBubbleRipple") {
            FloatingBubbleService.showRipple(appContext.reactContext!!)
            true
        }
        AsyncFunction("showRideCard") { json: String ->
            FloatingBubbleService.showRideCard(appContext.reactContext!!, json)
            true
        }
        AsyncFunction("showOverlay") { data: Map<String, Any?> ->
            FloatingBubbleService.showRideCard(
                appContext.reactContext!!,
                JSONObject(data).toString()
            )
            true
        }
        Function("notifyAppForeground") {
            FloatingBubbleService.notifyAppForeground(appContext.reactContext!!)
            true
        }

        Function("notifyAppBackground") {
            FloatingBubbleService.notifyAppBackground(appContext.reactContext!!)
            true
        }

        AsyncFunction("hideOverlay") {
            FloatingBubbleService.stop(appContext.reactContext!!)
        }

        Function("isOverlayShowing") {
            FloatingBubbleService.isShowing()
        }
    }
}