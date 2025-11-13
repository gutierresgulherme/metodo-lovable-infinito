-- Add explicit DELETE policy to prevent payment record deletion
CREATE POLICY "Prevent payment deletion"
ON payments
FOR DELETE
TO authenticated
USING (false);

-- Also add policy for anon role to be safe
CREATE POLICY "Prevent payment deletion anon"
ON payments
FOR DELETE
TO anon
USING (false);