// Package memory provides system memory monitoring for the Nāḍ backend.
// It reads macOS Unified Memory pressure via syscall and enforces the
// 12-15 GB working memory ceiling mandated by the Nāḍ architecture.
package memory

import (
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

// CeilingGB is the maximum allowed working memory in gigabytes.
// Set at 14 GB to stay within the 12–15 GB directive, leaving 18 GB+
// headroom for macOS, Safari, and background multitasking.
const CeilingGB = 14.0

// Stats holds the current snapshot of system memory usage.
type Stats struct {
	TotalGB     float64
	UsedGB      float64
	AvailableGB float64
	PressurePct float64 // 0–100
}

// Get returns the current system memory statistics on macOS (arm64).
// It reads "vm_stat" and "sysctl hw.memsize" to derive accurate figures.
func Get() (Stats, error) {
	totalGB, err := totalMemoryGB()
	if err != nil {
		return Stats{}, fmt.Errorf("memory: get total: %w", err)
	}

	usedGB, err := usedMemoryGB(totalGB)
	if err != nil {
		return Stats{}, fmt.Errorf("memory: get used: %w", err)
	}

	available := totalGB - usedGB
	if available < 0 {
		available = 0
	}

	return Stats{
		TotalGB:     totalGB,
		UsedGB:      usedGB,
		AvailableGB: available,
		PressurePct: (usedGB / totalGB) * 100,
	}, nil
}

// WouldExceedCeiling returns true if loading a model of modelGB gigabytes
// would push working memory above the ceiling.
func WouldExceedCeiling(modelGB float64) (bool, Stats, error) {
	stats, err := Get()
	if err != nil {
		return false, stats, err
	}
	projected := stats.UsedGB + modelGB
	return projected > CeilingGB, stats, nil
}

// totalMemoryGB reads the physical memory size via sysctl.
func totalMemoryGB() (float64, error) {
	out, err := exec.Command("sysctl", "-n", "hw.memsize").Output()
	if err != nil {
		return 0, err
	}
	bytes, err := strconv.ParseInt(strings.TrimSpace(string(out)), 10, 64)
	if err != nil {
		return 0, err
	}
	return float64(bytes) / (1024 * 1024 * 1024), nil
}

// usedMemoryGB derives used memory from vm_stat page counts.
func usedMemoryGB(totalGB float64) (float64, error) {
	out, err := exec.Command("vm_stat").Output()
	if err != nil {
		return 0, err
	}

	lines := strings.Split(string(out), "\n")
	pages := make(map[string]int64)
	for _, line := range lines {
		parts := strings.Split(line, ":")
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		valStr := strings.TrimSpace(strings.TrimSuffix(parts[1], "."))
		val, err := strconv.ParseInt(valStr, 10, 64)
		if err != nil {
			continue
		}
		pages[key] = val
	}

	// Page size is always 16 KB on Apple Silicon
	const pageSizeBytes = 16 * 1024

	wired := pages["Pages wired down"]
	active := pages["Pages active"]
	compressed := pages["Pages occupied by compressor"]

	usedPages := wired + active + compressed
	usedBytes := usedPages * pageSizeBytes
	usedGB := float64(usedBytes) / (1024 * 1024 * 1024)

	// Cap at total to avoid floating-point overshoot
	if usedGB > totalGB {
		usedGB = totalGB
	}
	return usedGB, nil
}
