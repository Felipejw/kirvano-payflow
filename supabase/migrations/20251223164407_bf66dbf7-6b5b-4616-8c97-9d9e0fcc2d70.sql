-- =============================================
-- SISTEMA DE QUIZ/FUNIL - Fase 1
-- =============================================

-- 1. Tabela principal de quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  custom_slug TEXT,
  -- Pixels/Tracking
  facebook_pixel TEXT,
  google_analytics TEXT,
  tiktok_pixel TEXT,
  -- Design
  primary_color TEXT DEFAULT '#10b981',
  background_color TEXT DEFAULT '#ffffff',
  button_color TEXT DEFAULT '#10b981',
  text_color TEXT DEFAULT '#1f2937',
  logo_url TEXT,
  show_logo BOOLEAN DEFAULT true,
  show_progress_bar BOOLEAN DEFAULT true,
  allow_back_navigation BOOLEAN DEFAULT true,
  font_family TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for custom_slug per user
CREATE UNIQUE INDEX quizzes_custom_slug_unique ON public.quizzes (custom_slug) WHERE custom_slug IS NOT NULL;

-- 2. Tabela de etapas do quiz
CREATE TABLE public.quiz_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  step_type TEXT NOT NULL DEFAULT 'question', -- question, info, form, result, redirect
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de elementos dentro de cada etapa
CREATE TABLE public.quiz_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.quiz_steps(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL, -- title, text, image, video, options, button, input, audio, carousel, testimonial, faq, price, chart, alert, timer, comparison, confetti, loading, marquee, level
  order_index INTEGER NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}',
  styles JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de conexões do fluxo (editor visual)
CREATE TABLE public.quiz_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  source_step_id UUID NOT NULL REFERENCES public.quiz_steps(id) ON DELETE CASCADE,
  target_step_id UUID NOT NULL REFERENCES public.quiz_steps(id) ON DELETE CASCADE,
  condition JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de leads capturados
CREATE TABLE public.quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, qualified, completed, abandoned
  current_step_id UUID REFERENCES public.quiz_steps(id) ON DELETE SET NULL,
  interaction_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de respostas dos leads
CREATE TABLE public.quiz_lead_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.quiz_leads(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.quiz_steps(id) ON DELETE CASCADE,
  element_id UUID REFERENCES public.quiz_elements(id) ON DELETE SET NULL,
  response JSONB NOT NULL,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES para performance
-- =============================================
CREATE INDEX idx_quiz_steps_quiz_id ON public.quiz_steps(quiz_id);
CREATE INDEX idx_quiz_elements_step_id ON public.quiz_elements(step_id);
CREATE INDEX idx_quiz_connections_quiz_id ON public.quiz_connections(quiz_id);
CREATE INDEX idx_quiz_leads_quiz_id ON public.quiz_leads(quiz_id);
CREATE INDEX idx_quiz_leads_email ON public.quiz_leads(email);
CREATE INDEX idx_quiz_lead_responses_lead_id ON public.quiz_lead_responses(lead_id);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quizzes"
ON public.quizzes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quizzes"
ON public.quizzes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
ON public.quizzes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
ON public.quizzes FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quizzes"
ON public.quizzes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Public access for active quizzes (for public quiz page)
CREATE POLICY "Anyone can view active quizzes by slug"
ON public.quizzes FOR SELECT
USING (status = 'active' AND custom_slug IS NOT NULL);

-- Quiz Steps
ALTER TABLE public.quiz_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quiz steps"
ON public.quiz_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_steps.quiz_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Public can view steps of active quizzes"
ON public.quiz_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_steps.quiz_id
  AND quizzes.status = 'active'
));

-- Quiz Elements
ALTER TABLE public.quiz_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quiz elements"
ON public.quiz_elements FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.quiz_steps
  JOIN public.quizzes ON quizzes.id = quiz_steps.quiz_id
  WHERE quiz_steps.id = quiz_elements.step_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Public can view elements of active quizzes"
ON public.quiz_elements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quiz_steps
  JOIN public.quizzes ON quizzes.id = quiz_steps.quiz_id
  WHERE quiz_steps.id = quiz_elements.step_id
  AND quizzes.status = 'active'
));

-- Quiz Connections
ALTER TABLE public.quiz_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their quiz connections"
ON public.quiz_connections FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_connections.quiz_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Public can view connections of active quizzes"
ON public.quiz_connections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_connections.quiz_id
  AND quizzes.status = 'active'
));

-- Quiz Leads
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads of their quizzes"
ON public.quiz_leads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_leads.quiz_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Public can create leads"
ON public.quiz_leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update their own leads by session"
ON public.quiz_leads FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete leads of their quizzes"
ON public.quiz_leads FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.quizzes
  WHERE quizzes.id = quiz_leads.quiz_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Admins can view all leads"
ON public.quiz_leads FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Quiz Lead Responses
ALTER TABLE public.quiz_lead_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses of their quiz leads"
ON public.quiz_lead_responses FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.quiz_leads
  JOIN public.quizzes ON quizzes.id = quiz_leads.quiz_id
  WHERE quiz_leads.id = quiz_lead_responses.lead_id
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Public can create responses"
ON public.quiz_lead_responses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all responses"
ON public.quiz_lead_responses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));