# CONTROLS.md — DG-LAB Coyote BLE Device Provider

This document describes the panel controls exposed by the DG-LAB BLE provider and how
they map to BLE commands sent to the Coyote V3 hardware.

> **Note:** The panel schema for this provider is identical to the WebSocket (WS)
> variant. The controls look and behave the same — what differs is the underlying
> transport. The WS variant sends JSON messages to the DG-LAB mobile app; this
> provider writes B0 BLE commands directly to the Coyote hardware.

---

## Panel Layout

```
┌─────────────────────────────────────────────────────────────┐
│  DG-LAB Coyote (Bluetooth LE)            🔋 Battery: 85%   │
├────────────────────────┬────────────────────────────────────┤
│  Channel A             │  Channel B                         │
│                        │                                    │
│  Intensity  [──●────]  │  Intensity  [──●────]              │
│             0    200   │               0    200              │
│                        │                                    │
│  Waveform   [▼ Wave 1] │  Waveform   [▼ Wave 1]             │
│                        │                                    │
│  ● Active              │  ○ Inactive                        │
│  Dial: 47              │  Dial: 0                           │
├────────────────────────┴────────────────────────────────────┤
│  [  Link Channels A+B  ]    [ 🛑 EMERGENCY STOP ]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Controls Reference

### Channel A — Intensity

| Property | Value |
|----------|-------|
| Control type | `rampSlider` |
| Range | 0–200 |
| Default | 0 |
| Step | 1 |
| Ramp for guests | Mandatory |
| B0 mapping | 10-bit value (0–1023), linear scale from 0–200 |

**Guest ramp policy:** When a guest controls Channel A, intensity changes are applied
as gradual ramps rather than instant jumps. The ramp rate is configurable by the host.
The host can always set intensity instantaneously.

**B0 encoding:** The 0–200 range is mapped to a 10-bit integer for the B0 payload.
Intensity 200 maps to the maximum 10-bit value. Intensity 0 maps to 0. The provider
clamps all values to [0, 200] before encoding — values above 200 are treated as 200.

---

### Channel B — Intensity

Same as Channel A. Independent control. Identical range, ramp rules, and B0 encoding.

---

### Channel A — Waveform

| Property | Value |
|----------|-------|
| Control type | `patternPicker` |
| B0 mapping | 4-sample waveform block (frequency 0–1000 Hz, intensity 0–100 per sample) |

The waveform picker selects from predefined patterns. Each pattern defines a repeating
4-sample waveform block that is written into the B0 command on each 100ms tick.

**Waveform format in B0:** Each of the 4 waveform samples in a B0 command contains:
- Frequency: 0–1000 (maps to output pulse frequency in Hz)
- Intensity: 0–100 (waveform-level intensity multiplier, independent of channel intensity)

The specific waveform patterns available will be defined in Milestone 5.

---

### Channel B — Waveform

Same picker and B0 encoding as Channel A. Independent selection.

---

### Link Channels A+B

| Property | Value |
|----------|-------|
| Control type | Linked group toggle |
| Behavior | When linked, intensity and waveform changes to either channel are mirrored to the other |

When linked, the two channels are treated as a synchronized pair. A single slider
and waveform picker appears. Both channels receive identical B0 values.

When unlinked, each channel is controlled independently.

---

### Emergency Stop

| Property | Value |
|----------|-------|
| Control type | Button |
| Behavior | Immediately sets both channels to intensity 0 |
| B0 mapping | Mode flags `0b11` (absolute), intensity 0 for both A and B, waveform zeroed |

See SAFETY.md §"Emergency Stop Behavior" for the full technical and safety description.

The emergency stop button is **always visible and always active** — it cannot be
disabled by the host, by channel linking, or by any application state.

---

## Status Indicators

### Battery

Reads from the standard BLE battery service (UUID `0x1500`, notify characteristic
`0x1501`). Displays battery percentage (0–100%). Polled on connect and updated via
BLE notification.

### Channel A Active / Channel B Active

Displays whether the channel is currently delivering output (intensity > 0 and device
connected). Read-only indicator derived from the last B0 command sent.

### Device Dial A / Device Dial B (read-only)

The Coyote V3 has physical scroll wheels that report their current position via the
B1 BLE characteristic (notify). These values are displayed as read-only indicators.
The physical dials do **not** control this provider's intensity output — they are
informational only, showing the hardware's own scroll position. The soft limits
configured via the BF characteristic determine how the device interprets dial position.

---

## B0 Command Structure (Reference)

Every control update results in a B0 write. The 20-byte B0 payload structure:

```
Bytes 0–1  : Mode flags
              Bits [1:0] = Channel A mode (0b00=off, 0b01=relative, 0b10=absolute/set, 0b11=absolute/set)
              Bits [3:2] = Channel B mode
              Remaining bits: reserved

Bytes 2–3  : Channel A intensity (10-bit, big-endian, upper 6 bits zero-padded)
Bytes 4–5  : Channel B intensity (10-bit, big-endian, upper 6 bits zero-padded)

Bytes 6–9  : Waveform sample 1 (2 bytes frequency, 2 bytes intensity)
Bytes 10–13: Waveform sample 2
Bytes 14–17: Waveform sample 3
Bytes 18–20: Waveform sample 4  (partial — exact byte layout per V3 spec)
```

> **See DG-LAB-OPENSOURCE/coyote/v3/README_V3.md** for the authoritative byte layout.
> The above is a simplified reference. Milestone 5 implementation will follow the
> official specification exactly.

---

## Timing

| Parameter | Value |
|-----------|-------|
| B0 send interval | ~100ms |
| Maximum command rate | 10 commands/second (enforced by manifest `maxCommandRate`) |
| Keepalive requirement | B0 must be sent continuously to maintain output |
| Stop latency | < 100ms (next B0 tick after stop command received) |

Commands that arrive faster than `maxCommandRate` are coalesced using a
`latest-wins` strategy — the most recent command value is used for the next B0 tick.
