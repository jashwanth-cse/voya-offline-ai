package com.voya.app.intelligence

/**
 * Model lifecycle states for the native VoyaIntelligenceModule.
 * Defined in RND.md Section 8.
 */
enum class ModelState {
    IDLE,
    LOADING_GENAI,
    GENAI_ACTIVE,
    LOADING_VISION,
    VISION_ACTIVE,
    RELEASING,
    ERROR;

    val isGenAiActive: Boolean
        get() = this == GENAI_ACTIVE

    val isVisionActive: Boolean
        get() = this == VISION_ACTIVE

    val isBusy: Boolean
        get() = this == LOADING_GENAI || this == LOADING_VISION || this == RELEASING
}
