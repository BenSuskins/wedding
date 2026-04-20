-- Move allergies_text and song_request_text from rsvp_response to invite
ALTER TABLE "invite" ADD COLUMN "allergies_text" TEXT;
ALTER TABLE "invite" ADD COLUMN "song_request_text" TEXT;
ALTER TABLE "rsvp_response" DROP COLUMN "allergies_text";
ALTER TABLE "rsvp_response" DROP COLUMN "song_request_text";

-- Fix FK on rsvp_audit_log so invites with audit entries can be deleted
ALTER TABLE "rsvp_audit_log" DROP CONSTRAINT "rsvp_audit_log_inviteId_fkey";
ALTER TABLE "rsvp_audit_log" ALTER COLUMN "inviteId" DROP NOT NULL;
ALTER TABLE "rsvp_audit_log" ADD CONSTRAINT "rsvp_audit_log_inviteId_fkey"
  FOREIGN KEY ("inviteId") REFERENCES "invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
