# Security Policy — PlayRooms-DP-DGLabs-BLE

## Safety-Critical Notice

**This provider controls electrical stimulation (e-stim) hardware.** Security vulnerabilities in this codebase may have **direct physical safety implications** — including uncontrolled electrical output, failure of emergency stop mechanisms, or intensity values exceeding safe limits.

Because of this, we treat security reports with the highest priority and urgency. A vulnerability here is not just a software defect — it is a potential physical safety hazard.

## Scope

This policy covers the `PlayRooms-DP-DGLabs-BLE` provider, which controls DG-LAB Coyote e-stim devices via **direct Bluetooth Low Energy (BLE)** — no DG-LAB mobile app bridge required.

Security-sensitive areas include, but are not limited to:

- **Emergency stop reliability** — the kill command must always reach the device via BLE within one B0 command cycle (~100ms)
- **Intensity clamping** — values sent in B0 command packets must never exceed configured maximums (0–200 per channel, mapped to 10-bit BLE values)
- **B0 command integrity** — the 20-byte BLE command payload must be correctly constructed; malformed packets could cause unsafe device behavior
- **AI interaction controls** — the AI intensity cap must be enforced and cannot be bypassed
- **BLE connection lifecycle** — device behavior during BLE disconnection, reconnection, or scan failure must be safe by default (fail-safe: BLE disconnect causes device to stop immediately at the hardware level)
- **BLE keepalive safety property** — if B0 commands stop arriving, the device halts output; any vulnerability that disrupts the command loop is a safety issue

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | Yes                |
| < 1.0   | No                 |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** Given the physical safety implications of this provider, we ask that you report vulnerabilities privately.

### How to Report

1. **Email:** Send a detailed report to the repository owner via GitHub private contact (use the "Security" tab on the repository if GitHub Security Advisories are enabled, or contact the owner directly).
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential physical safety impact (if applicable)
   - Suggested fix (if you have one)

### What to Expect

- **Acknowledgment** within 48 hours of your report
- **Assessment and triage** within 7 days, with priority given to any issue that could affect device safety
- **Fix and disclosure** — safety-critical fixes will be released as soon as possible, with coordinated disclosure

### Safety-Critical Fast Track

If your report involves any of the following, it will be treated as **critical priority**:

- Emergency stop can be bypassed or fails to fire
- Intensity values can exceed the configured maximum
- Device continues stimulation after BLE connection loss (fail-open behavior)
- AI control can bypass the intensity cap
- B0 command payloads can be injected or corrupted to send arbitrary intensity or waveform values to the device
- The B0 command loop can be disrupted in a way that causes unexpected device behavior

## Responsible Disclosure

We follow responsible disclosure practices. We ask that you:

- Give us reasonable time to investigate and fix the issue before public disclosure
- Do not exploit the vulnerability against real users or devices
- Do not test against hardware you do not own

## Security Best Practices for Users

- Keep the PlayRooms host and all provider plugins updated to the latest version
- Use this provider only on trusted host machines — the BLE connection is local, but the PlayRooms server may be exposed on your local network
- Set conservative intensity maximums in the provider configuration
- Always verify emergency stop functionality before each session
- Ensure no other application (DG-LAB mobile app, another PlayRooms instance) is connected to the Coyote — only one BLE client can hold the connection at a time
- If using AI interaction, keep the AI intensity cap well below your comfort threshold
- Maintain physical access to the device's power button or be prepared to remove electrodes immediately as a hardware-level fallback
