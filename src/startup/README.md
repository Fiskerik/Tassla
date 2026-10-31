# Startskärm

Expo splash-screen57.0.10 konfigureras i app.json med varm #F7F1E7 och befintlig Tasslaikon. `app/_layout.tsx` skapar `createStartupSplash` på modulnivå; första rootlayout eller en 2 s watchdog från JS-modulstart döljer den. Om förhindrandet svarar sent efter layout begärs döljning igen. SDK-fel blockeras inte. Ingen nätverks-/authväntan. Standardfaden på Android ställs till noll och iOS-fade stängs av; faktisk nativeeffekt är inte verifierad här. Watchdog kan inte hantera fel eller blockering innan JS körs.

Kontroll: `node --test tests/native-readiness.test.mjs`, `pnpm check`, `pnpm bundle:ios`. Expo JS-export visar inte native startbild. Ikonens opaka bakgrund #F7F3EA avviker svagt från startytans #F7F1E7; eventuell kant måste bedömas på en ny nativebuild.
