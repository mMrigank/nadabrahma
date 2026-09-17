// Package prompt provides the dual-conditioned prompt builder that translates
// Nāḍ's Indian Classical musicology parameters into model-specific text prompts
// for each audio.cpp-backed generation model.
//
// The ragaBridge concept: every prompt is conditioned on BOTH the Indian
// classical raga context (swara grammar, rasa, tala) AND its Western modal
// equivalent (Lydian, Dorian, Phrygian, etc.) to prevent tonal hallucination.
package prompt

import (
	"fmt"
	"strings"

	"github.com/nad-daw/backend/internal/models"
)

// RagaContext holds Indian Classical parameters from the frontend.
type RagaContext struct {
	RagaName     string  // e.g. "Yaman", "Bhairavi"
	WesternMode  string  // e.g. "Lydian Mode", "Phrygian Mode"
	BaseSaHz     float64 // Tonic frequency in Hz, e.g. 261.63 (middle C Sa)
	TalaName     string  // e.g. "Teental", "Rupak"
	BPM          int
	Rasa         string  // e.g. "Shringara", "Karuna"
	ModalDegrees string  // e.g. "1 - 2 - 3 - #4 - 5 - 6 - 7"
	AcousticTimbre string // e.g. "Luminous acoustic string resonance"
	TrackRole    string  // e.g. "solo_instrument", "lead_vocal", "ambient_pad"
}

// VocalContext extends RagaContext with vocal-specific parameters.
type VocalContext struct {
	RagaContext
	VocalStyle     string // "aalap", "humming", "hindi_lyrics", "sanskrit_mantra", "fusion"
	Lyrics         string // Empty for wordless (aalap/humming)
	BreathinessP   int    // 0–100
	GamakaDepthP   int    // 0–100 (gamaka oscillation intensity)
	FormantShift   int    // -12 to +12 semitones
}

// BuildInstrumentalPrompt creates the prompt and tags for YuE2 or MiniMax3.
// These models are for instrumental tracks ONLY.
func BuildInstrumentalPrompt(ctx RagaContext) (prompt, tags, lyrics string) {
	// Tags: style descriptors that audio.cpp models use for conditioning.
	tagParts := []string{
		fmt.Sprintf("Indian classical %s raga", ctx.RagaName),
		fmt.Sprintf("%s (%s)", ctx.WesternMode, ctx.ModalDegrees),
		fmt.Sprintf("%s tala, %d BPM", ctx.TalaName, ctx.BPM),
		fmt.Sprintf("rasa: %s", ctx.Rasa),
		ctx.AcousticTimbre,
		fmt.Sprintf("Sa tuned to %.2f Hz", ctx.BaseSaHz),
		"22 Shrutis just intonation",
		"instrumental, no vocals",
		"high fidelity, 96kHz, extended spectrum",
	}

	// Role-specific enrichments.
	switch ctx.TrackRole {
	case "solo_instrument":
		tagParts = append(tagParts, "solo melodic instrument, meend pitch bends, gamaka ornaments")
	case "drone":
		tagParts = append(tagParts, "tanpura drone, adhara shadja, Sa Pa Sa resonance, meditative sustain")
	case "percussion_tala":
		tagParts = append(tagParts, "tabla bols, tala groove, somatic infrasound, transient punch")
	case "modern_beats":
		tagParts = append(tagParts, "urban rhythm, bass-forward, tight transients")
	case "ambient_pad":
		tagParts = append(tagParts, "lush orchestral pad, slow attack, hypersonic air sheen")
	}

	tags = strings.Join(tagParts, ", ")

	// The main prompt provides narrative context for the model.
	prompt = fmt.Sprintf(
		"Generate an instrumental composition in %s (Indian classical raga %s). "+
			"Western modal equivalent: %s with scale degrees %s. "+
			"Tala: %s at %d BPM. "+
			"Emotional character (rasa): %s. "+
			"Tonic Sa is %.2f Hz using 22 Shrutis just intonation. "+
			"Timbre: %s. "+
			"Generate purely instrumental audio with no vocals.",
		ctx.RagaName, ctx.RagaName,
		ctx.WesternMode, ctx.ModalDegrees,
		ctx.TalaName, ctx.BPM,
		ctx.Rasa,
		ctx.BaseSaHz,
		ctx.AcousticTimbre,
	)

	lyrics = "" // Instrumental: no lyrics

	return prompt, tags, lyrics
}

// BuildVocalPrompt creates the prompt and tags for ACE-Step 1.5.
// Handles aalap, humming, Hindi/Sanskrit lyrics, and fusion vocals.
func BuildVocalPrompt(ctx VocalContext) (prompt, tags, lyrics string) {
	tagParts := []string{
		fmt.Sprintf("Indian classical vocal, %s raga", ctx.RagaName),
		fmt.Sprintf("%s (%s)", ctx.WesternMode, ctx.ModalDegrees),
		fmt.Sprintf("Sa at %.2f Hz", ctx.BaseSaHz),
		fmt.Sprintf("rasa: %s", ctx.Rasa),
	}

	var vocalDescriptor string
	switch ctx.VocalStyle {
	case "aalap":
		vocalDescriptor = "unmetered alap, nomtom syllables, slow meditative exploration, no percussion"
		tagParts = append(tagParts, "wordless aalap, nomtom, contemplative, free rhythm")
		ctx.Lyrics = "" // Force wordless mode
	case "humming":
		vocalDescriptor = "wordless humming, smooth legato, subtle vibrato, warm tone"
		tagParts = append(tagParts, "humming, wordless, warm timbre, legato")
		ctx.Lyrics = ""
	case "hindi_lyrics":
		vocalDescriptor = fmt.Sprintf(
			"Hindi lyric singing, correct vowel pronunciation, %s raga melodic contour, "+
				"gamaka ornaments at %.0f%% depth, breathiness at %.0f%%",
			ctx.RagaName, float64(ctx.GamakaDepthP), float64(ctx.BreathinessP),
		)
		tagParts = append(tagParts, "Hindi vocals, correct pronunciation, lyrical", ctx.Rasa)
	case "sanskrit_mantra":
		vocalDescriptor = fmt.Sprintf(
			"Vedic Sanskrit recitation, zero schwa-deletion, Udatta/Anudatta/Svarita pitch accents, "+
				"raga %s melodic frame, reverent and precise articulation",
			ctx.RagaName,
		)
		tagParts = append(tagParts, "Sanskrit mantra, Vedic, no schwa deletion, sacred")
	case "fusion":
		vocalDescriptor = fmt.Sprintf(
			"Indian fusion vocal, contemporary pop-classical blend, %s raga elements, "+
				"modern production, expressively ornamented",
			ctx.RagaName,
		)
		tagParts = append(tagParts, "Indian fusion, contemporary, pop-classical, expressive")
	default:
		vocalDescriptor = "Indian classical vocal"
	}

	tags = strings.Join(tagParts, ", ")

	prompt = fmt.Sprintf(
		"Generate %s in %s raga (Western: %s, scale: %s). "+
			"Tonic Sa at %.2f Hz. Emotional rasa: %s. "+
			"%s at %d BPM in %s tala.",
		vocalDescriptor,
		ctx.RagaName, ctx.WesternMode, ctx.ModalDegrees,
		ctx.BaseSaHz, ctx.Rasa,
		ctx.TalaName, ctx.BPM, ctx.TalaName,
	)

	lyrics = ctx.Lyrics
	return prompt, tags, lyrics
}

// BuildAmbientPrompt creates the prompt for Stable Audio 3 Medium.
// Used for cinematic textures, hypersonic air, somatic sub-bass, risers/drops.
func BuildAmbientPrompt(ctx RagaContext, ambientType string) (prompt, tags string) {
	tagParts := []string{
		fmt.Sprintf("%s mood", ctx.Rasa),
		fmt.Sprintf("Sa-tuned to %.2f Hz", ctx.BaseSaHz),
		"high fidelity, extended spectrum",
	}

	switch ambientType {
	case "riser":
		tagParts = append(tagParts, "cinematic riser, ascending tension, spectral swell, pre-drop buildup")
		prompt = fmt.Sprintf("Cinematic riser tuned to Sa at %.2f Hz, building tension in the spirit of %s rasa. "+
			"Ascending spectral sweep from low sub to high air. %d BPM grid-quantized.", ctx.BaseSaHz, ctx.Rasa, ctx.BPM)
	case "sub_drop":
		tagParts = append(tagParts, "somatic infrasound, sub drop, 10-20 Hz, chest resonance, heavy bass impact")
		prompt = fmt.Sprintf("Deep sub-bass drop at Sa %.2f Hz (10-20 Hz somatic infrasound). "+
			"Heavy chest-resonant impact, %s rasa energy. Tabla-inspired transient punch.", ctx.BaseSaHz, ctx.Rasa)
	case "ambient_pad":
		tagParts = append(tagParts, "lush orchestral pad, slow attack, hypersonic air 20kHz-48kHz, meditative")
		prompt = fmt.Sprintf("Lush ambient pad in %s raga (%s mode). "+
			"Sa at %.2f Hz, %s rasa. Slow attack, sustained shimmer, "+
			"hypersonic air frequencies above 20 kHz for airy realism.", ctx.RagaName, ctx.WesternMode, ctx.BaseSaHz, ctx.Rasa)
	case "hypersonic_air":
		tagParts = append(tagParts, "hypersonic air, 20kHz-48kHz, ultrasonic overtones, airy brilliance, strings/flute")
		prompt = fmt.Sprintf("Pure hypersonic air texture (20 kHz–48 kHz) complementing %s raga. "+
			"Natural ultrasonic string/flute overtones eliminating digital brickwall harshness. "+
			"Sa at %.2f Hz.", ctx.RagaName, ctx.BaseSaHz)
	default:
		tagParts = append(tagParts, "cinematic soundscape, atmospheric")
		prompt = fmt.Sprintf("Atmospheric cinematic soundscape in the spirit of %s raga and %s rasa. "+
			"Sa at %.2f Hz.", ctx.RagaName, ctx.Rasa, ctx.BaseSaHz)
	}

	tags = strings.Join(tagParts, ", ")
	return prompt, tags
}

// BuildRequest constructs a models.GenerateRequest from the given context.
func BuildRequest(modelID models.ModelID, prompt, tags, lyrics string, durationSec float64) models.GenerateRequest {
	return models.GenerateRequest{
		ModelID:     modelID,
		Prompt:      prompt,
		Lyrics:      lyrics,
		Tags:        tags,
		DurationSec: durationSec,
		SampleRate:  48000, // audio.cpp generates at 48kHz; frontend upsamples to 96kHz
	}
}
