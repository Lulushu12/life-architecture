import { Capacitor } from "@capacitor/core";

export const IS_NATIVE = Capacitor.isNativePlatform();

export const ENGINE_LOADING = IS_NATIVE ? "Loading engine…" : "Loading engine (first time: ~39 MB)…";
