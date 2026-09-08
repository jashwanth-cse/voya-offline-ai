package com.voya.app.intelligence

import android.content.Context
import android.util.Log
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * GemmaInferenceEngine — Manages on-device Gemma 2B LLM inference using MediaPipe GenAI.
 * Features:
 *  - LlmInference instance lifecycle management
 *  - 60-second warm model cache with automatic release
 *  - Structured JSON travel intent parsing
 *  - Gemma prompt formatting with travel context injection
 *  - Robust offline heuristic fallback if weights are not yet present on disk
 */
class GemmaInferenceEngine(
    private val context: Context,
    private val scope: CoroutineScope,
    private val onAutoRelease: () -> Unit
) {

    companion object {
        private const val TAG = "GemmaInferenceEngine"
        private const val WARM_TIMEOUT_MS = 60000L // 60 seconds
        private const val MODEL_FILENAME = "gemma-2b-it-cpu-int4.bin"
    }

    private var llmInference: LlmInference? = null
    private var warmReleaseJob: Job? = null
    private var isInitialized = false

    /**
     * Resolves the on-device path for the Gemma 2B model weights.
     */
    fun getModelFile(): File? {
        val internalFile = File(context.filesDir, "models/$MODEL_FILENAME")
        if (internalFile.exists()) return internalFile

        val externalFile = context.getExternalFilesDir(null)?.let { File(it, "models/$MODEL_FILENAME") }
        if (externalFile != null && externalFile.exists()) return externalFile

        val tmpFile = File("/data/local/tmp/$MODEL_FILENAME")
        if (tmpFile.exists()) return tmpFile

        return null
    }

    /**
     * Checks if the model weights file exists locally.
     */
    fun isModelAvailable(): Boolean = getModelFile() != null

    /**
     * Initializes the MediaPipe LlmInference engine.
     */
    fun initialize(): Result<Unit> {
        return try {
            val modelFile = getModelFile()
            if (modelFile != null && modelFile.exists()) {
                Log.i(TAG, "Initializing MediaPipe LlmInference with weights from: ${modelFile.absolutePath}")
                val options = LlmInference.LlmInferenceOptions.builder()
                    .setModelPath(modelFile.absolutePath)
                    .setMaxTokens(512)
                    .setTemperature(0.2f)
                    .setTopK(40)
                    .build()
                llmInference = LlmInference.createFromOptions(context, options)
                isInitialized = true
                Log.i(TAG, "MediaPipe LlmInference initialized successfully.")
            } else {
                Log.w(TAG, "Model weight file '$MODEL_FILENAME' not found on device. Offline heuristic fallback active.")
                isInitialized = true
            }
            scheduleWarmReleaseTimer()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize MediaPipe GenAI engine", e)
            isInitialized = false
            Result.failure(e)
        }
    }

    /**
     * Schedules or resets the 60-second warm session timeout timer.
     */
    private fun scheduleWarmReleaseTimer() {
        warmReleaseJob?.cancel()
        warmReleaseJob = scope.launch(Dispatchers.Default) {
            delay(WARM_TIMEOUT_MS)
            Log.i(TAG, "Warm model session expired (60s). Auto-releasing Gemma from memory.")
            release()
            onAutoRelease.invoke()
        }
    }

    /**
     * Executes natural language query reasoning.
     */
    fun infer(query: String, contextJsonStr: String): Map<String, Any> {
        val startTime = System.currentTimeMillis()
        scheduleWarmReleaseTimer()

        val prompt = buildGemmaPrompt(query, contextJsonStr)

        val rawOutput: String = try {
            if (llmInference != null) {
                llmInference?.generateResponse(prompt) ?: runOfflineHeuristic(query, contextJsonStr)
            } else {
                runOfflineHeuristic(query, contextJsonStr)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Inference error or fallback invoked: ${e.message}")
            runOfflineHeuristic(query, contextJsonStr)
        }

        val latencyMs = System.currentTimeMillis() - startTime
        val parsedResult = parseGemmaResponse(rawOutput, query)

        return mapOf(
            "rawResponse" to rawOutput,
            "intent" to (parsedResult["intent"] ?: "explore"),
            "category" to (parsedResult["category"] ?: ""),
            "timeAvailableMinutes" to (parsedResult["time_available_minutes"] ?: -1),
            "energyLevel" to (parsedResult["energy_level"] ?: ""),
            "distancePreference" to (parsedResult["distance_preference"] ?: "any"),
            "reply" to (parsedResult["reply"] ?: rawOutput),
            "status" to "SUCCESS",
            "latencyMs" to latencyMs.toDouble(),
            "modelUsed" to (if (llmInference != null) "Gemma-2B-INT4" else "Offline-Heuristic-V1")
        )
    }

    /**
     * Releases model resources from memory.
     */
    fun release() {
        warmReleaseJob?.cancel()
        warmReleaseJob = null
        try {
            llmInference?.close()
        } catch (e: Exception) {
            Log.w(TAG, "Error closing LlmInference: ${e.message}")
        }
        llmInference = null
        isInitialized = false
        Log.i(TAG, "Gemma resources released.")
    }

    /**
     * Formats prompt with Gemma turn tokens according to RND.md Section 6.
     */
    private fun buildGemmaPrompt(query: String, contextJsonStr: String): String {
        return """
<start_of_turn>user
You are VOYA, an offline travel intelligence engine. Extract the structured travel intent and reply concisely.
User Query: "$query"
Active Travel Context: $contextJsonStr

Output format:
{
  "intent": "recommend_places" | "navigate" | "explore" | "food" | "general_info",
  "time_available_minutes": integer or null,
  "energy_level": "low" | "medium" | "high" or null,
  "preferences": ["tag1", "tag2"],
  "distance_preference": "nearby" | "any",
  "category": "attraction" | "restaurant" | "hotel" | "landmark" or null,
  "reply": "Brief helpful travel response"
}
<end_of_turn>
<start_of_turn>model
""".trimIndent()
    }

    /**
     * Extracts JSON block from Gemma output and maps fields.
     */
    private fun parseGemmaResponse(output: String, originalQuery: String): Map<String, Any> {
        val resultMap = mutableMapOf<String, Any>()
        try {
            val jsonStart = output.indexOf('{')
            val jsonEnd = output.lastIndexOf('}')
            if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                val jsonSubstring = output.substring(jsonStart, jsonEnd + 1)
                val json = JSONObject(jsonSubstring)

                if (json.has("intent")) resultMap["intent"] = json.getString("intent")
                if (json.has("time_available_minutes") && !json.isNull("time_available_minutes")) {
                    resultMap["time_available_minutes"] = json.getInt("time_available_minutes")
                }
                if (json.has("energy_level") && !json.isNull("energy_level")) {
                    resultMap["energy_level"] = json.getString("energy_level")
                }
                if (json.has("category") && !json.isNull("category")) {
                    resultMap["category"] = json.getString("category")
                }
                if (json.has("distance_preference")) {
                    resultMap["distance_preference"] = json.getString("distance_preference")
                }
                if (json.has("reply")) {
                    resultMap["reply"] = json.getString("reply")
                }
                return resultMap
            }
        } catch (_: Exception) {
            // Fallback parsing below
        }

        // Fallback: rule-based intent deduction if JSON structure was missing
        val (fallbackIntent, fallbackCat, reply) = deduceIntentRules(originalQuery)
        resultMap["intent"] = fallbackIntent
        resultMap["category"] = fallbackCat
        resultMap["reply"] = reply
        return resultMap
    }

    /**
     * Offline heuristic engine for zero-network rule extraction.
     */
    private fun runOfflineHeuristic(query: String, contextJsonStr: String): String {
        var destination = ""
        var energy = ""
        try {
            if (contextJsonStr.isNotBlank()) {
                val ctx = JSONObject(contextJsonStr)
                if (ctx.has("destination")) destination = ctx.getString("destination")
                if (ctx.has("energyLevel")) energy = ctx.getString("energyLevel")
            }
        } catch (_: Exception) {}

        val (intent, category, baseReply) = deduceIntentRules(query)
        val personalizedReply = if (destination.isNotBlank()) {
            "$baseReply (${destination})"
        } else {
            baseReply
        }

        val json = JSONObject()
        json.put("intent", intent)
        json.put("category", category)
        json.put("time_available_minutes", extractTimeMinutes(query))
        json.put("distance_preference", if (query.contains("near", ignoreCase = true) || query.contains("close", ignoreCase = true)) "nearby" else "any")
        json.put("preferences", JSONArray(extractPreferences(query)))
        if (energy.isNotBlank()) json.put("energy_level", energy)
        json.put("reply", personalizedReply)
        return json.toString()
    }

    private fun extractTimeMinutes(query: String): Int? {
        val q = query.lowercase()
        return when {
            q.contains("1 hour") || q.contains("one hour") -> 60
            q.contains("2 hour") || q.contains("two hour") || q.contains("2 hours") || q.contains("two hours") -> 120
            q.contains("3 hour") || q.contains("three hour") || q.contains("3 hours") -> 180
            q.contains("30 min") || q.contains("half hour") -> 30
            q.contains("quick") -> 45
            else -> null
        }
    }

    private fun extractPreferences(query: String): List<String> {
        val prefs = mutableListOf<String>()
        val q = query.lowercase()
        if (q.contains("history") || q.contains("historic") || q.contains("temple") || q.contains("palace") || q.contains("heritage")) {
            prefs.add("historical")
        }
        if (q.contains("nature") || q.contains("park") || q.contains("garden") || q.contains("lake") || q.contains("waterfall")) {
            prefs.add("nature")
        }
        if (q.contains("food") || q.contains("eat") || q.contains("dinner") || q.contains("lunch") || q.contains("snack") || q.contains("restaurant") || q.contains("cafe")) {
            prefs.add("food")
        }
        if (q.contains("shopping") || q.contains("market") || q.contains("bazaar")) {
            prefs.add("shopping")
        }
        return prefs
    }

    private fun deduceIntentRules(query: String): Triple<String, String, String> {
        val q = query.lowercase()
        return when {
            q.contains("eat") || q.contains("food") || q.contains("restaurant") || q.contains("cafe") || q.contains("dinner") || q.contains("lunch") -> {
                Triple("food", "restaurant", "Looking up top dining spots and local cuisine for you in your destination database.")
            }
            q.contains("hotel") || q.contains("stay") || q.contains("lodge") || q.contains("resort") -> {
                Triple("recommend_places", "hotel", "Found recommended places to stay in your destination pack.")
            }
            q.contains("near") || q.contains("around") || q.contains("close") || q.contains("directions") || q.contains("how to go") -> {
                Triple("navigate", "attraction", "Calculating nearest attractions and optimal routes from your location.")
            }
            q.contains("history") || q.contains("temple") || q.contains("monument") || q.contains("landmark") -> {
                Triple("recommend_places", "landmark", "Here are notable historical landmarks and cultural monuments to visit.")
            }
            else -> {
                Triple("recommend_places", "attraction", "Here are top recommended attractions matched with your trip preferences.")
            }
        }
    }
}
