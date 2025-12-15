-- Adicionar colunas para rastreamento de acesso e status
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL;

-- Criar tabela para progresso de aulas
CREATE TABLE public.member_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.module_lessons(id) ON DELETE CASCADE,
  completed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(member_id, lesson_id)
);

-- Habilitar RLS
ALTER TABLE public.member_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para member_lesson_progress
CREATE POLICY "Members can view their own progress"
ON public.member_lesson_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = member_lesson_progress.member_id
    AND members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can insert their own progress"
ON public.member_lesson_progress
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = member_lesson_progress.member_id
    AND members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete their own progress"
ON public.member_lesson_progress
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = member_lesson_progress.member_id
    AND members.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can view progress of their product members"
ON public.member_lesson_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members
    JOIN public.products ON products.id = members.product_id
    WHERE members.id = member_lesson_progress.member_id
    AND products.seller_id = auth.uid()
  )
);

-- Política para permitir update no members (para last_accessed_at)
CREATE POLICY "Members can update their own last_accessed_at"
ON public.members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para sellers atualizarem status dos membros
CREATE POLICY "Sellers can update their product members"
ON public.members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = members.product_id
    AND products.seller_id = auth.uid()
  )
);

-- Criar bucket para conteúdo de aulas
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-content', 'lesson-content', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para o bucket lesson-content
CREATE POLICY "Sellers can upload lesson content"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-content' AND
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can update their lesson content"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'lesson-content' AND
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.seller_id = auth.uid()
  )
);

CREATE POLICY "Sellers can delete their lesson content"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'lesson-content' AND
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.seller_id = auth.uid()
  )
);

CREATE POLICY "Members can view lesson content"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'lesson-content' AND
  (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.user_id = auth.uid()
      AND (members.expires_at IS NULL OR members.expires_at > now())
      AND members.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.seller_id = auth.uid()
    )
  )
);