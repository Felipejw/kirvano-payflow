-- Add column to track when the broadcast was last processed
-- This prevents multiple instances from processing the same broadcast simultaneously
ALTER TABLE whatsapp_broadcasts 
ADD COLUMN IF NOT EXISTS last_processing_at TIMESTAMPTZ;