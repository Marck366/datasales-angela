-- Sub-contacts: add is_primary flag to contacts
ALTER TABLE public.contacts ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Mark the oldest contact per company as primary
UPDATE public.contacts c SET is_primary = true
WHERE c.id = (
  SELECT id FROM public.contacts
  WHERE company_id = c.company_id
  ORDER BY created_at ASC LIMIT 1
);

-- Index for fast sibling lookups
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

-- Only one primary contact per company
CREATE UNIQUE INDEX idx_one_primary_per_company
  ON public.contacts(company_id)
  WHERE is_primary = true;
