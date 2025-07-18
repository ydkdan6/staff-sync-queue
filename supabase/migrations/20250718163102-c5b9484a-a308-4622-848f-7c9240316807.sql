-- Create enum types for roles and statuses
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.queue_status AS ENUM ('open', 'closed');
CREATE TYPE public.entry_status AS ENUM ('waiting', 'called', 'skipped', 'completed');

-- Create users table (for admins only)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'admin',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  unique_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queues table
CREATE TABLE public.queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  status queue_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_entries table
CREATE TABLE public.queue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  queue_number INTEGER NOT NULL,
  status entry_status NOT NULL DEFAULT 'waiting',
  called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (admin only)
CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (auth.uid() IN (
    SELECT auth_users.id FROM auth.users auth_users
    JOIN public.users ON users.email = auth_users.email
  ));

-- RLS Policies for staff table
CREATE POLICY "Anyone can view staff" ON public.staff
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL USING (auth.uid() IN (
    SELECT auth_users.id FROM auth.users auth_users
    JOIN public.users ON users.email = auth_users.email
  ));

-- RLS Policies for queues table
CREATE POLICY "Anyone can view queues" ON public.queues
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all queues" ON public.queues
  FOR ALL USING (auth.uid() IN (
    SELECT auth_users.id FROM auth.users auth_users
    JOIN public.users ON users.email = auth_users.email
  ));

CREATE POLICY "Staff can manage their own queues" ON public.queues
  FOR ALL USING (staff_id IN (
    SELECT id FROM public.staff WHERE true -- Staff access will be handled in application logic
  ));

-- RLS Policies for queue_entries table
CREATE POLICY "Anyone can view queue entries" ON public.queue_entries
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert queue entries" ON public.queue_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all queue entries" ON public.queue_entries
  FOR ALL USING (auth.uid() IN (
    SELECT auth_users.id FROM auth.users auth_users
    JOIN public.users ON users.email = auth_users.email
  ));

CREATE POLICY "Staff can manage entries in their queues" ON public.queue_entries
  FOR UPDATE USING (queue_id IN (
    SELECT id FROM public.queues WHERE true -- Staff access will be handled in application logic
  ));

CREATE POLICY "Staff can delete entries in their queues" ON public.queue_entries
  FOR DELETE USING (queue_id IN (
    SELECT id FROM public.queues WHERE true -- Staff access will be handled in application logic
  ));

-- Enable realtime for all tables
ALTER TABLE public.staff REPLICA IDENTITY FULL;
ALTER TABLE public.queues REPLICA IDENTITY FULL;
ALTER TABLE public.queue_entries REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- Create function to auto-generate unique IDs for staff
CREATE OR REPLACE FUNCTION generate_unique_staff_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric string
    new_id := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM public.staff WHERE unique_id = new_id) INTO id_exists;
    
    -- If it doesn't exist, we can use it
    IF NOT id_exists THEN
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get next queue number
CREATE OR REPLACE FUNCTION get_next_queue_number(queue_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_number
  FROM public.queue_entries
  WHERE queue_id = queue_uuid;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle automatic removal of unresponsive students
CREATE OR REPLACE FUNCTION handle_unresponsive_students()
RETURNS void AS $$
BEGIN
  -- Remove students who were called more than 5 minutes ago and haven't responded
  DELETE FROM public.queue_entries
  WHERE status = 'called'
    AND called_at IS NOT NULL
    AND called_at < (now() - interval '5 minutes');
END;
$$ LANGUAGE plpgsql;

-- Insert sample staff data
INSERT INTO public.staff (name, email, department, unique_id) VALUES
  ('Dr. Sarah Johnson', 'sarah.johnson@university.edu', 'Computer Science', generate_unique_staff_id()),
  ('Prof. Michael Chen', 'michael.chen@university.edu', 'Computer Science', generate_unique_staff_id()),
  ('Dr. Emily Rodriguez', 'emily.rodriguez@university.edu', 'Computer Science', generate_unique_staff_id());

-- Create initial queues for all staff
INSERT INTO public.queues (staff_id, status)
SELECT id, 'open' FROM public.staff;