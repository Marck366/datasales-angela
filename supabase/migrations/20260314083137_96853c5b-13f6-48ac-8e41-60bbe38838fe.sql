
-- Seed events data (no auth dependency)
INSERT INTO public.events (name, date, city, type, attending, description, website) VALUES
  ('Forum Sostenibilidad CV', '2026-03-12', 'Valencia', 'Forum', true, 'Principal foro de sostenibilidad de la Comunidad Valenciana.', 'https://forumsostenibilidad.es'),
  ('Green Business Summit', '2026-03-25', 'Valencia', 'Summit', false, 'Cumbre de negocios verdes y economía circular.', NULL),
  ('Expo Circular Economy', '2026-04-08', 'Madrid', 'Expo', false, 'Exposición sobre economía circular e innovación sostenible.', NULL),
  ('ESG Reporting Day', '2026-04-22', 'Valencia', 'Jornada', true, 'Jornada sobre reporting ESG y normativa CSRD.', NULL),
  ('Smart Agro Valencia', '2026-05-06', 'Valencia', 'Expo', false, NULL, NULL),
  ('Barcelona ESG Forum', '2026-05-20', 'Barcelona', 'Forum', false, NULL, NULL),
  ('Jornada CSRD Empresas', '2026-06-03', 'Valencia', 'Jornada', true, NULL, NULL),
  ('Green Startup Forum', '2026-06-17', 'Valencia', 'Forum', false, NULL, NULL),
  ('Expo Eficiencia Energética', '2026-07-01', 'Madrid', 'Expo', false, NULL, NULL),
  ('Forum RSC Levante', '2026-09-15', 'Alicante', 'Forum', false, NULL, NULL),
  ('Valencia Tech Week', '2026-10-06', 'Valencia', 'Tech', true, NULL, NULL),
  ('Congreso ESG España', '2026-10-20', 'Madrid', 'Congreso', false, NULL, NULL);

-- Seed companies
INSERT INTO public.companies (id, name, sector) VALUES
  ('00000000-0000-0000-0000-000000000001', 'TRANSPORTES MARITIM', 'Logística'),
  ('00000000-0000-0000-0000-000000000002', 'COPISA', 'Construcción'),
  ('00000000-0000-0000-0000-000000000003', 'CALCONUT', 'Alimentación'),
  ('00000000-0000-0000-0000-000000000004', 'MIRAI', 'Tecnología'),
  ('00000000-0000-0000-0000-000000000005', 'PLATOS TRADICIONALES', 'Alimentación'),
  ('00000000-0000-0000-0000-000000000006', 'GRUPO AZA', 'Industrial');
