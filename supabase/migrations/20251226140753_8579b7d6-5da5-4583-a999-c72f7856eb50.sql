-- Allow admins to upload to broadcasts folder in checkout-assets bucket
CREATE POLICY "Admins can upload broadcast media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'checkout-assets' 
  AND (storage.foldername(name))[1] = 'broadcasts'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update broadcast media
CREATE POLICY "Admins can update broadcast media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'checkout-assets' 
  AND (storage.foldername(name))[1] = 'broadcasts'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete broadcast media
CREATE POLICY "Admins can delete broadcast media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'checkout-assets' 
  AND (storage.foldername(name))[1] = 'broadcasts'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);