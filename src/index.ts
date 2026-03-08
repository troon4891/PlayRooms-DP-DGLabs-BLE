/**
 * PlayRooms DG-LAB BLE Device Provider
 *
 * Controls DG-LAB Coyote e-stim devices via direct Bluetooth Low Energy connection.
 * No mobile app bridge needed — connects directly to the Coyote hardware.
 *
 * ⚠️  SAFETY-CRITICAL: This provider controls electrical stimulation hardware.
 * Read SAFETY.md before modifying any code in this provider.
 *
 * Requires Bluetooth adapter on the host machine.
 * See CLAUDE.md "Host Requirements" for hardware requirements.
 *
 * Full ProviderInterface implementation happens in Milestone 5.
 */

export const PROVIDER_NAME = "dglab-ble";
export const PROVIDER_VERSION = "1.0.0";
export const PROVIDER_API_VERSION = 1;

// TODO: Implement ProviderInterface (Milestone 5)
// Key implementation tasks:
// - BLE connection to Coyote V3 (service UUID: 955A180A-...)
// - B0 characteristic: 20-byte command packets at 100ms intervals
//   (mode flags + channel A intensity + channel B intensity + waveform data)
// - B1 characteristic: strength feedback from physical scroll wheels (notify)
// - BF characteristic: soft limits and frequency balance configuration
// - Battery monitoring via standard BLE battery service (0x1500)
// - Emergency stop (zero both channels immediately via B0)
// - Handle BLE disconnect/reconnect gracefully
