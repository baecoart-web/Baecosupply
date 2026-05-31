-- ============================================================
-- BaecoSupply — Tabel job_posts cu două tipuri de anunțuri
-- post_type: 'firma_cauta' = firma recrutează
--            'persoana_cauta' = persoana caută job
-- ============================================================

CREATE TABLE IF NOT EXISTS job_posts (
  id                BIGSERIAL PRIMARY KEY,
  post_type         TEXT NOT NULL DEFAULT 'firma_cauta'
                    CHECK (post_type IN ('firma_cauta','persoana_cauta')),
  title             TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  -- Câmpuri comune
  county            TEXT NOT NULL,
  city              TEXT NOT NULL,
  category          TEXT NOT NULL,
  contract_type     TEXT,
  salary            TEXT,
  short_description TEXT,
  description       TEXT,
  requirements      TEXT,
  benefits          TEXT,
  phone             TEXT,
  email             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','expired')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  published_at      TIMESTAMPTZ,
  -- Câmpuri specifice post_type='firma_cauta'
  company_name      TEXT,
  company_slug      TEXT,
  -- Câmpuri specifice post_type='persoana_cauta'
  person_name       TEXT,
  experience_years  INTEGER,
  availability      TEXT   -- 'imediat', '2 saptamani', '1 luna'
);

CREATE INDEX IF NOT EXISTS idx_job_posts_status    ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_county    ON job_posts(county);
CREATE INDEX IF NOT EXISTS idx_job_posts_category  ON job_posts(category);
CREATE INDEX IF NOT EXISTS idx_job_posts_post_type ON job_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_job_posts_slug      ON job_posts(slug);

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved" ON job_posts
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone inserts pending" ON job_posts
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Admins full access" ON job_posts
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_job_posts_updated
  BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Date demo: firma cauta
INSERT INTO job_posts (post_type,title,slug,company_name,phone,email,county,city,category,salary,contract_type,short_description,description,requirements,benefits,status,published_at)
VALUES
  ('firma_cauta','Angajăm electrician autorizat','angajam-electrician-autorizat-1','Electric Total SRL','0756789012','hr@electrictotal.ro','Bacău','Bacău','Electricieni','5000-7000 RON','Timp întreg','Căutăm electrician autorizat ANRE pentru lucrări instalații.','Electrician autorizat ANRE grad IIB sau superior, experiență industrială și rezidențială.','Autorizație ANRE grad IIB, min. 2 ani experiență','Mașină serviciu, telefon, asigurare medicală','approved',NOW()),
  ('firma_cauta','Angajăm constructor șantier','angajam-constructor-santier-2','Construct Pro SRL','0745123456',NULL,'Iași','Iași','Constructori','4500-6000 RON','Timp întreg','Constructor cu experiență în zidărie și cofraje.','Constructor calificat pentru proiecte rezidențiale în zona Iași.','Min. 3 ani experiență, permis B','Cazare la șantier, masă, prime productivitate','approved',NOW()),
  ('firma_cauta','Angajăm instalator termic','angajam-instalator-termic-3','Termo Install SRL','0734567890','office@thermoinstall.ro','Suceava','Suceava','Instalatori','4000-5500 RON','Timp întreg','Instalator cu experiență centrale termice, țevi, radiatoare.','Lucrări rezidențiale și comerciale în Suceava.','Min. 2 ani experiență termice/sanitare','Program flexibil, bonusuri, echipament asigurat','approved',NOW())
ON CONFLICT (slug) DO NOTHING;

-- Date demo: persoana cauta
INSERT INTO job_posts (post_type,title,slug,person_name,phone,email,county,city,category,salary,contract_type,short_description,description,experience_years,availability,status,published_at)
VALUES
  ('persoana_cauta','Electrician disponibil pentru angajare','electrician-disponibil-1',NULL,'0722334455','ion.electric@gmail.com','Iași','Iași','Electricieni','negociabil','Timp întreg','Electrician cu 8 ani experiență instalații electrice, autorizat ANRE.','Electrician calificat, autorizat ANRE grad IIB. Experiență instalații rezidențiale, industriale. Disponibil imediat.',8,'imediat','approved',NOW()),
  ('persoana_cauta','Zidar calificat caută angajare','zidar-calificat-cauta-1',NULL,'0733221100',NULL,'Bacău','Bacău','Constructori','3500-5000 RON','Timp întreg','Zidar cu 5 ani experiență în construcții civile, disponibil în 2 săptămâni.',NULL,5,'2 saptamani','approved',NOW())
ON CONFLICT (slug) DO NOTHING;
