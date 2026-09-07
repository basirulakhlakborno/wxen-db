# wxen-db

Encrypted remote config for the wxen app. Edit `src/config.json`, seal, push. Phones pick it up on the next launch — no APK / OTA.

`src/config.json` stays off git. Only `wxen.enc` is public.

```
copy src\config.example.json src\config.json
# edit src/config.json
node scripts/seal.js
git add wxen.enc
git commit -m "Refresh sealed config."
git push
```

Needs `.wxen-db.key` (64 hex chars) or `WXEN_DB_KEY` in the environment. Same key is baked into the app.
