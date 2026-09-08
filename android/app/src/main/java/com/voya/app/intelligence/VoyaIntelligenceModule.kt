package com.voya.app.intelligence

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.launch

/**
 * VoyaIntelligenceModule — React Native native bridge for on-device AI and Vision.
 * Implements the locked API from RND.md Section 8 and Phase 4 requirements.
 */
class VoyaIntelligenceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val lifecycleManager = ModelLifecycleManager(reactContext)

    init {
        lifecycleManager.onStateChanged = { state ->
            sendEvent("onModelStateChange", state.name)
        }
    }

    override fun getName(): String = "VoyaIntelligenceModule"

    private fun sendEvent(eventName: String, params: Any?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (_: Exception) {
            // Context might not be ready yet
        }
    }

    /**
     * Initializes on-device GenAI (Gemma) session.
     */
    @ReactMethod
    fun initializeGenAI(promise: Promise) {
        lifecycleManager.scope.launch {
            val result = lifecycleManager.acquireGenAI()
            result.onSuccess {
                promise.resolve("GENAI_ACTIVE")
            }.onFailure { error ->
                promise.reject("INIT_GENAI_FAILED", error.message, error)
            }
        }
    }

    /**
     * Executes travel query reasoning using on-device Gemma.
     */
    @ReactMethod
    fun processTravelQuery(query: String, contextJson: String, promise: Promise) {
        lifecycleManager.scope.launch {
            if (lifecycleManager.getState() != ModelState.GENAI_ACTIVE) {
                val acquire = lifecycleManager.acquireGenAI()
                if (acquire.isFailure) {
                    promise.reject("GENAI_NOT_READY", "Failed to acquire GenAI session: ${acquire.exceptionOrNull()?.message}")
                    return@launch
                }
            }

            try {
                val inferenceResult = lifecycleManager.gemmaEngine.infer(query, contextJson)
                val responseMap: WritableMap = Arguments.createMap().apply {
                    putString("rawResponse", inferenceResult["rawResponse"] as? String ?: "")
                    putString("reply", inferenceResult["reply"] as? String ?: "")
                    putString("intent", inferenceResult["intent"] as? String ?: "explore")
                    putString("category", inferenceResult["category"] as? String ?: "")
                    putInt("timeAvailableMinutes", (inferenceResult["timeAvailableMinutes"] as? Int) ?: -1)
                    putString("energyLevel", inferenceResult["energyLevel"] as? String ?: "")
                    putString("distancePreference", inferenceResult["distancePreference"] as? String ?: "any")
                    putString("status", inferenceResult["status"] as? String ?: "SUCCESS")
                    putDouble("latencyMs", (inferenceResult["latencyMs"] as? Double) ?: 0.0)
                    putString("modelUsed", inferenceResult["modelUsed"] as? String ?: "Offline-Engine")
                }
                promise.resolve(responseMap)
            } catch (e: Exception) {
                promise.reject("INFERENCE_ERROR", "Gemma query execution failed: ${e.message}", e)
            }
        }
    }

    /**
     * Initializes on-device Vision (MediaPipe) session.
     */
    @ReactMethod
    fun initializeVision(promise: Promise) {
        lifecycleManager.scope.launch {
            val result = lifecycleManager.acquireVision()
            result.onSuccess {
                promise.resolve("VISION_ACTIVE")
            }.onFailure { error ->
                promise.reject("INIT_VISION_FAILED", error.message, error)
            }
        }
    }

    /**
     * Identifies a landmark from a local image file using reference pack embeddings.
     */
    @ReactMethod
    fun identifyLandmark(imagePath: String, packPath: String, promise: Promise) {
        lifecycleManager.scope.launch {
            if (lifecycleManager.getState() != ModelState.VISION_ACTIVE) {
                val acquire = lifecycleManager.acquireVision()
                if (acquire.isFailure) {
                    promise.reject("VISION_NOT_READY", "Failed to acquire Vision session.")
                    return@launch
                }
            }

            // Phase 4 returns structured placeholder; Phase 9 connects MediaPipe Image Embedder
            val responseMap: WritableMap = Arguments.createMap().apply {
                putString("status", "SUCCESS")
                putString("landmarkId", "sample_landmark")
                putString("name", "Landmark Recognition (Phase 9)")
                putDouble("confidence", 0.95)
            }

            // Auto-release Vision immediately after inference as per Memory Policy (Rule 5)
            lifecycleManager.releaseVision()

            promise.resolve(responseMap)
        }
    }

    /**
     * Explicitly releases GenAI model from memory.
     */
    @ReactMethod
    fun releaseGenAI(promise: Promise) {
        lifecycleManager.scope.launch {
            val result = lifecycleManager.releaseGenAI()
            result.onSuccess {
                promise.resolve("IDLE")
            }.onFailure { error ->
                promise.reject("RELEASE_GENAI_FAILED", error.message, error)
            }
        }
    }

    /**
     * Explicitly releases Vision model from memory.
     */
    @ReactMethod
    fun releaseVision(promise: Promise) {
        lifecycleManager.scope.launch {
            val result = lifecycleManager.releaseVision()
            result.onSuccess {
                promise.resolve("IDLE")
            }.onFailure { error ->
                promise.reject("RELEASE_VISION_FAILED", error.message, error)
            }
        }
    }

    /**
     * Returns current model lifecycle state string.
     */
    @ReactMethod
    fun getModelState(promise: Promise) {
        promise.resolve(lifecycleManager.getState().name)
    }

    /**
     * Returns device memory stats and model state.
     */
    @ReactMethod
    fun getMemoryUsage(promise: Promise) {
        val stats = lifecycleManager.getMemoryStats()
        val map: WritableMap = Arguments.createMap().apply {
            putDouble("nativeHeapAllocatedMb", (stats["nativeHeapAllocatedMb"] as Long).toDouble())
            putDouble("availMemMb", (stats["availMemMb"] as Long).toDouble())
            putDouble("totalMemMb", (stats["totalMemMb"] as Long).toDouble())
            putBoolean("lowMemory", stats["lowMemory"] as Boolean)
            putString("modelState", stats["modelState"] as String)
        }
        promise.resolve(map)
    }
}
