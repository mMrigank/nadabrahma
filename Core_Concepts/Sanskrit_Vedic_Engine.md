# Sanskrit & Vedic Engine: Vāgdhenu, Meter & Phonology
*The Sacred Science of Pārāyaṇa Chanting & Zero Schwa-Deletion Synthesis*

---

## 1. Overview
In standard speech and singing AI, Sanskrit is severely distorted due to Hindi/English phonetic bias (e.g. *schwa syncope* cutting final vowels: "Shiva" $\rightarrow$ "Shiv"). 

**Nādabrahma** integrates **Vāgdhenu** (developed at IISc Bengaluru by Prof. Prathosh A.P.)—an open-source, meter-aware Text-to-Speech system built specifically for reciting Sanskrit *ślokas* with traditional *pārāyaṇa* melodic contours and cadence.

---

## 2. Core Architectural Pillars
* **F5-TTS Flow-Matching Diffusion Backbone:** Non-autoregressive flow matching ensures stable pacing without stuttering or word dropping.
* **NVIDIA BigVGAN-v2 Vocoder:** High-resolution neural vocoder fine-tuned on classical chanting acoustics.
* **Elimination of Schwa Deletion:** Routes Sanskrit text through an unambiguous phonetic representation (Kannada script / IAST phonemes) that enforces pronunciation of every single vowel and conjunct consonant.
* **Vedic Accent & Chhandas Awareness:**
  * *Udātta* (raised pitch)
  * *Anudātta* (low pitch)
  * *Svarita* (falling ornament)
  * Rhythmic meters: Gāyatrī (24), Anuṣṭubh (32), Triṣṭubh (44), Jāgati (48).

---

## 3. The Sanskrit Ingestion Pipeline in Nādabrahma
```
[ User Types: "om tryambakam yajamahe..." ]
                    │
                    ▼
[ 1. Canonical Verse Identification & Sandhi Splitter ]
                    │
                    ▼
[ 2. Akshara Syllable Segmenter & Metric Meter (Laghu/Guru) ]
                    │
                    ▼
[ 3. Vāgdhenu / Cowchant Native Inference ]
                    │
                    ▼
[ 4. 96kHz / 32-bit Float Audio Drops Directly onto Track 2 ]
```

---

## Related Notes
* [[01_MASTER_SPECIFICATION]]
* [[Core_Concepts/Indian_Classical_Engine]]
* [[Workflows/Directors_Mode_Workflow]]
