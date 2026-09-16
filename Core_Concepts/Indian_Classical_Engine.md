# Indian Classical Engine: Ragas, Talas, 22 Shrutis & The Western Bridge
*The Acoustic Science of Indian Musicology Built for Modern AI Audio Workstations*

---

## 1. Moveable Tonic (*Adhara Shadja* / Sa)
In Indian classical music, **`Sa` is moveable and defined in continuous Hertz**, not restricted to fixed Western 440 Hz keys.
* **Male Vocalists:** Typically $130\text{ Hz} - 150\text{ Hz}$ ($C, C\sharp, D$).
* **Female Vocalists:** Typically $195\text{ Hz} - 225\text{ Hz}$ ($G, G\sharp, A$).
* **Instrumentalists:** Aligned with natural acoustic string tension (e.g. Sitar in $C\sharp$ or $D$).

### The Mathematical Formula:
$$\text{MIDI Note} = 69 + 12 \times \log_2\left(\frac{f_{Sa}}{440}\right)$$
$$\text{Cents Offset} = (\text{exact\_fractional\_midi} - \text{nearest\_integer\_midi}) \times 100$$

---

## 2. The 22 Shrutis Just Intonation Engine
Unlike Western 12-Tone Equal Temperament (which mathematically compromises intervals using $2^{n/12}$), Indian music is based on **natural harmonic overtones (Just Intonation)**:

| Swara | Shruti Name | Natural Ratio | Cents (Just) | 12-TET Cents | Offset vs Western |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ṣaḍja (Sa)** | Kṣobhiṇī | $1/1$ | $0\text{ c}$ | $0\text{ c}$ | $0\text{ c}$ |
| **Komal Re₁** | Tīvrā | $16/15$ | $112\text{ c}$ | $100\text{ c}$ | $+12\text{ c}$ |
| **Shuddha Re₂** | Raudrī | $9/8$ | $204\text{ c}$ | $200\text{ c}$ | $+4\text{ c}$ |
| **Komal Ga₁** | Raktikā | $6/5$ | $316\text{ c}$ | $300\text{ c}$ | $+16\text{ c}$ |
| **Shuddha Ga₃** | Krodhā | $5/4$ | $386\text{ c}$ | $400\text{ c}$ | $\mathbf{-14\text{ c}}$ (Pure Major 3rd) |
| **Shuddha Ma₁** | Vajrikā | $4/3$ | $498\text{ c}$ | $500\text{ c}$ | $-2\text{ c}$ |
| **Tivra Ma₂** | Pradīptā | $45/32$ | $590\text{ c}$ | $600\text{ c}$ | $-10\text{ c}$ |
| **Pañcama (Pa)** | Ālāpinī | $3/2$ | $702\text{ c}$ | $700\text{ c}$ | $\mathbf{+2\text{ c}}$ (Pure Perfect 5th) |
| **Komal Dha₁** | Madantī | $8/5$ | $814\text{ c}$ | $800\text{ c}$ | $+14\text{ c}$ |
| **Shuddha Dha₂** | Rohiṇī | $5/3$ | $884\text{ c}$ | $900\text{ c}$ | $\mathbf{-16\text{ c}}$ (Pure Major 6th) |
| **Komal Ni₁** | Ugrā | $9/5$ | $1018\text{ c}$ | $1000\text{ c}$ | $+18\text{ c}$ |
| **Shuddha Ni₃** | Kṣobhiṇī | $15/8$ | $1088\text{ c}$ | $1100\text{ c}$ | $\mathbf{-12\text{ c}}$ (Pure Major 7th) |

---

## 3. Raga-to-Western Modal Bridge (`ragaBridge`)
Translates Indian raga grammar into Western modes and scale formulas for AI model prompting:

* **Bilawal Thaat** $\rightarrow$ **Ionian Mode** ($1, 2, 3, 4, 5, 6, 7$)
* **Kalyan Thaat** $\rightarrow$ **Lydian Mode** ($1, 2, 3, \sharp 4, 5, 6, 7$)
* **Kafi Thaat** $\rightarrow$ **Dorian Mode** ($1, 2, \flat 3, 4, 5, 6, \flat 7$)
* **Bhairavi Thaat** $\rightarrow$ **Phrygian Mode** ($1, \flat 2, \flat 3, 4, 5, \flat 6, \flat 7$)
* **Asavari Thaat** $\rightarrow$ **Aeolian Mode (Natural Minor)** ($1, 2, \flat 3, 4, 5, \flat 6, \flat 7$)
* **Khamaj Thaat** $\rightarrow$ **Mixolydian Mode** ($1, 2, 3, 4, 5, 6, \flat 7$)
* **Bhairav Thaat** $\rightarrow$ **Double Harmonic Major (Byzantine)** ($1, \flat 2, 3, 4, 5, \flat 6, 7$)
* **Purvi Thaat** $\rightarrow$ **Double Harmonic Minor $\sharp 4$** ($1, \flat 2, 3, \sharp 4, 5, \flat 6, 7$)
* **Todi Thaat** $\rightarrow$ **Phrygian $\sharp 4$ with Maj 7th** ($1, \flat 2, \flat 3, \sharp 4, 5, \flat 6, 7$)
* **Marwa Thaat** $\rightarrow$ **Lydian $\flat 2$** ($1, \flat 2, 3, \sharp 4, 5, 6, 7$)

---

## 4. The Tala System (Rhythm Cycles)
* **Teental (16 Mātrās):** $4+4+4+4$ (Sam: 1, Tali: 5, 13, Khali: 9)
* **Rupak (7 Mātrās):** $3+2+2$ (Uniquely begins on Khali: 1, Tali: 4, 6)
* **Jhaptal (10 Mātrās):** $2+3+2+3$ (Sam: 1, Tali: 3, 8, Khali: 6)
* **Adi Tala (8 Mātrās):** Carnatic $4+2+2$ (Laghu 4 + Dhrutam 2 + Dhrutam 2)
* **Keherwa (8 Mātrās) & Dadra (6 Mātrās):** Popular folk, ghazal, and fusion rhythms.
