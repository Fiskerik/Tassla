# SQLCipher SDK57 — syntetiskt Linuxprov

Datum 2026-11-12. Detta är ett fristående källprov, inte appkod, native Expo-brygga, iOS eller en aktiverad offlinekö. Källan kommer från npm-paketet `expo-sqlite@57.0.3` (tarball SHA-256 `1766ba239d7716dd2b255c5636418e6d4fc150bd2fd58427987a32d97c80f66f`). Båda C-filerna använder endast syntetisk nyckel och syntetiska värden i `/tmp`.

På Linux byggdes paketets vendrade SQLCipher med OpenSSL och proven kördes. Fel nyckel avvisades; `synchronous=FULL` efter `BEGIN` gav fel. I ett WAL/FULL-prov följdes processavbrott före COMMIT av tom tabell och processavbrott efter COMMIT av en rad efter återöppning. Den syntetiska klartexten hittades inte i DB-/WAL-/SHM-filerna i den kontrollerade körningen. Detta bevisar inte iOS/CommonCrypto, Expo-bridge, strömavbrott, backup, säker fil-/nyckelradering eller generell kraschgaranti.

Reproducerbar förberedelse, med C-kompilator och OpenSSL-utvecklingsbibliotek:

```sh
mkdir -p /tmp/tassla-sqlite-package
npm_config_cache=/tmp/tassla-npm-cache npm pack expo-sqlite@57.0.3 --pack-destination /tmp
sha256sum /tmp/expo-sqlite-57.0.3.tgz
tar -xzf /tmp/expo-sqlite-57.0.3.tgz -C /tmp/tassla-sqlite-package
cc -O0 -D_GNU_SOURCE -include stdint.h -DSQLITE_TEMP_STORE=2 -DSQLITE_HAS_CODEC=1 -DSQLCIPHER_CRYPTO_OPENSSL -DSQLITE_EXTRA_INIT=sqlcipher_extra_init -DSQLITE_EXTRA_SHUTDOWN=sqlcipher_extra_shutdown -DNDEBUG -I/tmp/tassla-sqlite-package/package/vendor/sqlcipher docs/design/evidence/gap-offline-sqlcipher-01/probe.c /tmp/tassla-sqlite-package/package/vendor/sqlcipher/sqlite3.c -lcrypto -lpthread -ldl -lm -o /tmp/tassla-sqlcipher-probe
cc -O0 -D_GNU_SOURCE -include stdint.h -DSQLITE_TEMP_STORE=2 -DSQLITE_HAS_CODEC=1 -DSQLCIPHER_CRYPTO_OPENSSL -DSQLITE_EXTRA_INIT=sqlcipher_extra_init -DSQLITE_EXTRA_SHUTDOWN=sqlcipher_extra_shutdown -DNDEBUG -I/tmp/tassla-sqlite-package/package/vendor/sqlcipher docs/design/evidence/gap-offline-sqlcipher-01/crash.c /tmp/tassla-sqlite-package/package/vendor/sqlcipher/sqlite3.c -lcrypto -lpthread -ldl -lm -o /tmp/tassla-sqlcipher-crash
/tmp/tassla-sqlcipher-probe
```

Kraschprov får bara köras mot den särskilda syntetiska `/tmp/tassla-sqlcipher-crash.db` och dess sidojournaler. Ta bort dessa syntetiska filer före provet, kör `before` och sedan `read` (tomt), kör `after` och kontrollera den syntetiska klartexten i filerna före `read` (en rad). `_exit` avslutar processen abrupt; det simulerar inte strömavbrott. Paketet är inte installerat i appen.

I den dokumenterade körningen fanns direkt efter `after` och före återöppningen alla tre filerna: DB 8 192 byte, WAL 4 152 byte och SHM 32 768 byte. En sökning efter exakt `SYNTHETIC_COMMITTED_VALUE` gav ingen träff i någon av dessa tre. Det visar endast frånvaro av den markören i dessa filer vid detta tillfälle, inte att all metadata eller annan klartext är skyddad.
