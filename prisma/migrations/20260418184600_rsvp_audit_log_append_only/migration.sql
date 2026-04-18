-- Enforce the append-only invariant on rsvp_audit_log at the database level.
-- Triggers catch writes regardless of the connecting role, so this also protects
-- against mistakes by the app's own owner account.

CREATE OR REPLACE FUNCTION rsvp_audit_log_block_update_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'rsvp_audit_log is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rsvp_audit_log_no_update
    BEFORE UPDATE ON rsvp_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION rsvp_audit_log_block_update_delete();

CREATE TRIGGER rsvp_audit_log_no_delete
    BEFORE DELETE ON rsvp_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION rsvp_audit_log_block_update_delete();

CREATE TRIGGER rsvp_audit_log_no_truncate
    BEFORE TRUNCATE ON rsvp_audit_log
    FOR EACH STATEMENT
    EXECUTE FUNCTION rsvp_audit_log_block_update_delete();
