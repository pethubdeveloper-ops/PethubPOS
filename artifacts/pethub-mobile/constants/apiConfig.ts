/**
 * Derive the shared API base URL.
 *
 * Platform.OS is the correct way to branch native vs web in React Native.
 * The `typeof window` check is NOT reliable — on native, Hermes/JSC expose
 * `window` as an alias to `global`, so that check always returns true and the
 * web branch runs on device, constructing a broken URL from window.location.
 *
 * - Native (iOS/Android): always use the deployed production server.
 * - Web (Expo web / browser): derive the host from window.location so the
 *   dev-server proxy works in Replit without hard-coding a domain.
 */
import { Platform } from 'react-native';

const PRODUCTION_API = 'https://ShopPET.replit.app/api/pethub';

function resolveApiBase(): string {
  if (Platform.OS === 'web') {
    // e.g. "abc123.expo.pike.replit.dev" → "abc123.pike.replit.dev"
    const host = window.location.host.replace('.expo.', '.');
    return `https://${host}/api/pethub`;
  }
  // iOS / Android — always use the deployed production server
  return PRODUCTION_API;
}

export const API_BASE = resolveApiBase();
