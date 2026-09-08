package com.voya.app.intelligence

import android.app.ActivityManager
import android.content.Context
import android.os.Debug
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Thread-safe lifecycle manager for on-device AI and Vision models.
 * Enforces the Single-Model Memory Policy (RND.md Section 8) using a Kotlin Mutex.
 */
class ModelLifecycleManager(private val context: Context) {

    private val mutex = Mutex()
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Volatile
    private var currentState: ModelState = ModelState.IDLE

    var onStateChanged: ((ModelState) -> Unit)? = null

    val gemmaEngine = GemmaInferenceEngine(context, scope) {
        updateState(ModelState.IDLE)
    }

    fun getState(): ModelState = currentState

    private fun updateState(newState: ModelState) {
        currentState = newState
        onStateChanged?.invoke(newState)
    }

    /**
     * Initializes GenAI (Gemma) model session.
     * Automatically releases Vision model if active before acquiring GenAI.
     */
    suspend fun acquireGenAI(): Result<Unit> = mutex.withLock {
        try {
            if (currentState == ModelState.GENAI_ACTIVE) {
                return Result.success(Unit)
            }

            if (currentState == ModelState.VISION_ACTIVE) {
                updateState(ModelState.RELEASING)
                // Release vision weights
                updateState(ModelState.IDLE)
            }

            updateState(ModelState.LOADING_GENAI)
            val initResult = gemmaEngine.initialize()
            if (initResult.isFailure) {
                updateState(ModelState.ERROR)
                return@withLock initResult
            }
            updateState(ModelState.GENAI_ACTIVE)
            Result.success(Unit)
        } catch (e: Exception) {
            updateState(ModelState.ERROR)
            Result.failure(e)
        }
    }

    /**
     * Releases the GenAI model session.
     */
    suspend fun releaseGenAI(): Result<Unit> = mutex.withLock {
        try {
            if (currentState == ModelState.GENAI_ACTIVE || currentState == ModelState.LOADING_GENAI) {
                updateState(ModelState.RELEASING)
                gemmaEngine.release()
                updateState(ModelState.IDLE)
            }
            Result.success(Unit)
        } catch (e: Exception) {
            updateState(ModelState.ERROR)
            Result.failure(e)
        }
    }

    /**
     * Initializes Vision model session.
     * Automatically releases GenAI model if active before acquiring Vision.
     */
    suspend fun acquireVision(): Result<Unit> = mutex.withLock {
        try {
            if (currentState == ModelState.VISION_ACTIVE) {
                return Result.success(Unit)
            }

            if (currentState == ModelState.GENAI_ACTIVE) {
                updateState(ModelState.RELEASING)
                gemmaEngine.release()
                updateState(ModelState.IDLE)
            }

            updateState(ModelState.LOADING_VISION)
            // Vision embedder initialization will hook here in Phase 9
            updateState(ModelState.VISION_ACTIVE)
            Result.success(Unit)
        } catch (e: Exception) {
            updateState(ModelState.ERROR)
            Result.failure(e)
        }
    }

    /**
     * Releases the Vision model session.
     */
    suspend fun releaseVision(): Result<Unit> = mutex.withLock {
        try {
            if (currentState == ModelState.VISION_ACTIVE || currentState == ModelState.LOADING_VISION) {
                updateState(ModelState.RELEASING)
                // Clean up Vision session
                updateState(ModelState.IDLE)
            }
            Result.success(Unit)
        } catch (e: Exception) {
            updateState(ModelState.ERROR)
            Result.failure(e)
        }
    }

    /**
     * Measures current device memory metrics in Megabytes.
     */
    fun getMemoryStats(): Map<String, Any> {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)

        val nativeHeapAllocatedMb = Debug.getNativeHeapAllocatedSize() / (1024 * 1024)
        val availMemMb = memoryInfo.availMem / (1024 * 1024)
        val totalMemMb = memoryInfo.totalMem / (1024 * 1024)
        val lowMemory = memoryInfo.lowMemory

        return mapOf(
            "nativeHeapAllocatedMb" to nativeHeapAllocatedMb,
            "availMemMb" to availMemMb,
            "totalMemMb" to totalMemMb,
            "lowMemory" to lowMemory,
            "modelState" to currentState.name
        )
    }
}
