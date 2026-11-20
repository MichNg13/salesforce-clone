-- Demo data for Summit CRM (all companies and people are fictional).
-- Safe to re-run on an empty database. Records are created without an owner;
-- the first user who signs up becomes an admin and can reassign them.

insert into public.accounts (id, name, type, industry, rating, website, phone, annual_revenue, employees, billing_city, billing_country, description) values
  ('a0000000-0000-4000-8000-000000000001', 'Harborline Logistics', 'Customer', 'Transportation', 'Hot', 'https://harborline.example', '+65 6100 1001', 48000000, 420, 'Singapore', 'Singapore', 'Regional freight forwarder; expanding cold-chain fleet.'),
  ('a0000000-0000-4000-8000-000000000002', 'Copperleaf Health', 'Prospect', 'Healthcare', 'Warm', 'https://copperleaf.example', '+61 2 5550 2002', 125000000, 1800, 'Sydney', 'Australia', 'Private clinic network evaluating patient CRM.'),
  ('a0000000-0000-4000-8000-000000000003', 'Northwind Foundry', 'Customer', 'Manufacturing', 'Warm', 'https://northwind-foundry.example', '+1 312 555 0303', 310000000, 2600, 'Chicago', 'United States', 'Industrial castings; long-time support customer.'),
  ('a0000000-0000-4000-8000-000000000004', 'Bluepeak Software', 'Partner', 'Technology', 'Hot', 'https://bluepeak.example', '+44 20 5550 0404', 22000000, 160, 'London', 'United Kingdom', 'Implementation partner for APAC and EMEA.'),
  ('a0000000-0000-4000-8000-000000000005', 'Saffron & Sage Hospitality', 'Prospect', 'Hospitality', 'Cold', 'https://saffronsage.example', '+60 3 5550 0505', 64000000, 900, 'Kuala Lumpur', 'Malaysia', 'Boutique hotel group with 14 properties.'),
  ('a0000000-0000-4000-8000-000000000006', 'Meridian Capital Partners', 'Customer', 'Financial Services', 'Hot', 'https://meridiancap.example', '+852 5550 0606', 540000000, 750, 'Hong Kong', 'Hong Kong', 'Asset manager; renewal due next quarter.');

insert into public.contacts (id, salutation, first_name, last_name, account_id, title, department, email, phone, lead_source) values
  ('c0000000-0000-4000-8000-000000000001', 'Ms.', 'Mei Ling', 'Tan', 'a0000000-0000-4000-8000-000000000001', 'COO', 'Operations', 'meiling.tan@harborline.example', '+65 6100 1011', 'Trade Show'),
  ('c0000000-0000-4000-8000-000000000002', 'Mr.', 'Arjun', 'Pillai', 'a0000000-0000-4000-8000-000000000001', 'IT Director', 'IT', 'arjun.pillai@harborline.example', '+65 6100 1012', 'Trade Show'),
  ('c0000000-0000-4000-8000-000000000003', 'Dr.', 'Olivia', 'Brennan', 'a0000000-0000-4000-8000-000000000002', 'Chief Medical Officer', 'Clinical', 'o.brennan@copperleaf.example', '+61 2 5550 2012', 'Web'),
  ('c0000000-0000-4000-8000-000000000004', 'Mr.', 'Marcus', 'Webb', 'a0000000-0000-4000-8000-000000000003', 'VP Procurement', 'Procurement', 'mwebb@northwind-foundry.example', '+1 312 555 0313', 'Partner Referral'),
  ('c0000000-0000-4000-8000-000000000005', 'Ms.', 'Priya', 'Raman', 'a0000000-0000-4000-8000-000000000004', 'Head of Alliances', 'Partnerships', 'priya@bluepeak.example', '+44 20 5550 0414', 'Partner Referral'),
  ('c0000000-0000-4000-8000-000000000006', 'Mr.', 'Daniel', 'Lim', 'a0000000-0000-4000-8000-000000000005', 'GM, Revenue', 'Sales', 'daniel.lim@saffronsage.example', '+60 3 5550 0515', 'Email Campaign'),
  ('c0000000-0000-4000-8000-000000000007', 'Ms.', 'Sophie', 'Chan', 'a0000000-0000-4000-8000-000000000006', 'CTO', 'Technology', 'sophie.chan@meridiancap.example', '+852 5550 0616', 'Phone Inquiry');

insert into public.products (id, name, product_code, family, list_price, description) values
  ('b0000000-0000-4000-8000-000000000001', 'Summit Pipeline — Enterprise seat (annual)', 'SPL-ENT', 'Software', 1800, 'Per-user annual subscription.'),
  ('b0000000-0000-4000-8000-000000000002', 'Summit Service Desk — seat (annual)', 'SSD-STD', 'Software', 1200, 'Per-agent annual subscription.'),
  ('b0000000-0000-4000-8000-000000000003', 'Implementation package', 'SVC-IMPL', 'Services', 25000, 'Fixed-scope onboarding, 8 weeks.'),
  ('b0000000-0000-4000-8000-000000000004', 'Premier support (annual)', 'SUP-PREM', 'Support', 9000, '24/7 support with named TAM.'),
  ('b0000000-0000-4000-8000-000000000005', 'Admin training (per attendee)', 'TRN-ADM', 'Training', 950, 'Two-day admin bootcamp.');

insert into public.opportunities (id, name, account_id, contact_id, stage, amount, close_date, type, lead_source, next_step) values
  ('d0000000-0000-4000-8000-000000000001', 'Harborline — Cold-chain CRM rollout', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Negotiation', null, current_date + 14, 'Existing Business', 'Trade Show', 'Legal review of MSA'),
  ('d0000000-0000-4000-8000-000000000002', 'Copperleaf — Patient engagement pilot', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'Needs Analysis', 85000, current_date + 45, 'New Business', 'Web', 'Discovery workshop'),
  ('d0000000-0000-4000-8000-000000000003', 'Northwind — Service Desk expansion', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Proposal', 140000, current_date + 30, 'Upsell', 'Partner Referral', 'Send revised quote'),
  ('d0000000-0000-4000-8000-000000000004', 'Saffron & Sage — Guest CRM', 'a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006', 'Prospecting', 60000, current_date + 75, 'New Business', 'Email Campaign', 'Intro call'),
  ('d0000000-0000-4000-8000-000000000005', 'Meridian — 2027 renewal', 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'Qualification', 210000, current_date + 60, 'Renewal', 'Phone Inquiry', 'Usage review'),
  ('d0000000-0000-4000-8000-000000000006', 'Northwind — Analytics add-on', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Closed Won', 48000, current_date - 20, 'Upsell', 'Partner Referral', null),
  ('d0000000-0000-4000-8000-000000000007', 'Meridian — Wealth portal', 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'Closed Lost', 95000, current_date - 40, 'New Business', 'Phone Inquiry', null);

insert into public.opportunity_products (opportunity_id, product_id, quantity, discount) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 60, 10),
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 1, 0),
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 1, 0);

insert into public.leads (first_name, last_name, company, title, email, phone, status, rating, lead_source, industry, city, country) values
  ('Hannah', 'Okafor', 'Lumen Grid Energy', 'Head of Customer Ops', 'hannah@lumengrid.example', '+234 1 555 0701', 'New', 'Hot', 'Web', 'Energy', 'Lagos', 'Nigeria'),
  ('Kenji', 'Morita', 'Tsubame Robotics', 'Sales Director', 'k.morita@tsubame.example', '+81 3 5550 0702', 'Working', 'Warm', 'Trade Show', 'Manufacturing', 'Osaka', 'Japan'),
  ('Elena', 'Vasquez', 'Altamira Foods', 'CMO', 'elena@altamira.example', '+34 91 555 0703', 'Nurturing', 'Warm', 'Advertisement', 'Food & Beverage', 'Madrid', 'Spain'),
  ('Tom', 'Gallagher', 'Quayside Property Group', 'Managing Director', 'tom@quayside.example', '+353 1 555 0704', 'Qualified', 'Hot', 'Partner Referral', 'Real Estate', 'Dublin', 'Ireland'),
  ('Aisha', 'Rahman', 'Kestrel Learning', 'Operations Lead', 'aisha@kestrel.example', '+65 6100 0705', 'New', 'Cold', 'Email Campaign', 'Education', 'Singapore', 'Singapore'),
  ('Lucas', 'Ferreira', 'Verde Mobility', 'Founder', 'lucas@verdemobility.example', '+55 11 5550 0706', 'Unqualified', 'Cold', 'Other', 'Transportation', 'São Paulo', 'Brazil');

insert into public.cases (subject, account_id, contact_id, status, priority, origin, type, description) values
  ('Email-to-case routing stopped overnight', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'Working', 'High', 'Email', 'Problem', 'No new cases created from support inbox since 02:00.'),
  ('Request: add SSO for contractors', 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'New', 'Medium', 'Web', 'Feature Request', 'Wants a separate identity provider for contractor logins.'),
  ('Report export times out', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'Escalated', 'Critical', 'Phone', 'Problem', 'Quarterly pipeline export fails above 50k rows.'),
  ('How to bulk-reassign accounts?', 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'Closed', 'Low', 'Chat', 'Question', 'Walked through list-view mass reassign.');

insert into public.activities (subject, type, status, priority, due_date, account_id, contact_id, opportunity_id, description) values
  ('Send redlined MSA to Mei Ling', 'Email', 'Not Started', 'High', current_date + 1, 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', null),
  ('Discovery workshop prep', 'Task', 'In Progress', 'Normal', current_date + 3, 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'Agenda + stakeholder map.'),
  ('Quarterly business review', 'Meeting', 'Not Started', 'Normal', current_date + 10, 'a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000005', null),
  ('Follow-up call on revised quote', 'Call', 'Not Started', 'High', current_date - 1, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000003', null),
  ('Kickoff notes', 'Note', 'Completed', 'Low', current_date - 20, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000006', 'Signed; analytics team onboarding in two waves.');
