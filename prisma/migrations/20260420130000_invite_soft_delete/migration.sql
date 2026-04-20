-- Add soft-delete to invite so hard-deleting (which would trigger the
-- append-only audit log constraint via ON DELETE SET NULL) is never needed.
ALTER TABLE "invite" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Revert the inviteId FK back to non-nullable RESTRICT.
-- The SET NULL approach was blocked by the append-only trigger on rsvp_audit_log.
-- No rows were ever SET NULL (all deletes failed), so this is safe.
ALTER TABLE "rsvp_audit_log" DROP CONSTRAINT "rsvp_audit_log_inviteId_fkey";
ALTER TABLE "rsvp_audit_log" ALTER COLUMN "inviteId" SET NOT NULL;
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
