--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, username, password) FROM stdin;
b6069959-700e-4865-a2a6-5e6b581e58b4	cnwkorea	eb0ddb8dda20b8c7ac7c9bdceb0dca5ff06d3c5223ba2a7ab16fd10310701be92adafcbd704f7761f210877bab7dde26afe73bd73b8c63b28e36df30e078cbd8.e8c76ce7fbe99ebdf5589cca6504376f
\.


--
-- Data for Name: content_icons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_icons (id, icon_title, icon_image, content_type, content_source, display_order, created_at) FROM stdin;
24a9b639-0628-4702-88b5-b9ae4f73262e	Laptop Set-Up	/uploads/ced15a0edd9610087f6b045c2f1efae8	Link	https://app.guidde.com/share/playbooks/r84L54nXsik92hnLcY7UKZ?origin=sGleb44MsHUrZiqZi4rrMZQcFbv1	1	2025-08-27 01:59:03.52038
4d126536-f82a-4613-be36-354aff26b05e	명함 수령	/uploads/1a33ef43f12f2dcb453c0b86bc58ce66	Image	/uploads/b1a4a487dcf91628bceba00b993eca97	3	2025-08-27 04:55:35.32118
9045f77c-0421-4ce7-9d3e-7e0db1901546	사원증 수령	/uploads/1d61dd43dc22d4968e2a7529a7b31905	Image	/uploads/b78012718767d9263cc1bc6d0ae1eec7	2	2025-08-27 06:10:21.533484
7aabc535-0015-4098-8415-228a12efc466	19층 지도	/uploads/28dce9e810704edb2e33ddaf3b6cc325	Link	https://app.guidde.com/share/playbooks/ts7Uny9W888RmRoKKv5b1C?origin=sGleb44MsHUrZiqZi4rrMZQcFbv1	5	2025-08-27 04:11:25.273862
3893fba3-7876-4a16-835d-e874792e94ca	모바일 출입카드 발급	/uploads/c9989ed75838e7bec2065cdf2227096b	Image	/uploads/5827d6c393a25e15cdf1a6827447be35	4	2025-08-27 06:15:14.283083
365cae04-5482-4f26-9609-41d1bb1b512e	배정된 사물함 등록	/uploads/b31e3283ab461ac0e880e4ebb4321052	Image	/uploads/c5d311aa82d9e07366210c2da78cf92d	6	2025-08-27 07:04:22.547024
\.


--
-- Data for Name: content_images; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_images (id, content_id, image_url, image_order, created_at, image_caption) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.employees (id, user_name, user_password, email, buddy_name, locker_number, laptop_info, created_at) FROM stdin;
ab8f702b-593e-41a2-abbc-098fa49ff706	김경만	9011	Noel.kim@cushwake.com	Noel Kim	B-01	485r4wge	2025-08-27 01:14:59.522344
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_progress (id, employee_id, content_id, completed, completed_at, created_at) FROM stdin;
4ac3a0d9-7f20-43ed-aaad-9b35024c8d52	ab8f702b-593e-41a2-abbc-098fa49ff706	26622e25-e207-4519-9934-01a7e51097a6	1	2025-08-27 04:06:15.953	2025-08-27 04:06:15.985732
a184c51f-912a-4171-868d-d062b8c90af9	ab8f702b-593e-41a2-abbc-098fa49ff706	24a9b639-0628-4702-88b5-b9ae4f73262e	1	2025-08-27 04:13:28.96	2025-08-27 03:56:12.484683
11ab696d-cc24-479e-b3af-1da38e574837	ab8f702b-593e-41a2-abbc-098fa49ff706	fc035860-8f0b-4eea-b0c8-41e58e70ba13	1	2025-08-27 04:13:36.458	2025-08-27 04:13:36.490366
5773dd90-d11e-4eaf-8fbf-5bf9aed91ac2	ab8f702b-593e-41a2-abbc-098fa49ff706	7aabc535-0015-4098-8415-228a12efc466	1	2025-08-27 04:13:48.164	2025-08-27 04:11:47.540275
e55808f2-f3ff-4a1d-b0df-8ba8c415437a	ab8f702b-593e-41a2-abbc-098fa49ff706	2013de42-5c4c-44f6-93a8-d4d76bdcb374	1	2025-08-27 04:24:21.789	2025-08-27 04:24:21.827931
75165c55-4e92-492d-b67a-eeeee1a93863	ab8f702b-593e-41a2-abbc-098fa49ff706	cdb3c511-6341-4d11-8457-a7b9f46ef34a	1	2025-08-27 04:25:27.223	2025-08-27 04:25:27.255858
09bff92d-32fc-41eb-ae38-3c52cdff22ef	ab8f702b-593e-41a2-abbc-098fa49ff706	9045f77c-0421-4ce7-9d3e-7e0db1901546	1	2025-08-27 07:04:38.145	2025-08-27 07:04:38.178615
e3c84c0d-8104-4c9f-8f00-1e65a75c933a	ab8f702b-593e-41a2-abbc-098fa49ff706	4d126536-f82a-4613-be36-354aff26b05e	1	2025-08-27 07:04:43.271	2025-08-27 07:04:43.304122
3fa2ad85-0cfd-4db8-b750-8916789a1f87	ab8f702b-593e-41a2-abbc-098fa49ff706	3893fba3-7876-4a16-835d-e874792e94ca	1	2025-08-27 07:04:52.26	2025-08-27 07:04:52.293038
47cda71e-bc40-49a7-a596-d1dc91d242df	ab8f702b-593e-41a2-abbc-098fa49ff706	365cae04-5482-4f26-9609-41d1bb1b512e	1	2025-08-27 07:08:06.5	2025-08-27 07:08:06.533927
\.


--
-- PostgreSQL database dump complete
--

