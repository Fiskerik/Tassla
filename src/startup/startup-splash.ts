type SplashApi = {
  preventAutoHideAsync(): Promise<boolean>;
  hideAsync(): Promise<void>;
};

/** Release at first layout or after a bounded wait from JS startup. */
export function createStartupSplash(api: SplashApi, timeoutMs = 2000): () => void {
  let released = false;
  const hide = () => {
    try { void Promise.resolve(api.hideAsync()).catch(() => undefined); } catch { /* The app must remain usable. */ }
  };
  const release = () => {
    if (released) return;
    released = true;
    clearTimeout(timer);
    hide();
  };
  const timer = setTimeout(release, timeoutMs);
  try {
    void Promise.resolve(api.preventAutoHideAsync()).then(() => {
      if (released) hide();
    }).catch(() => undefined);
  } catch { /* Continue to the first-layout or timeout release. */ }
  // If prevention resolves late, hide again so it cannot re-cover the app.
  return release;
}
