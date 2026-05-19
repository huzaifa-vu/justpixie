# 📝 Text & Data Tool Guide

The **Text & Data** suite (`/dashboard/text`) contains 5 utilities for text formatting, linguistic analysis, structure parsers, and browser-side speech synthesis.

---

## 🛠️ The Tool Catalog

| Tool Name | Route | Core Technology | Description |
|---|---|---|---|
| **Word Counter** | `/text/word-counter` | Custom regex counters | Counts words, characters, sentences, paragraphs, and reading times. |
| **Case Converter** | `/text/case-converter` | String modifiers | Conversions to UPPER, lower, Sentence, Title, camel, and snake case. |
| **Find & Replace** | `/text/replace` | RegExp / String replace | Finds text patterns or expressions and replaces them. |
| **CSV to JSON** | `/text/csv` | Custom parser logic | Converts CSV sheets to JSON arrays and vice versa. |
| **Text to Speech** | `/text/speech` | Web Speech API | Converts written blocks to spoken voice output. |

---

## 🔬 Core Implementation & Engine Mechanics

### 1. In-Browser Speech Synthesis (Web Speech API)
The **Text to Speech** converter uses the browser's native **SpeechSynthesis** engine:
*   **Voice Registry:** The tool queries the browser's local audio drivers (`window.speechSynthesis.getVoices()`) to populate available voices (such as Google US English, Microsoft Zira, or system default accents).
*   **Instantiation:** It constructs a `SpeechSynthesisUtterance` object, configures parameters (pitch, rate, voice profile), and plays the audio directly through the user's speakers:
    ```typescript
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = speedRate;
    synth.speak(utterance);
    ```

### 2. High-Density CSV & JSON Parsing
The CSV-to-JSON utility formats tables in-memory:
*   **CSV to JSON:** It parses lines while accounting for comma delimiters, double quotes, and header rows, converting records into structured JSON arrays:
    ```typescript
    const csvToJson = (csv: string) => {
      const lines = csv.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",");
      return lines.slice(1).map(line => {
        const values = line.split(",");
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || "";
          return obj;
        }, {} as Record<string, string>);
      });
    };
    ```
*   **JSON to CSV:** Converts arrays of objects into structured tables by extracting unique keys, inserting them as the first row, and mapping object properties line-by-line.

### 3. Word & Character Counters
Analyzes typing metrics using regular expressions:
*   **Sentence matching:** Matches sentences using delimiter groups: `text.split(/[.!?]+/).filter(Boolean).length`.
*   **Word matching:** Splits characters by spaces and punctuation: `text.trim().split(/\s+/).filter(Boolean).length`.
*   **Reading Speed Estimate:** Based on an average adult speed of 200 Words Per Minute (WPM).
