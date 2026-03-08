# PlayRooms — DG-LAB Coyote BLE Device Provider

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> ⚠️ **Safety Warning:** This plugin controls electrical stimulation hardware.
> Read [SAFETY.md](./SAFETY.md) before use. E-stim is contraindicated for people with
> pacemakers or other electronic medical implants, during pregnancy, and for electrode
> placement above the waist. Never use without understanding the risks.

---

## What This Provider Does

This is a [PlayRooms](https://github.com/troon4891/PlayRooms) Device Provider plugin
that controls the **DG-LAB Coyote V3 e-stim device** over a **direct Bluetooth Low
Energy (BLE) connection** — no mobile app bridge required.

It communicates with the Coyote hardware by writing 20-byte B0 command packets to the
device's BLE characteristics at ~100ms intervals, giving direct, low-latency control
over both output channels.

---

## How This Differs from the WebSocket Provider

PlayRooms supports two providers for the DG-LAB Coyote:

| | **BLE Provider (this repo)** | **WS Provider** |
|---|---|---|
| **Transport** | Direct Bluetooth LE | WebSocket via DG-LAB mobile app |
| **Latency** | Lower (~100ms) | Higher (adds app relay layer) |
| **App dependency** | None — no DG-LAB app needed | DG-LAB app must be running |
| **On disconnect** | Device **stops immediately** (hardware failsafe) | App may continue driving device briefly |
| **Host requirement** | Bluetooth adapter on host | Network connectivity to phone |
| **Container setup** | Requires BLE passthrough (dbus/privileged) | Standard network only |
| **Range** | ~10m Bluetooth range | Wi-Fi/network range |

**Choose BLE if:** You want direct control with no app dependency and lower latency,
and your host machine has a Bluetooth adapter with proper passthrough configured.

**Choose WS if:** Your host doesn't have Bluetooth, or you prefer the DG-LAB app to
remain in control of the device limits.

---

## Prerequisites

### Hardware

- **DG-LAB Coyote V3** device (this provider targets the V3 protocol)
- **Bluetooth adapter on the host machine** — USB or built-in
  - Tested: Intel AX211NGW, Intel AX210
  - Note: some adapters have firmware issues in virtualized environments
- **No other application claiming the BLE connection** — the DG-LAB mobile app,
  another PlayRooms instance, or any other BLE client must not be connected to the
  Coyote while this provider is running. Only one BLE client can hold the connection
  at a time.

### Software

- PlayRooms host (v1.0.0+) with plugin loading enabled
- Node.js 20+ (if running outside Docker)

---

## Host Setup

### Home Assistant Add-on

In your HA add-on configuration, Bluetooth passthrough requires these options:

```yaml
host_dbus: true
uart: true
usb: true
```

Additionally, the add-on must be granted access to the Bluetooth device. HA OS
typically exposes BLE through the host dbus — ensure no other add-on (e.g., the
official Bluetooth proxy) is claiming exclusive access to the adapter.

### Standalone Docker

The container needs access to the host Bluetooth stack. The simplest approach:

```bash
docker run --privileged \
  -v /var/run/dbus:/var/run/dbus \
  # ... other PlayRooms flags
  playrooms:latest
```

A non-privileged alternative using specific capabilities:

```bash
docker run \
  --cap-add=NET_ADMIN \
  --cap-add=SYS_ADMIN \
  -v /var/run/dbus:/var/run/dbus \
  --device /dev/bus/usb \
  playrooms:latest
```

Exact requirements vary by Linux distribution and kernel version. If BLE scanning
fails, check that `bluetoothd` is running on the host and accessible via dbus.

### Verifying Bluetooth Access

On the host, run:

```bash
bluetoothctl show
```

You should see your adapter listed with `Powered: yes`. If not, run
`bluetoothctl power on`.

To confirm the Coyote is discoverable:

```bash
bluetoothctl scan on
# Look for "D-LAB ESTIM01" or similar in the scan output
```

---

## Device Pairing

The Coyote V3 uses BLE without traditional bonding — pairing in the OS sense is not
required. The provider scans for the device by its BLE service UUID (`955A180A-...`)
and connects directly.

1. Power on your Coyote device
2. Ensure no other app (DG-LAB mobile app, etc.) is connected to it
3. Start PlayRooms — the provider will scan and connect automatically

Scan timeout is configurable in the provider settings (`scanTimeout`, default 15s).

---

## Configuration

Available in the PlayRooms provider settings panel:

| Setting | Default | Description |
|---------|---------|-------------|
| `scanTimeout` | 15000ms | How long to scan for the device before giving up |
| `logLevel` | `info` | Log verbosity: `debug`, `info`, `warn`, `error` |

---

## Panel Controls

See [CONTROLS.md](./CONTROLS.md) for the full control reference.

Summary:
- **Channel A & B intensity** — ramp sliders, 0–200
- **Channel A & B waveform** — pattern pickers
- **Link channels** — sync A and B together
- **Emergency stop** — immediately halts all output
- **Status indicators** — battery %, channel active state, physical dial positions

---

## Safety

Read [SAFETY.md](./SAFETY.md). Key points:

- Never place electrodes above the waist
- Never use with a pacemaker, ICD, or electronic medical implant
- Always start at intensity 0 and increase gradually
- Emergency stop sends a hardware-level zero command via BLE in < 100ms
- BLE disconnect causes the device to stop immediately (hardware failsafe)

---

## Architecture

This plugin implements the `ProviderInterface` defined in the PlayRooms host repository.
See `PlayRooms/docs/ARCHITECTURE-v1.0.md` §3.3 for the interface contract.

The full BLE implementation (connecting, B0 command loop, B1 feedback handling, BF
configuration, battery monitoring) is planned for Milestone 5.

Protocol reference: `DG-LAB-OPENSOURCE/coyote/v3/README_V3.md`

---

## License

MIT — see [LICENSE](./LICENSE).

Third-party attributions: see [NOTICE.md](./NOTICE.md).
