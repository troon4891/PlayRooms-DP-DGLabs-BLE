# SAFETY.md — DG-LAB Coyote BLE Device Provider

> ⚠️ **This document is safety-critical.** It must be kept accurate at all times.
> Any change to stop behavior, intensity handling, or connection lifecycle **requires**
> an update to this file in the same commit. See CLAUDE.md for the rule.

---

## What This Provider Does

This provider sends electrical stimulation commands to a DG-LAB Coyote V3 device over
a direct Bluetooth Low Energy connection. It controls two independent output channels
(A and B), each capable of delivering adjustable-intensity electrical impulses via
electrode pads attached to the body.

**This is not a toy or abstract simulation. The device delivers real electrical current
through the human body.**

---

## ⚠️ Absolute Contraindications — Do Not Use If:

These conditions are hard stops. No exceptions.

- **You have a cardiac pacemaker, implantable defibrillator (ICD), or any other
  electronic medical implant.** E-stim can interfere with or damage these devices
  and may cause life-threatening cardiac events.
- **You are pregnant or may be pregnant.** The safety of e-stim during pregnancy
  has not been established.
- **You have active cancer or a history of cancer in the area where electrodes will
  be placed.** E-stim may stimulate tumor growth.
- **You have epilepsy or are prone to seizures.**
- **You have a known heart condition or arrhythmia.**
- **You have reduced sensation in the target area** (neuropathy, post-surgical nerve
  damage, etc.) that would prevent you from detecting unsafe intensity levels.

---

## ⚠️ Electrode Placement Rules

**NEVER place electrodes above the waist.** This is the most critical physical safety
rule for consumer e-stim devices. Electrical current passing across the chest can:

- Induce ventricular fibrillation (cardiac arrest)
- Cause respiratory muscle spasm
- Result in death

Acceptable placement: lower abdomen, buttocks, upper thighs, lower back.

Additional placement rules:
- **Never** place electrodes across the chest, near the heart, or between the chest
  and any limb
- **Never** place electrodes on the neck, head, or face
- **Never** place electrodes on broken skin, open wounds, irritated skin, or rashes
- **Never** place electrodes directly over metal implants, joint replacements, or
  bone plates
- **Never** place electrodes on swollen, infected, or inflamed tissue
- Ensure skin is clean and dry before applying electrode pads

---

## Intensity Ranges and Physical Meaning

Channels A and B are independent. Each has a range of **0–200**:

| Value | Meaning |
|-------|---------|
| 0 | Off — no output |
| 1–30 | Very low — recommended starting range for new users |
| 20–80 | Typical comfortable range for most users |
| 100–150 | Strong — use with caution, build up gradually |
| 151–200 | High — experienced users only |

**Always start at 0 and increase gradually.** Never start a session at high intensity.
Never jump intensity levels rapidly.

The intensity value (0–200) is mapped linearly to a 10-bit value in the B0 BLE
command. The provider **always clamps** intensity to [0, 200] before transmission —
values above 200 cannot be sent to the device. This clamping happens in software before
the B0 payload is constructed. (See Milestone 5 implementation for clamping logic.)

---

## Emergency Stop Behavior

### How It Works

`stopAll()` is the emergency stop entry point. When called, it:

1. **Immediately** constructs a B0 command with:
   - Mode flags: `0b11` (absolute set) for both channels A and B
   - Channel A intensity: `0`
   - Channel B intensity: `0`
   - Waveform: zeroed (all frequency and intensity fields set to 0)
2. Writes this B0 command directly to the BLE characteristic (bypassing any queuing
   or rate limiting)
3. Clears any pending command queue
4. Logs the stop event at WARN level

### Timing

- If the Coyote is **connected**: the B0 zero-intensity command reaches the device
  in under 100ms. The Coyote stops output immediately on receipt.
- If the Coyote is **disconnected**: the BLE write will fail, but this is safe —
  see "BLE Disconnect Behavior" below. The device stops automatically when
  BLE connectivity is lost.

### Emergency Stop Must Always Work

The emergency stop path is never gated behind:
- Rate limiting
- Command queuing
- Authentication checks
- Panel state validation

If `stopAll()` is called and the device is reachable, output stops. No exceptions.

---

## BLE Disconnect Behavior

**This is the key safety difference between this provider and the WebSocket variant.**

When the BLE connection to the Coyote drops (device out of range, device powered off,
host Bluetooth reset, container losing access), **the Coyote stops output immediately**.
This is a hardware-level failsafe built into the device.

| Scenario | WS Provider Behavior | BLE Provider Behavior |
|----------|---------------------|----------------------|
| Connection drops | App may continue driving device for ~10s | Device **stops immediately** |
| Software crashes | App-dependent — may continue | Device **stops immediately** |
| Host reboots | App-dependent | Device **stops immediately** |

**The BLE provider is safer in failure scenarios.** However, there is one risk unique
to the BLE transport:

> **Sudden stop from range loss:** Moving out of BLE range (~10m typical) causes an
> abrupt stop with no warning. For some users and placement areas, a sudden unexpected
> stop is less comfortable than a gradual ramp-down. Be aware of your physical distance
> from the host machine.

### Reconnection Behavior

After a BLE disconnect, the provider will:
1. Log the disconnect at WARN level
2. Mark channels A and B as inactive
3. Attempt automatic reconnect (Milestone 5 will define retry policy)
4. **Not** resume output until explicitly commanded after reconnection

Output does **not** resume automatically after reconnection. The host or user must
explicitly send new commands to resume stimulation.

---

## B0 Command Timing and the Keepalive Safety Property

The Coyote V3 requires B0 commands to arrive at approximately 100ms intervals to
maintain active output. If B0 commands stop arriving, the device stops after a brief
timeout.

**This is a safety feature.** If the PlayRooms server crashes, the provider process
is killed, or the container is suspended, the Coyote stops on its own within ~200ms.
No manual intervention required.

This also means:
- The provider must send B0 at ~100ms intervals when output is active
- A software hang or deadlock will cause the device to stop (safe fail)
- The provider must not exceed ~10 commands/second (`maxCommandRate: 10` in manifest)

---

## Physical Failsafes — Always Have These Available

Software safety is not sufficient on its own. Always ensure:

1. **Physical power button access:** The Coyote has a physical power button. You
   should always be able to reach it immediately.
2. **Electrode removal:** You should always be able to remove electrodes quickly.
   Do not use restraints that would prevent this.
3. **Another person present:** For new users or high intensities, having another
   person present who can cut power or remove electrodes is strongly recommended.

---

## Known Limitations and Risks of This Transport

| Limitation | Risk | Mitigation |
|------------|------|-----------|
| Requires Bluetooth on host | Provider unavailable without adapter | Check adapter before session |
| One client per BLE connection | Another app claiming connection will drop this provider | Close DG-LAB app before use |
| BLE range ~10m | Sudden stop if user/host moves out of range | Be aware of physical distance |
| Docker container needs BLE passthrough | Misconfigured containers lose connection | Follow host setup guide in README |
| Adapter firmware bugs (virtualized environments) | Unstable connection | Use tested adapters (Intel AX211/AX210) |

---

## For Developers: Maintaining This Document

This file must be updated in the **same commit** as any code change that affects:

- Emergency stop behavior (`stopAll()` implementation)
- Intensity clamping (the 0–200 range, the 10-bit mapping, clamping logic)
- Connection lifecycle (connect, disconnect, reconnect)
- B0 command construction or timing
- Any new risk flag added to `manifest.yaml`

If you are unsure whether your change requires a SAFETY.md update, err on the side
of updating it. An overly thorough SAFETY.md is always preferable to an inaccurate one.

See CLAUDE.md §"Documentation Maintenance" for the documentation policy.
