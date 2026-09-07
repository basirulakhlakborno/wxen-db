# wxen-db

Encrypted API / cookie DB for wxen. GitHub holds `wxen.enc` only. The decrypt key lives in the APK, not this repo.

```
# edit src/config.json (local, gitignored)
node scripts/seal.js
git add wxen.enc
git commit -m "Refresh sealed db."
git push
```

Phones fetch `wxen.enc` and decrypt on device. Needs `.wxen-db.key` on the machine that seals — never commit that file.
