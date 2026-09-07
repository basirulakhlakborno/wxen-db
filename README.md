# wxen-db

Private JSON the wxen app loads from the OTA Worker (`/api/db`). Edit and push. No key, no seal.

```
# edit src/config.json
git add src/config.json
git commit -m "Update endpoints."
git push
```

Phones pick it up within about a minute. Do not make this repo public.
