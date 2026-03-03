ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';

ALTER TABLE public.profiles
ALTER COLUMN display_name SET DEFAULT '';

ALTER TABLE public.profiles
ALTER COLUMN avatar_url SET DEFAULT '';
