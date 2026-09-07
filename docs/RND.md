# VOYA — R&D and Development Plan

> **Status:** Source of Truth
> **Rule:** Follow phases sequentially. Do not skip ahead. Complete and validate each phase before starting the next.

---

# 1. Product Definition

## VOYA

**Tagline:** Your destination. In your pocket.

VOYA is an offline-first AI travel companion that prepares a smartphone for a destination before a trip.

The user selects a destination and travel dates. VOYA downloads a **Destination Intelligence Pack** containing curated destination data. During the trip, the phone acts as a local guide without requiring internet connectivity.

### Core capabilities

* Offline destination discovery
* Offline GPS-based navigation
* On-device AI travel assistant
* Context-aware recommendations
* Adaptive trip planning
* Multilingual guidance
* Offline landmark identification

### Core differentiator

> Google Maps downloads the map. VOYA downloads the intelligence of the destination.

VOYA is not an itinerary planner. It is a destination-aware AI companion that understands where the traveller is, what they want, and what is available around them.

---

# 2. Development Principles

1. **Offline-first**

   * Core travel experience must work without internet after downloading a destination pack.

2. **Phone-first**

   * Features should leverage smartphone capabilities including GPS, camera, microphone, and on-device AI.

3. **AI where necessary**

   * LLM handles natural language understanding and reasoning.
   * Deterministic algorithms handle filtering, ranking, routing, and calculations.

4. **Native execution for ML**

   * Heavy ML inference must not run in the JavaScript runtime.

5. **Single heavy model policy**

   * GenAI and Vision models must never remain active simultaneously.

6. **Build incrementally**

   * Complete and validate each phase before proceeding.

---

# 3. Locked Technology Stack

## Application

* React Native
* Expo
* Expo Development Build
* TypeScript
* Expo Router

## State Management

* Zustand

## Local Storage

* SQLite
* expo-sqlite
* expo-file-system

## Native Layer

* Kotlin
* Expo Native Modules

## On-device AI

* Google MediaPipe Tasks GenAI
* Gemma 2B IT
* Quantized model compatible with target runtime

## On-device Vision

* Google MediaPipe Tasks Vision
* MediaPipe Image Embedder
* MobileNet V3 / EfficientNet Lite embedding model

## Device Features

* expo-location
* expo-camera
* expo-speech

## Backend

* Existing FastAPI microservices

Backend is used only during destination preparation and data retrieval.

The core travel experience must not depend on backend connectivity.

---

# 4. System Architecture

```text
                    VOYA APP
              React Native + Expo
                       │
                       ▼
              Travel Context Layer
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Explore      Navigate       Camera
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
              Native Intelligence
                       │
             VoyaIntelligenceModule
                       │
              Model Lifecycle Manager
                       │
                Kotlin Mutex
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
       MediaPipe GenAI      MediaPipe Vision
          Gemma 2B           Image Embedder
                       │
                       ▼
             Destination Intelligence
                     SQLite
```

---

# 5. Destination Intelligence Pack

A destination pack contains all data required for offline travel assistance.

Example:

```text
madurai/
├── destination.db
├── metadata.json
├── landmarks/
│   ├── embeddings.json
│   └── reference_images/
└── routes/
```

## Required data

### Places

* ID
* Name
* Category
* Latitude
* Longitude
* Description
* Opening hours
* Rating
* Estimated visit duration

### Restaurants

* ID
* Name
* Coordinates
* Cuisine
* Price range
* Rating

### Hotels

* ID
* Name
* Coordinates
* Rating
* Price range

### Landmarks

* Landmark ID
* Name
* Coordinates
* Description
* Image embeddings

---

# 6. AI Architecture

## Gemma responsibilities

Gemma is used for:

* Understanding natural language travel requests
* Extracting user intent
* Extracting constraints
* Contextual reasoning
* Generating natural language responses

Gemma must NOT:

* Store destination data
* Search the entire destination database
* Calculate routes
* Perform deterministic filtering

### Example

Input:

> "I am tired and have three hours left. Find something peaceful nearby."

Gemma output:

```json
{
  "intent": "recommend_places",
  "time_available_minutes": 180,
  "energy_level": "low",
  "preferences": ["peaceful"],
  "distance_preference": "nearby"
}
```

The local recommendation engine uses this structured output to query SQLite.

---

# 7. Vision Architecture

Landmark identification pipeline:

```text
Camera Image
      ↓
MediaPipe Image Embedder
      ↓
Image Embedding
      ↓
Release Vision Model
      ↓
Cosine Similarity Search
      ↓
Local Landmark Embeddings
      ↓
Top Landmark Matches
```

Only 10–20 landmarks are required for the MVP.

---

# 8. Strict Model Memory Policy

## Critical Requirement

Gemma and the Vision model must never be active simultaneously.

Use a Kotlin Mutex to control model lifecycle.

### States

```text
IDLE
LOADING_GENAI
GENAI_ACTIVE
LOADING_VISION
VISION_ACTIVE
RELEASING
ERROR
```

### Rules

1. Only one heavyweight model may hold memory at a time.
2. Acquiring one model must release the other.
3. Concurrent inference requests must queue.
4. Models must expose explicit release methods.
5. Vision inference should release immediately after embedding extraction.
6. GenAI may remain warm briefly, then release after inactivity.

### Lifecycle

```text
AI Request
    ↓
Acquire Mutex
    ↓
Release Vision
    ↓
Load Gemma
    ↓
Inference
    ↓
Return Result
    ↓
Release / Warm Timeout
```

---

# 9. Travel Context

VOYA requires a central travel state.

```typescript
interface TravelContext {
  destination: string;
  tripStartDate: string;
  tripEndDate: string;

  currentLatitude?: number;
  currentLongitude?: number;

  visitedPlaces: string[];
  savedPlaces: string[];

  energyLevel?: "low" | "medium" | "high";
  budget?: number;

  transportMode?: string;
  language?: string;
}
```

All recommendation and AI interactions must use this context.

---

# 10. Development Phases

---

## PHASE 0 — Project Initialization

### Goal

Create a stable Expo development environment.

### Tasks

* Initialize Expo TypeScript project.
* Configure Expo Router.
* Configure development build.
* Configure Android package.
* Set up ESLint and formatting.
* Create environment configuration.
* Establish folder structure.

### Validation

* Application builds successfully.
* Application runs on Android device.
* Development build works.

### Do not proceed until validated.

---

## PHASE 1 — Application Foundation

### Goal

Build the application structure without AI.

### Screens

* Splash
* Home
* Trip Setup
* Destination Download
* Explore
* Travel Assistant
* Landmark Camera
* Settings

### Implement

* Expo Router navigation.
* Zustand stores.
* Basic UI components.
* TravelContext store.
* Mock destination data.

### Validation

User can create and view a mock trip.

---

## PHASE 2 — Local Destination Database

### Goal

Implement the offline data layer.

### Tasks

* Design SQLite schema.
* Create database initialization.
* Import destination data.
* Implement queries for:

  * Attractions
  * Restaurants
  * Hotels
  * Nearby places
* Implement destination pack storage.

### Validation

Enable airplane mode.

The application must still:

* Display destination places.
* Search places.
* Filter places.
* Retrieve nearby locations.

---

## PHASE 3 — Destination Intelligence Pack

### Goal

Implement destination download and installation.

### Tasks

* Define pack manifest.
* Connect existing FastAPI APIs.
* Download destination data.
* Validate downloaded files.
* Store locally.
* Initialize SQLite database.
* Display download progress.

### Validation

User can:

1. Select destination.
2. Download pack.
3. Disable internet.
4. Continue using destination data.

---

## PHASE 4 — Native Module Foundation

### Goal

Create native Android bridge.

### Create

`VoyaIntelligenceModule`

### Required API

```typescript
initializeGenAI()

processTravelQuery()

initializeVision()

identifyLandmark()

releaseGenAI()

releaseVision()

getModelState()
```

### Validation

React Native can call Kotlin native methods successfully.

No ML model integration required yet.

---

## PHASE 5 — On-Device Gemma Integration

### Goal

Run Gemma locally through MediaPipe.

### Tasks

* Add MediaPipe GenAI dependency.
* Add model asset management.
* Implement model initialization.
* Implement inference.
* Return structured output.
* Implement explicit model release.

### Primary Test

Input:

> "I have two hours and want something historical nearby."

Expected:

Structured travel intent.

### Validation

* Works without internet.
* Does not block UI.
* Returns valid output.
* Model releases memory correctly.

---

## PHASE 6 — AI Travel Assistant

### Goal

Connect Gemma with destination intelligence.

### Flow

```text
User Query
    ↓
Gemma Intent Extraction
    ↓
Structured Constraints
    ↓
SQLite Query
    ↓
Recommendation Engine
    ↓
Response
```

### Example

User:

> "Find local food nearby under ₹500."

System:

1. Extracts intent.
2. Queries local restaurants.
3. Ranks results.
4. Generates recommendation.

### Validation

Recommendations must come only from local destination data.

---

## PHASE 7 — Recommendation Engine

### Goal

Build deterministic place ranking.

### Factors

* Distance
* User interests
* Rating
* Opening status
* Budget
* Available time
* Energy level

### Output

Ranked list of places.

### Validation

Different constraints produce meaningfully different recommendations.

---

## PHASE 8 — Offline GPS Experience

### Goal

Implement location-aware travel guidance.

### Tasks

* Current GPS location.
* Nearby place detection.
* Distance calculation.
* Destination direction.
* Route representation.

### MVP

Focus on:

* User location.
* Destination location.
* Distance.
* Direction.
* Precomputed route data.

### Validation

GPS-based location experience works in airplane mode.

---

## PHASE 9 — Landmark Vision

### Goal

Identify selected landmarks offline.

### Tasks

* Add MediaPipe Vision dependency.
* Implement Image Embedder.
* Capture image.
* Generate embedding.
* Compare against local embeddings.
* Return top matches.

### Dataset

Start with 10–20 landmarks.

### Validation

Correctly identifies known landmarks from test images.

---

## PHASE 10 — Model Lifecycle Manager

### Goal

Prevent memory crashes.

### Implement

* Kotlin Mutex.
* Model state machine.
* Request queue.
* Explicit model release.
* Timeout-based GenAI release.

### Test

Repeatedly switch:

```text
AI → Vision → AI → Vision
```

### Validation

* No crash.
* No memory leak.
* Only one heavyweight model active.

---

## PHASE 11 — Adaptive Travel Context

### Goal

Make VOYA context-aware.

### User inputs

Examples:

* "I am tired."
* "We only have one hour."
* "Skip this place."
* "Find something nearby."

### System

Update TravelContext and rerun recommendation engine.

### Validation

Recommendations adapt to changed conditions.

---

## PHASE 12 — Voice Experience

### Goal

Add multilingual interaction.

### MVP

* Text input first.
* Voice output using device TTS.
* English support.
* Tamil/Hindi if device language packs support offline TTS.

### Optional

Offline speech-to-text.

### Validation

VOYA can provide spoken guidance.

---

## PHASE 13 — Integration and Demo Mode

### Goal

Create complete end-to-end experience.

### Demo flow

```text
1. Open VOYA.

2. Select destination.

3. Download Destination Intelligence Pack.

4. Turn on Airplane Mode.

5. Explore nearby places.

6. Ask VOYA for recommendations.

7. Receive AI-powered response.

8. Use GPS guidance.

9. Scan a landmark.

10. Identify landmark.

11. Change travel conditions.

12. VOYA adapts recommendation.
```

---

## PHASE 14 — Performance and Reliability

### Test

* Airplane mode.
* Low network.
* Repeated model switching.
* Long AI conversations.
* Camera usage.
* Low battery.
* Application background/foreground.
* Destination pack corruption.

### Requirements

* No dependency on internet after pack installation.
* No simultaneous heavy model execution.
* Graceful failure handling.
* Clear loading states.

---

# 11. MVP Scope

## Must Build

* Destination setup.
* Destination Intelligence Pack.
* Offline local database.
* On-device Gemma.
* Natural language travel queries.
* Context-based recommendations.
* GPS-based nearby discovery.
* Landmark identification.
* Model lifecycle management.

## Nice to Have

* Offline routing.
* Full multilingual voice interaction.
* Adaptive itinerary.
* Background navigation.
* Multiple destination packs.

## Do Not Build Initially

* Social features.
* Booking system.
* Payments.
* User accounts.
* Global destination coverage.
* Complex itinerary generation.
* Cloud-dependent AI features.

---

# 12. Development Rules for Antigravity

1. Work on only one phase at a time.
2. Read this document before starting work.
3. Do not start the next phase until the current phase is validated.
4. Do not replace locked technologies without approval.
5. Do not introduce cloud AI into core offline functionality.
6. Keep AI inference inside native modules.
7. Do not keep Gemma and Vision loaded simultaneously.
8. Use TypeScript for all React Native application code.
9. Keep components modular and reusable.
10. Add concise documentation for architectural changes.
11. Prefer simple, working implementations over premature complexity.
12. Test airplane mode after every major offline feature.

---

# 13. Success Criteria

The prototype is successful if a user can:

1. Select a destination.
2. Download its intelligence pack.
3. Enable airplane mode.
4. Discover attractions, restaurants, and hotels.
5. Ask the AI for contextual travel recommendations.
6. Receive recommendations grounded in local data.
7. Use GPS to understand nearby locations.
8. Scan a supported landmark.
9. Identify the landmark offline.
10. Change their situation and receive adapted recommendations.

---

# Final Product Statement

> VOYA prepares a smartphone for a destination before the journey begins. By combining locally stored destination intelligence, on-device AI, GPS, and computer vision, VOYA transforms the phone into an intelligent local travel companion that continues to guide, understand, and adapt—even when the internet disappears.
