-- v16: Per-event WhatsApp invite message, written once at event
-- creation/edit time instead of retyped every time an admin opens the
-- "send invites" panel. NULL means "no custom message set" — the send
-- panel falls back to a generic default built from the event title.

ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_message text;
