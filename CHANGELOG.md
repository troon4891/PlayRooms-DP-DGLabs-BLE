# Changelog — PlayRooms DG-LAB Coyote BLE Device Provider

All notable changes to this project are documented here.
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.1] — 2026-03-09 — License Correction

### Fixed

- **`LICENSE`** — Replaced auto-generated GitHub MIT license with the correct
  Apache License 2.0. Copyright holder updated to "Copyright 2026 PlayRooms".

- **`manifest.yaml`** — Updated `license` field from `"MIT"` to `"Apache-2.0"`
  to match the actual license file.

---

## [1.0.0] — 2026-03-08 — Milestone 1: Project Scaffold

### Added

- **`src/index.ts`** — Provider identity placeholder with BLE implementation TODOs.
  Exports `PROVIDER_NAME`, `PROVIDER_VERSION`, and `PROVIDER_API_VERSION`. Full
  `ProviderInterface` implementation deferred to Milestone 5.

- **`manifest.yaml`** — Provider manifest declaring:
  - `requirements.bluetooth: true` (direct BLE, no network dependency)
  - `aiInteraction.allowed: true, defaultEnabled: false`
  - E-stim `riskFlags` (electrical-stimulation: high, requires-physical-safety-gear: medium)
  - `deviceLimits.maxCommandRate: 10` with `latest-wins` coalescing
  - `scanTimeout` and `logLevel` settings

- **`SAFETY.md`** — Comprehensive safety documentation covering:
  - Absolute contraindications (pacemakers, pregnancy, etc.)
  - Electrode placement rules (never above the waist)
  - Intensity ranges and physical meaning (0–200 scale)
  - Emergency stop behavior (B0 absolute-zero command, < 100ms latency)
  - BLE disconnect behavior (hardware failsafe — device stops immediately)
  - B0 keepalive safety property (device stops if commands stop arriving)
  - Physical failsafe requirements (power button access, electrode removal)
  - Known limitations and transport-specific risks (range, single-client BLE)

- **`CONTROLS.md`** — Panel control reference covering:
  - Channel A/B intensity (`rampSlider`, 0–200, guest ramp mandatory)
  - Channel A/B waveform (`patternPicker`, 4-sample B0 waveform blocks)
  - Channel link group (sync A+B)
  - Emergency stop button (always visible, always active)
  - Status indicators: battery, channel active, physical dial positions
  - B0 command structure reference (20-byte layout summary)
  - Timing parameters (100ms interval, 10 cmd/s max, latest-wins coalescing)

- **`README.md`** — Full rewrite covering:
  - What the provider does (direct BLE, no app bridge)
  - BLE vs WS provider comparison table
  - Hardware prerequisites (adapter, Coyote V3, no competing connections)
  - Host setup guides (HA add-on config, standalone Docker privileged/capability modes)
  - Device pairing (no bonding required, scan by service UUID)
  - Configuration reference
  - Safety summary with links to SAFETY.md

- **`package.json`** — npm manifest with build/lint/typecheck scripts and TypeScript
  dev dependency.

- **`tsconfig.json`** — TypeScript 5 configuration targeting ES2020/CommonJS with
  strict mode, declarations, and source maps.

- **`NOTICE.md`** — Third-party attribution placeholder (no runtime dependencies yet).

- **`qa/v1.0.0-dglab-ble-scaffold.md`** — QA checklist for this milestone.

### Notes

- No runtime dependencies in this milestone — `dependencies: {}` in package.json.
  BLE library choice (e.g., `@abandonware/noble`) deferred to Milestone 5.
- ProviderInterface compliance not verifiable until Milestone 5 implementation.

---

*Previous versions: none — this is the initial release of this provider.*
