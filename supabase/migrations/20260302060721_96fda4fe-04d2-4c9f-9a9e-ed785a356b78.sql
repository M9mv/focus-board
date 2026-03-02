
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Board',
  bg_color TEXT NOT NULL DEFAULT 'hsl(0, 0%, 0%)',
  grid_color TEXT NOT NULL DEFAULT 'hsl(0, 0%, 100%)',
  show_grid BOOLEAN NOT NULL DEFAULT true,
  is_collaborative BOOLEAN NOT NULL DEFAULT false,
  camera_x FLOAT NOT NULL DEFAULT 0,
  camera_y FLOAT NOT NULL DEFAULT 0,
  zoom FLOAT NOT NULL DEFAULT 1,
  zoom_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Board members table
CREATE TABLE public.board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- Board elements table
CREATE TABLE public.board_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 240,
  height FLOAT NOT NULL DEFAULT 200,
  z_index INT NOT NULL DEFAULT 1,
  title TEXT,
  content TEXT,
  emoji TEXT,
  file_name TEXT,
  color TEXT,
  rotation FLOAT,
  thickness FLOAT,
  divider_color TEXT,
  image_url TEXT,
  todos JSONB,
  mindmap_nodes JSONB,
  mindmap_connections JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.board_elements ENABLE ROW LEVEL SECURITY;

-- Board invites (share links)
CREATE TABLE public.board_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.board_invites ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_board_owner(_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards WHERE id = _board_id AND owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_board_member(_board_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards WHERE id = _board_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.board_members WHERE board_id = _board_id AND user_id = auth.uid()
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add owner as board_member on board creation
CREATE OR REPLACE FUNCTION public.handle_new_board()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_board_created
  AFTER INSERT ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_board();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_board_elements_updated_at BEFORE UPDATE ON public.board_elements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Boards
CREATE POLICY "Users can create boards" ON public.boards FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Members can view boards" ON public.boards FOR SELECT TO authenticated USING (public.is_board_member(id));
CREATE POLICY "Owners can update boards" ON public.boards FOR UPDATE TO authenticated USING (public.is_board_owner(id));
CREATE POLICY "Owners can delete boards" ON public.boards FOR DELETE TO authenticated USING (public.is_board_owner(id));

-- Board members
CREATE POLICY "Members can view members" ON public.board_members FOR SELECT TO authenticated USING (public.is_board_member(board_id));
CREATE POLICY "Owners can add members" ON public.board_members FOR INSERT TO authenticated WITH CHECK (public.is_board_owner(board_id) AND role = 'editor');
CREATE POLICY "Owners can remove editors" ON public.board_members FOR DELETE TO authenticated USING (public.is_board_owner(board_id) AND role = 'editor');

-- Board elements
CREATE POLICY "Members can view elements" ON public.board_elements FOR SELECT TO authenticated USING (public.is_board_member(board_id));
CREATE POLICY "Members can create elements" ON public.board_elements FOR INSERT TO authenticated WITH CHECK (public.is_board_member(board_id));
CREATE POLICY "Members can update elements" ON public.board_elements FOR UPDATE TO authenticated USING (public.is_board_member(board_id));
CREATE POLICY "Members can delete elements" ON public.board_elements FOR DELETE TO authenticated USING (public.is_board_member(board_id));

-- Board invites
CREATE POLICY "Owners can create invites" ON public.board_invites FOR INSERT TO authenticated WITH CHECK (public.is_board_owner(board_id));
CREATE POLICY "Owners can view invites" ON public.board_invites FOR SELECT TO authenticated USING (public.is_board_owner(board_id));
CREATE POLICY "Owners can delete invites" ON public.board_invites FOR DELETE TO authenticated USING (public.is_board_owner(board_id));
-- Anyone authenticated can read invite by token (for accepting)
CREATE POLICY "Anyone can read invite by token" ON public.board_invites FOR SELECT TO authenticated USING (true);

-- Enable realtime for collaborative boards
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_elements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_members;
