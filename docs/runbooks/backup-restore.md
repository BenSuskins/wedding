# Backup & restore runbook

The wedding app's durability story has three layers:

1. **Live Postgres** — primary source of truth.
2. **Nightly `pg_dump` custom-format archives** — written by `scripts/nightly-snapshot.ts` to `$BACKUP_DIR` (default `/var/backups/wedding`) with 14-day retention.
3. **Nightly CSV snapshot** — same script writes `rsvps-<ISO>.csv` next to each pg_dump. This is a belt-and-braces artifact: even if a restore goes wrong, the CSV preserves guest intent verbatim.

A weekly copy of the backup directory should be shipped off-host (rsync, object storage, etc.) outside the scope of this script.

## Running the snapshot script

```sh
DATABASE_URL=postgres://... \
BACKUP_DIR=/var/backups/wedding \
BACKUP_RETENTION_DAYS=14 \
pnpm exec tsx scripts/nightly-snapshot.ts
```

Schedule via a k8s CronJob or a host cron entry (example, nightly at 02:15):

```
15 2 * * * cd /opt/wedding && pnpm exec tsx scripts/nightly-snapshot.ts >> /var/log/wedding-snapshot.log 2>&1
```

Requirements on the runner: `pg_dump` binary available on `PATH`, write access to `$BACKUP_DIR`, `DATABASE_URL` reachable.

## Restoring from a pg_dump archive

1. **Stop the app** so writes don't race the restore:
   ```sh
   kubectl scale deploy/wedding --replicas=0
   ```
2. **Pick the snapshot** to restore (most recent unless investigating corruption):
   ```sh
   ls -1t /var/backups/wedding/pgdump-*.dump | head
   ```
3. **Create a fresh database** (do not drop the live one until the restore is verified):
   ```sh
   createdb wedding_restore
   pg_restore \
     --dbname=postgres://user:pw@host/wedding_restore \
     --clean --if-exists --no-owner --no-privileges \
     /var/backups/wedding/pgdump-<slug>.dump
   ```
4. **Point the app at the restored DB** (update `DATABASE_URL`) and bring a single replica back up:
   ```sh
   kubectl set env deploy/wedding DATABASE_URL=postgres://.../wedding_restore
   kubectl scale deploy/wedding --replicas=1
   ```
5. **Smoke-test**: load `/admin`, open the latest `rsvps-<slug>.csv`, spot-check a handful of rows against `/admin/export`. They should match.
6. **Promote**: rename or swap the restored database into place, then scale back to normal replicas.

## Recovering from the CSV snapshot (last resort)

If the pg_dump archives are unusable, the CSV captures the state that matters most — who is attending what, menu picks, allergies, song requests. There is no automated importer; this is a manual recovery path:

1. Re-create `Invite` + `Guest` rows from the CSV (they are stable IDs preserved in the export).
2. Re-create `Event` + `MenuCourse` + `MenuOption` rows from the admin UI or a separate export.
3. Use the CSV `attending`, `allergies`, `song_request`, and `menu_selections` columns to populate `RsvpResponse` + `RsvpMenuSelection`.
4. Backfill `RsvpAuditLog` with a single `restore` action per response (the live audit log cannot be reconstructed).

## Verifying the pipeline

- Inspect the nightly log for the `[snapshot] wrote ...` lines.
- Weekly: download the latest `rsvps-<slug>.csv`, diff against `/admin/export`.
- Quarterly: perform a full restore drill into a scratch database and confirm counts.
