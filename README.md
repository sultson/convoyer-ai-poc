# Convoyer AI PoC 🛰️🧠

**Delegate recon OODAs**

[![Hackathon](https://img.shields.io/badge/Hackathon-European%20Defense%20Tech%20Paris%202024-blueviolet)](https://lu.ma/m7rt59cd) 
---

**Convoyer AI** demonstrates a system for human oversight of autonomous intelligence drones, focusing on convoy protection scenarios. The PoC utilizes a pre-recorded video stream (`trucks.mp4`) of convoy footage to simulate real-time drone sensor input. This video drives a sequence of events that mimic outputs from an AI perception pipeline—conceptually, this would involve object detection (e.g., via OpenCV) and classification using a trained model. The interface aims to provide operators with actionable intelligence derived from these simulated AI processes, facilitating human-in-the-loop decision-making.

## 🎯 Objective

This PoC investigates UI/UX patterns for presenting AI-derived intelligence from autonomous drones to a human operator. The primary technical goals are:

1.  To simulate and visualize the data flow from mock drone sensor input (represented by `trucks.mp4`) through a simulated AI processing pipeline to the operator.
2.  To implement an interactive entity graph (using [D3.js](https://d3js.org/)) for displaying identified targets, their AI-inferred attributes (e.g., type, confidence), and dynamic relationships.
3.  To develop a configurable, rule-based ranking system for prioritizing potential threats, driven by simulated AI observations and predefined vehicle data (`vehicles.ts`, `typePointsMap.ts`).
4.  To explore UI mechanisms for presenting AI-suggested operator actions based on the evolving simulated scenario.

Okay, here's a merged and refined section, focusing on directness and technical description without React component names or "fluff":

## Core Functionality and Technical Workflow

This Proof-of-Concept (PoC) simulates an intelligence-gathering mission where autonomous drones identify and assess vehicles within a convoy. The system uses pre-recorded video footage to drive a simulated AI processing pipeline, presenting derived intelligence and decision support cues to an operator.

**1. Video-Driven Mission Simulation & AI Event Generation:**

*   **Visual Input Proxy & Event Triggering:** A pre-recorded video (`assets/trucks.mp4`) representing convoy footage serves as a proxy for live drone sensor input. Playback of this video via a timeline interface initiates a time-based event sequence, simulating the progression of the mission.
*   **Simulated AI Processing Pipeline:** The system simulates the outputs of an onboard AI processing real-time sensor data. This conceptual pipeline includes:
    *   *Simulated Object Detection:* Identification of potential vehicles within video frames.
    *   *Simulated Classification & Feature Extraction:* A hypothetical model classifies detected objects (e.g., "Truck," "BTR"), estimates attributes (e.g., armament presence), and assigns confidence scores.
*   **Event Stream Generation:** The simulated AI outputs are translated into a timed sequence of JavaScript events. These events contain metadata such as entity IDs, types, confidence levels, and relationships, driving the updates within the interface.

**2. Dynamic Entity Visualization & State Management:**

*   **Centralized State Management:** A central state manager tracks detected entities (vehicles, AI-generated observations) and their interconnections. This state is updated in response to the simulated AI event stream.
*   **Interactive Entity Graph (D3.js):** The managed entity data is bound to a D3.js force-directed graph. This graph visualizes AI-generated information including vehicle types, classification confidence scores, and occlusion status. The graph dynamically updates to reflect new entities, evolving observations, and changes in entity status (e.g., visual cues for occlusion or high-threat targets).

**3. Algorithmic Threat Prioritization & Ranking:**

*   **Threat Assessment Logic:** Identified vehicles are assessed and ranked based on several factors:
    *   Confidence scores from simulated AI observations.
    *   Inherent threat levels derived from predefined vehicle attributes (specified in `config/vehicles.ts`).
    *   Strategic modifiers based on the current operational context (e.g., "defense" vs. "offense," using weights from `config/typePointsMap.ts`).
*   **Ranked Target Display:** A dedicated UI element consumes the entity data and their calculated scores to present a live-updated, sorted list of prioritized targets. The D3 graph may also visually emphasize the highest-ranked vehicle.

**4. Contextual Information & Decision Support:**

*   **Mission Status & Suggested Actions:** A display area presents current mission context (e.g., convoy ID, drone information). Based on the evolving simulation (e.g., high-threat detection, low-confidence observation), it presents mock "Suggested Next Actions" to guide operator focus.
*   **Vehicle Information Access:** Predefined detailed information for recognized vehicle types, sourced from `config/vehicles.ts`, can be displayed for operator reference.
*   **Operator Situational Awareness:** The visual graph, ranked list of targets, and suggested actions are designed to provide the operator with comprehensive situational awareness to support informed decision-making or (in a real system) re-tasking of assets.

**5. Event-Driven Real-time Updates:**

*   The interface reacts to the simulated event stream. Changes in entity states, new detections, or updated AI observations trigger re-rendering of the D3 graph and associated information displays, maintaining a current operational picture.

**6. Configurable Ranking Strategy:**

*   The threat assessment logic is designed to be adaptable. It can adjust to different operational strategies (e.g., "defense" or "offense") by applying distinct scoring weights from `config/typePointsMap.ts` when evaluating vehicle attributes for ranking.


## 🏁 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/<your-username>/convoyer-ai-poc.git
    cd convoyer-ai-poc/convoyer-ai-poc-main
    ```
    *(Adjust path if `convoyer-ai-poc-main` is the root of the repo)*

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

5.  Click the "Run" button on the Video Timeline to start the simulation!
