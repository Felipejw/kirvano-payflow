-- Add position columns to quiz_steps for React Flow node positioning
ALTER TABLE public.quiz_steps 
ADD COLUMN IF NOT EXISTS position_x double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y double precision DEFAULT 0;