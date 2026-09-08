/*
  # Create Core Dashboard Tables - Fixed

  ## Overview
  Creates essential tables for CTO and CEO dashboards.

  ## Tables Created
  1. kpis - Key performance indicators
  2. roadmap_items - Feature roadmap
  3. projects - Project management
  4. quick_links - Bookmarked resources
  5. technologies - Tech stack inventory
  6. assignments - Task assignments
  7. notes - User notes

  ## Security
  - RLS enabled on all tables
  - Role-based access control
*/

-- KPIs Table
CREATE TABLE IF NOT EXISTS public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  target_value NUMERIC,
  unit TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  period TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CTO and admin full access to KPIs"
  ON public.kpis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cto', 'admin', 'ceo')
    )
  );

-- Roadmap Items Table
CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  start_date DATE,
  end_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CTO and admin full roadmap access"
  ON public.roadmap_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cto', 'admin')
    )
  );

CREATE POLICY "CEO read roadmap access"
  ON public.roadmap_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ceo'
    )
  );

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  owner UUID REFERENCES auth.users(id),
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  progress INTEGER DEFAULT 0,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CTO and admin full projects access"
  ON public.projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cto', 'admin')
    )
  );

CREATE POLICY "CEO read projects access"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ceo'
    )
  );

-- Quick Links Table
CREATE TABLE IF NOT EXISTS public.quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quick_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quick links"
  ON public.quick_links FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "CTO and admin all quick links"
  ON public.quick_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cto', 'admin')
    )
  );

-- Technologies Table
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  version TEXT,
  status TEXT DEFAULT 'active',
  vendor TEXT,
  cost NUMERIC,
  documentation_url TEXT,
  owner UUID REFERENCES auth.users(id),
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CTO and admin full tech access"
  ON public.technologies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('cto', 'admin')
    )
  );

CREATE POLICY "All users view technologies"
  ON public.technologies FOR SELECT
  TO authenticated
  USING (true);

-- Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
  ON public.notes FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kpis_category ON public.kpis(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_status ON public.roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_technologies_category ON public.technologies(category);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON public.notes(created_by);
