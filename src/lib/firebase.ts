import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth, type Persistence } from "firebase/auth";
import * as authModule from "firebase/auth";

import { firebaseConfig } from "./firebase-config";

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// `getReactNativePersistence` is provided at runtime via the package's
// "react-native" export condition, but its "types" export condition
// resolves to the browser-only public API and omits it from the typings.
const getReactNativePersistence = (
  authModule as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
