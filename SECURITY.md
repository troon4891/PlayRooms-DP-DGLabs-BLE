# Security Policy — PlayRooms-DP-DGLabs-BLE

## Safety-Critical Provider

**This provider controls electrical stimulation (e-stim) devices over Bluetooth Low Energy.** Security vulnerabilities in this software may have **direct physical safety implications** — unauthorized control, intensity manipulation, or denial of emergency stop functionality could cause real physical harm.

We treat security reports for this provider with the highest priority.

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | Yes                |
| < 1.0   | No                 |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities privately:

1. **Email:** Send a detailed report to the repository owner via GitHub's private vulnerability reporting feature on this repository.
2. **GitHub Security Advisories:** Use the "Report a vulnerability" button under the Security tab of this repository.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact — especially any **physical safety implications** (e.g., could this bypass emergency stop? Could this allow unauthorized intensity changes?)
- Affected versions
- Any suggested fix

### What to Expect

- **Acknowledgment** within 48 hours of your report
- **Assessment** of severity and physical safety impact within 7 days
- **Fix or mitigation** prioritized based on severity:
  - **Critical (physical safety risk):** Patch released as soon as possible, no longer than 7 days
  - **High:** Patch within 14 days
  - **Medium/Low:** Patch in the next scheduled release

## Scope

The following are in scope for security reports:

- **Emergency stop bypass** — Any way to prevent or delay the emergency stop from zeroing output
- **Intensity manipulation** — Any path that could set intensity values above configured limits
- **Unauthorized device control** — Any way to send commands to the device without proper authorization through the host platform
- **BLE connection hijacking** — Any way to intercept or inject commands on the BLE link
- **Denial of service** — Any way to prevent the provider from functioning, especially preventing emergency stop
- **Information disclosure** — Leaking BLE device addresses, connection state, or host configuration

## Out of Scope

- Vulnerabilities in the DG-LAB Coyote hardware or firmware (report to DG-LAB directly)
- Vulnerabilities in the PlayRooms host platform (report to the PlayRooms repository)
- Bluetooth protocol-level attacks requiring physical proximity (these are inherent to BLE)

## Security Design Principles

This provider follows these security principles:

1. **Fail safe** — Any error condition must result in stimulation stopping, never continuing or increasing
2. **Defense in depth** — Intensity clamping occurs at multiple layers before BLE transmission
3. **Minimal privilege** — The provider only requests the BLE permissions it needs
4. **Emergency stop is sacrosanct** — No code path may block, delay, or prevent emergency stop execution
