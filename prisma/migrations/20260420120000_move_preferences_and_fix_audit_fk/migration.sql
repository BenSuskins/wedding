-- Move allergiesText and songRequestText from rsvp_response to invite
ALTER TABLE "invite" ADD COLUMN "allergiesText" TEXT;
ALTER TABLE "invite" ADD COLUMN "songRequestText" TEXT;
ALTER TABLE "rsvp_response" DROP COLUMN "allergiesText";
ALTER TABLE "rsvp_response" DROP COLUMN "songRequestText";

-- Fix FK on rsvp_audit_log so invites with audit entries can be deleted
ALTER TABLE "rsvp_audit_log" DROP CONSTRAINT "rsvp_audit_log_inviteId_fkey";
ALTER TABLE "rsvp_audit_log" ALTER COLUMN "inviteId" DROP NOT NULL;
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
