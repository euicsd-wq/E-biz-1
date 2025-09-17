import React, { useState } from 'react';
import { ClipboardDocumentListIcon, CheckCircleIcon } from './icons';

const fullSchema = `
-- 0. Create custom types
DROP TYPE IF EXISTS public."tender_status" CASCADE;
CREATE TYPE public."tender_status" AS ENUM ('Watching', 'Applying', 'Submitted', 'Won', 'Lost', 'Archived');
DROP TYPE IF EXISTS public."team_member_role" CASCADE;
CREATE TYPE public."team_member_role" AS ENUM ('Admin', 'Manager', 'Member');

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    company_profile jsonb,
    ai_config jsonb,
    document_settings jsonb,
    mail_settings jsonb
);

-- 2. Create Team Members Table (with foreign key to auth.users)
DROP TABLE IF EXISTS public.team_members CASCADE;
CREATE TABLE public.team_members (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name text,
    email text,
    role public.team_member_role,
    permissions jsonb
);

-- 3. Simplified and Robust Function & Trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create a row in public.profiles for the new user.
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  
  -- Create a corresponding row in public.team_members.
  -- Using NULLIF to prevent casting an empty string to the enum, which would fail.
  INSERT INTO public.team_members (id, name, email, role, permissions)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email, 
    (NULLIF(new.raw_user_meta_data->>'role', ''))::public.team_member_role,
    new.raw_user_meta_data->'permissions'
  );

  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Re-apply the trigger to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create all other application tables
CREATE TABLE IF NOT EXISTS public.sources (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, url text NOT NULL);
CREATE TABLE IF NOT EXISTS public.watchlist (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, tender_id text NOT NULL, tender jsonb, status public."tender_status", added_at timestamptz, assigned_team_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL, category text, quote_items jsonb, invoices jsonb, notes text, financial_details jsonb, technical_offer_type text, documents jsonb, purchase_orders jsonb, risk_assessment jsonb, ai_summary text, ai_insights jsonb, UNIQUE(user_id, tender_id));
CREATE TABLE IF NOT EXISTS public.catalog (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, item_type text, category text, item_name text, description text, manufacturer text, model text, sale_price numeric, cost numeric, uom text, vendor_id uuid, assigned_person_id uuid, technical_specs jsonb, documents jsonb, hsn_code text);
CREATE TABLE IF NOT EXISTS public.vendors (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, name text, vendor_type text, address text, city text, country text, email text, phone text, whatsapp text, website text, contact_person text, assigned_team_member_id uuid, notes text, bank_name text, bank_account_number text, tax_id text, documents jsonb);
CREATE TABLE IF NOT EXISTS public.clients (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, name text, address text, email text, phone text, contact_person text, contacts jsonb, interactions jsonb, documents jsonb);
CREATE TABLE IF NOT EXISTS public.shipments (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, tender_id text, vendor_id uuid, status text, awb_number text, tracking_link text, pickup_location text, pickup_date date, delivery_location text, delivery_date date, cost numeric, awb_document jsonb, pod_document jsonb, grn_document jsonb);
CREATE TABLE IF NOT EXISTS public.tasks (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, title text, description text, tender_id text, assigned_to_id uuid, assigned_by_id uuid, due_date date, status text);
CREATE TABLE IF NOT EXISTS public.task_templates (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, name text, tasks jsonb);
CREATE TABLE IF NOT EXISTS public.expenses (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, category text, description text, amount numeric, date date, tender_id text);
CREATE TABLE IF NOT EXISTS public.notifications (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, type text, message text, tender_id text, is_read boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, name text, type text);
CREATE TABLE IF NOT EXISTS public.journal_entries (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, date date, description text, transactions jsonb);

-- NEW: Normalized tables for activity and comments
CREATE TABLE IF NOT EXISTS public.activity_log (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, watchlist_id uuid REFERENCES public.watchlist(id) ON DELETE CASCADE, "timestamp" timestamptz DEFAULT now(), type text, description text, tender_id text, tender_title text);
CREATE TABLE IF NOT EXISTS public.comments (id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, watchlist_id uuid REFERENCES public.watchlist(id) ON DELETE CASCADE, author_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL, text text, created_at timestamptz DEFAULT now(), mentions jsonb);


-- 5. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Helper function to get a user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid) RETURNS text AS $$ DECLARE user_role text; BEGIN SELECT role::text INTO user_role FROM public.team_members WHERE id = user_id; RETURN user_role; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Macro for collaborative tables
CREATE OR REPLACE PROCEDURE create_collaborative_rls(table_name TEXT) LANGUAGE plpgsql AS $$
BEGIN
  -- Allow all team members to view all items
  EXECUTE format('DROP POLICY IF EXISTS "Team members can view items." ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "Team members can view items." ON public.%I FOR SELECT USING (auth.role() = ''authenticated'');', table_name);

  -- Allow users to insert their own items
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert their own items." ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "Users can insert their own items." ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);', table_name);

  -- Allow owners, managers, and admins to update items
  EXECUTE format('DROP POLICY IF EXISTS "Owners, managers and admins can update items." ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "Owners, managers and admins can update items." ON public.%I FOR UPDATE USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ''Admin'' OR get_user_role(auth.uid()) = ''Manager'');', table_name);

  -- Allow owners, managers, and admins to delete items
  EXECUTE format('DROP POLICY IF EXISTS "Owners, managers and admins can delete items." ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "Owners, managers and admins can delete items." ON public.%I FOR DELETE USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ''Admin'' OR get_user_role(auth.uid()) = ''Manager'');', table_name);
END;
$$;

-- Apply collaborative policies to relevant tables
CALL create_collaborative_rls('sources');
CALL create_collaborative_rls('watchlist');
CALL create_collaborative_rls('catalog');
CALL create_collaborative_rls('vendors');
CALL create_collaborative_rls('clients');
CALL create_collaborative_rls('shipments');
CALL create_collaborative_rls('tasks');
CALL create_collaborative_rls('task_templates');
CALL create_collaborative_rls('expenses');
CALL create_collaborative_rls('activity_log');
CALL create_collaborative_rls('comments');


-- Policies for Accounting tables (restricted to Admins/Managers)
CREATE OR REPLACE PROCEDURE create_finance_rls(table_name TEXT) LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "Admins and managers can manage accounting." ON public.%I;', table_name);
  EXECUTE format('CREATE POLICY "Admins and managers can manage accounting." ON public.%I FOR ALL USING (get_user_role(auth.uid()) = ''Admin'' OR get_user_role(auth.uid()) = ''Manager'');', table_name);
END;
$$;
CALL create_finance_rls('journal_entries');
CALL create_finance_rls('chart_of_accounts');

-- Specific policy for notifications (private)
DROP POLICY IF EXISTS "Users can manage their own data." ON public.notifications;
CREATE POLICY "Users can manage their own data." ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. RLS for profiles and team_members
DROP POLICY IF EXISTS "Users can manage their own profiles." ON public.profiles;
CREATE POLICY "Users can manage their own profiles." ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Team Members Policies
DROP POLICY IF EXISTS "Authenticated users can view team members." ON public.team_members;
CREATE POLICY "Authenticated users can view team members." ON public.team_members FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage team members, users can update their own profile." ON public.team_members;
CREATE POLICY "Admins can manage team members, users can update their own profile." ON public.team_members FOR ALL
USING (get_user_role(auth.uid()) = 'Admin' OR id = auth.uid())
WITH CHECK (get_user_role(auth.uid()) = 'Admin' OR id = auth.uid());
`;

const SqlSchema: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleCopy = () => {
        if (textAreaRef.current) {
            textAreaRef.current.select();
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-slate-800/80 p-6 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-white">Database Schema Setup</h2>
            <p className="text-sm text-slate-400 my-4">
                To set up your Supabase backend, copy the entire SQL script below and run it in your Supabase project's SQL Editor. 
                This will create all necessary tables and security policies.
            </p>
            <div className="relative">
                <textarea
                    ref={textAreaRef}
                    readOnly
                    value={fullSchema}
                    className="w-full h-64 bg-slate-900 text-slate-300 font-mono text-xs p-4 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 flex items-center px-3 py-1.5 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
                >
                    {copied ? (
                        <>
                            <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400"/> Copied!
                        </>
                    ) : (
                        <>
                            <ClipboardDocumentListIcon className="w-4 h-4 mr-2"/> Copy Schema
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SqlSchema;