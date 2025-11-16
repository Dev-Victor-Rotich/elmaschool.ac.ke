--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'teacher',
    'hod',
    'bursar',
    'chaplain',
    'student_leader',
    'class_rep',
    'student',
    'admin',
    'parent',
    'librarian',
    'classteacher'
);


--
-- Name: count_super_admins(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.count_super_admins() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COUNT(*)::integer
  FROM public.user_roles
  WHERE role = 'super_admin';
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT has_role(user_id, 'super_admin');
$$;


--
-- Name: log_admin_action(text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_admin_action(p_action_type text, p_target_user uuid, p_details text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.audit_logs (action_by, action_type, target_user, details)
  VALUES (auth.uid(), p_action_type, p_target_user, p_details);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: academic_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    term text NOT NULL,
    year integer NOT NULL,
    subject text NOT NULL,
    marks integer NOT NULL,
    grade text,
    remarks text,
    teacher_id uuid,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT academic_results_marks_check CHECK (((marks >= 0) AND (marks <= 100)))
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    target_audience text NOT NULL,
    created_by uuid,
    approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action_by uuid,
    action_type text NOT NULL,
    target_user uuid,
    details text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    event_type text NOT NULL,
    created_by uuid,
    approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fee_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    term text NOT NULL,
    year integer NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0 NOT NULL,
    amount_due numeric(10,2) NOT NULL,
    balance numeric(10,2) GENERATED ALWAYS AS ((amount_due - amount_paid)) STORED,
    payment_date timestamp with time zone,
    receipt_number text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    otp text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false,
    attempts integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    approval_status text DEFAULT 'pending'::text,
    approved_at timestamp with time zone,
    approved_by uuid,
    status text DEFAULT 'pending'::text,
    id_number text,
    CONSTRAINT profiles_approval_status_check CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'inactive'::text])))
);


--
-- Name: staff_registry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_registry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    id_number text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    created_by uuid,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_registry_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


--
-- Name: students_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    admission_number text NOT NULL,
    parent_name text NOT NULL,
    parent_phone text NOT NULL,
    class text NOT NULL,
    is_registered boolean DEFAULT false,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    email text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: academic_results academic_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_results
    ADD CONSTRAINT academic_results_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: fee_payments fee_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: staff_registry staff_registry_id_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_registry
    ADD CONSTRAINT staff_registry_id_number_key UNIQUE (id_number);


--
-- Name: staff_registry staff_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_registry
    ADD CONSTRAINT staff_registry_pkey PRIMARY KEY (id);


--
-- Name: students_data students_data_admission_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students_data
    ADD CONSTRAINT students_data_admission_number_key UNIQUE (admission_number);


--
-- Name: students_data students_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students_data
    ADD CONSTRAINT students_data_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: academic_results update_academic_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_academic_results_updated_at BEFORE UPDATE ON public.academic_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: announcements update_announcements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: fee_payments update_fee_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON public.fee_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: staff_registry update_staff_registry_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_staff_registry_updated_at BEFORE UPDATE ON public.staff_registry FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students_data update_students_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_students_data_updated_at BEFORE UPDATE ON public.students_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: academic_results academic_results_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_results
    ADD CONSTRAINT academic_results_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: academic_results academic_results_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_results
    ADD CONSTRAINT academic_results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students_data(id) ON DELETE CASCADE;


--
-- Name: academic_results academic_results_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_results
    ADD CONSTRAINT academic_results_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_action_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_action_by_fkey FOREIGN KEY (action_by) REFERENCES auth.users(id);


--
-- Name: audit_logs audit_logs_target_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_target_user_fkey FOREIGN KEY (target_user) REFERENCES auth.users(id);


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: fee_payments fee_payments_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: fee_payments fee_payments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students_data(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: staff_registry staff_registry_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_registry
    ADD CONSTRAINT staff_registry_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: students_data students_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students_data
    ADD CONSTRAINT students_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: staff_registry Admins can view staff registry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view staff registry" ON public.staff_registry FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: otp_codes Anyone can insert OTP; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert OTP" ON public.otp_codes FOR INSERT WITH CHECK (true);


--
-- Name: announcements Anyone can view approved announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved announcements" ON public.announcements FOR SELECT USING ((approved = true));


--
-- Name: events Anyone can view approved events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved events" ON public.events FOR SELECT USING ((approved = true));


--
-- Name: fee_payments Bursar can manage fee payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Bursar can manage fee payments" ON public.fee_payments USING (public.has_role(auth.uid(), 'bursar'::public.app_role));


--
-- Name: academic_results HODs can view and approve results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "HODs can view and approve results" ON public.academic_results USING (public.has_role(auth.uid(), 'hod'::public.app_role));


--
-- Name: announcements Staff can create announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create announcements" ON public.announcements FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'student_leader'::public.app_role) OR public.has_role(auth.uid(), 'class_rep'::public.app_role)));


--
-- Name: events Staff can create events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can create events" ON public.events FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'teacher'::public.app_role) OR public.has_role(auth.uid(), 'chaplain'::public.app_role) OR public.has_role(auth.uid(), 'student_leader'::public.app_role)));


--
-- Name: students_data Students can view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own data" ON public.students_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: fee_payments Students can view own fees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own fees" ON public.fee_payments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.students_data
  WHERE ((students_data.id = fee_payments.student_id) AND (students_data.user_id = auth.uid())))));


--
-- Name: academic_results Students can view own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own results" ON public.academic_results FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.students_data
  WHERE ((students_data.id = academic_results.student_id) AND (students_data.user_id = auth.uid())))));


--
-- Name: announcements Super admins can manage all announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all announcements" ON public.announcements USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: events Super admins can manage all events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all events" ON public.events USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: staff_registry Super admins can manage staff registry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage staff registry" ON public.staff_registry USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: students_data Super admins can manage students data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage students data" ON public.students_data USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: profiles Super admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: audit_logs Super admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: profiles Super admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);


--
-- Name: academic_results Teachers can manage results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can manage results" ON public.academic_results USING (public.has_role(auth.uid(), 'teacher'::public.app_role));


--
-- Name: students_data Teachers can view students data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view students data" ON public.students_data FOR SELECT USING (public.has_role(auth.uid(), 'teacher'::public.app_role));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: otp_codes Users can update their own OTP; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own OTP" ON public.otp_codes FOR UPDATE USING (true);


--
-- Name: otp_codes Users can verify their own OTP; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can verify their own OTP" ON public.otp_codes FOR SELECT USING (true);


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (((auth.uid() = id) AND (status = 'approved'::text)));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: academic_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_results ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: fee_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_registry; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_registry ENABLE ROW LEVEL SECURITY;

--
-- Name: students_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students_data ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


