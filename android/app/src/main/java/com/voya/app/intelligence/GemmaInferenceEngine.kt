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
        val parsedResult = parseGemmaResponse(rawOutput, query, contextJsonStr)

        return mapOf(
            "rawResponse" to rawOutput,
            "intent" to (parsedResult["intent"] ?: "explore"),
            "category" to (parsedResult["category"] ?: ""),
            "timeAvailableMinutes" to (parsedResult["time_available_minutes"] ?: -1),
            "budgetMax" to (parsedResult["budget_max"] ?: -1),
            "energyLevel" to (parsedResult["energy_level"] ?: ""),
            "distancePreference" to (parsedResult["distance_preference"] ?: "any"),
            "reply" to (parsedResult["reply"] ?: rawOutput),
            "suggestedQuestions" to (parsedResult["suggested_questions"] ?: emptyList<String>()),
            "status" to "SUCCESS",
            "latencyMs" to latencyMs.toDouble(),
            "modelUsed" to (if (llmInference != null) "Gemma-2B-INT4" else "Offline-Engine-V2")
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
     * Formats prompt with Gemma turn tokens and anti-hallucination boundaries.
     */
    private fun buildGemmaPrompt(query: String, contextJsonStr: String): String {
        return """
<start_of_turn>user
You are VOYA, a specialized offline AI travel companion.
Answer ONLY travel-related questions for the active destination. Do NOT hallucinate places from other cities or make up fictional details.

If the user query is off-topic (e.g. general knowledge, math, programming, non-travel topics), set intent="off_topic", politely explain your role as a travel guide for this destination, and suggest 3 travel questions the user can ask.

User Query: "$query"
Active Travel Context: $contextJsonStr

Output JSON format strictly:
{
  "intent": "recommend_places" | "food" | "navigate" | "explore" | "off_topic" | "general_info",
  "category": "attraction" | "restaurant" | "hotel" | "landmark" | null,
  "time_available_minutes": integer or null,
  "budget_max": integer or null,
  "energy_level": "low" | "medium" | "high" or null,
  "preferences": ["tag1", "tag2"],
  "distance_preference": "nearby" | "any",
  "reply": "Grounded helpful travel response",
  "suggested_questions": ["Question 1 about destination", "Question 2", "Question 3"]
}
<end_of_turn>
<start_of_turn>model
""".trimIndent()
    }

    /**
     * Extracts JSON block from Gemma output and maps fields.
     */
    private fun parseGemmaResponse(output: String, originalQuery: String, contextJsonStr: String): Map<String, Any> {
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
                if (json.has("budget_max") && !json.isNull("budget_max")) {
                    resultMap["budget_max"] = json.getInt("budget_max")
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
                if (json.has("suggested_questions")) {
                    val arr = json.getJSONArray("suggested_questions")
                    val list = mutableListOf<String>()
                    for (i in 0 until arr.length()) {
                        list.add(arr.getString(i))
                    }
                    resultMap["suggested_questions"] = list
                }
                return resultMap
            }
        } catch (_: Exception) {
            // Fallback parsing below
        }

        // Fallback: rule-based intent deduction if JSON structure was missing
        val parsedJson = JSONObject(runOfflineHeuristic(originalQuery, contextJsonStr))
        resultMap["intent"] = parsedJson.optString("intent", "explore")
        resultMap["category"] = parsedJson.optString("category", "")
        resultMap["time_available_minutes"] = parsedJson.optInt("time_available_minutes", -1)
        resultMap["budget_max"] = parsedJson.optInt("budget_max", -1)
        resultMap["reply"] = parsedJson.optString("reply", "")
        val arr = parsedJson.optJSONArray("suggested_questions")
        if (arr != null) {
            val list = mutableListOf<String>()
            for (i in 0 until arr.length()) list.add(arr.getString(i))
            resultMap["suggested_questions"] = list
        }
        return resultMap
    }

    /**
     * Offline heuristic engine for zero-network grounded rule extraction.
     */
    private fun runOfflineHeuristic(query: String, contextJsonStr: String): String {
        var destination = "your destination"
        var energy = ""
        try {
            if (contextJsonStr.isNotBlank()) {
                val ctx = JSONObject(contextJsonStr)
                if (ctx.has("destination") && ctx.getString("destination").isNotBlank()) {
                    destination = ctx.getString("destination")
                }
                if (ctx.has("energyLevel")) energy = ctx.getString("energyLevel")
            }
        } catch (_: Exception) {}

        val (intent, category, reply, suggestions) = deduceIntentAndSuggestions(query, destination)

        val json = JSONObject()
        json.put("intent", intent)
        json.put("category", category)
        json.put("time_available_minutes", extractTimeMinutes(query))
        json.put("budget_max", extractBudgetMax(query))
        json.put("distance_preference", if (query.contains("near", ignoreCase = true) || query.contains("close", ignoreCase = true)) "nearby" else "any")
        json.put("preferences", JSONArray(extractPreferences(query)))
        if (energy.isNotBlank()) json.put("energy_level", energy)
        json.put("reply", reply)
        json.put("suggested_questions", JSONArray(suggestions))
        return json.toString()
    }

    private fun extractBudgetMax(query: String): Int? {
        val q = query.lowercase()
        val regex = Regex("""(?:under|below|budget|less than|within|₹|rs\.?|inr)\s*(\d{2,5})""")
        val match = regex.find(q)
        if (match != null) {
            return match.groupValues[1].toIntOrNull()
        }
        if (q.contains("cheap") || q.contains("budget friendly")) return 300
        if (q.contains("luxury") || q.contains("fine dining")) return 2500
        return null
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

    private data class IntentAnalysis(
        val intent: String,
        val category: String,
        val reply: String,
        val suggestions: List<String>
    )

    private fun deduceIntentAndSuggestions(query: String, destination: String): IntentAnalysis {
        val q = query.lowercase()

        // Check for out-of-domain queries
        val isOffTopic = q.contains("who is ") || q.contains("python") || q.contains("code") ||
                q.contains("recipe") || q.contains("math") || q.contains("write an essay") ||
                q.contains("capital of") || q.contains("weather in tokyo") || q.contains("what is javascript")

        if (isOffTopic) {
            return IntentAnalysis(
                intent = "off_topic",
                category = "",
                reply = "I am your offline travel companion specialized exclusively for $destination. Here are travel questions I can help you with:",
                suggestions = listOf(
                    "What are the top attractions in $destination?",
                    "Where can I find famous local food in $destination?",
                    "Suggest a 2-hour historical tour in $destination"
                )
            )
        }

        return when {
            q.contains("eat") || q.contains("food") || q.contains("restaurant") || q.contains("cafe") || q.contains("dinner") || q.contains("lunch") || q.contains("breakfast") -> {
                IntentAnalysis(
                    intent = "food",
                    category = "restaurant",
                    reply = "Here are the top local restaurants and authentic cuisine spots in $destination:",
                    suggestions = listOf(
                        "Budget food under ₹300 in $destination",
                        "Famous traditional breakfast in $destination",
                        "Best dinner spots with high ratings"
                    )
                )
            }
            q.contains("hotel") || q.contains("stay") || q.contains("lodge") || q.contains("resort") -> {
                IntentAnalysis(
                    intent = "recommend_places",
                    category = "hotel",
                    reply = "Here are recommended accommodations and places to stay in $destination:",
                    suggestions = listOf(
                        "Top-rated hotels in $destination",
                        "Budget stays near center",
                        "Resorts and peaceful stays"
                    )
                )
            }
            q.contains("near") || q.contains("around") || q.contains("close") || q.contains("directions") || q.contains("how to go") -> {
                IntentAnalysis(
                    intent = "navigate",
                    category = "attraction",
                    reply = "Showing nearest places and key attractions around your current location in $destination:",
                    suggestions = listOf(
                        "Quick 30 min spots nearby",
                        "Walking tour from here",
                        "Famous landmarks within 5 km"
                    )
                )
            }
            q.contains("history") || q.contains("temple") || q.contains("monument") || q.contains("landmark") || q.contains("heritage") -> {
                IntentAnalysis(
                    intent = "recommend_places",
                    category = "landmark",
                    reply = "Here are notable historical landmarks and cultural monuments in $destination:",
                    suggestions = listOf(
                        "Oldest temples in $destination",
                        "2-hour heritage walking trail",
                        "Iconic photo spots and architecture"
                    )
                )
            }
            else -> {
                IntentAnalysis(
                    intent = "recommend_places",
                    category = "attraction",
                    reply = "Here are recommended highlights tailored for your trip in $destination:",
                    suggestions = listOf(
                        "Top 3 must-visit places in $destination",
                        "Best evening sunset spots",
                        "Local shopping and markets in $destination"
                    )
                )
            }
        }
    }
}
