-- Auto-generated staging tables for CEO dashboard ingestion
-- Note: Column names starting with numbers are quoted as they're not valid SQL identifiers
-- Reserved words like "group" are also quoted

create table if not exists stg_concierge_report_weekly_report (
  id bigserial primary key,
  "10_17_25_10_23_25" varchar(26),
  ace timestamptz,
  adam timestamptz,
  tupac timestamptz,
  unnamed_4 varchar(194),
  unnamed_5 timestamptz
);

create table if not exists stg_concierge_report_night_time_calls (
  id bigserial primary key,
  "09_18_25" timestamptz,
  unnamed_1 varchar(30),
  unnamed_2 varchar(39)
);

create table if not exists stg_concierge_report_after_8_pm_est_calls (
  id bigserial primary key,
  sep_18_2025_8_36_53_pm varchar(24),
  kassing_emily_16025016607 varchar(27),
  unnamed_2 text
);

create table if not exists stg_cancelation_reports_september (
  id bigserial primary key,
  name varchar(18),
  reason varchar(43),
  membership varchar(46),
  advisor varchar(17),
  outcome varchar(171)
);

create table if not exists stg_cancelation_reports_november (
  id bigserial primary key,
  name varchar(19),
  reason varchar(42),
  membership varchar(22),
  advisor varchar(16),
  outcome text
);

create table if not exists stg_cancelation_reports_october (
  id bigserial primary key,
  name varchar(18),
  reason varchar(39),
  membership varchar(25),
  advisor varchar(17),
  outcome text
);

create table if not exists stg_cancelation_reports_december (
  id bigserial primary key,
  name varchar(25),
  reason varchar(61),
  membership varchar(27),
  advisor varchar(17),
  outcome text
);

create table if not exists stg_cancelation_reports_january (
  id bigserial primary key,
  name varchar(16),
  reason varchar(36),
  membership varchar(16),
  advisor varchar(30),
  outcome text
);

create table if not exists stg_cancelation_reports_february (
  id bigserial primary key,
  name varchar(28),
  reason varchar(51),
  membership varchar(17),
  advisor varchar(19),
  outcome text
);

create table if not exists stg_cancelation_reports_march (
  id bigserial primary key,
  name varchar(19),
  reason varchar(36),
  membership varchar(32),
  advisor varchar(17),
  outcome varchar(218)
);

create table if not exists stg_cancelation_reports_april (
  id bigserial primary key,
  name varchar(20),
  reason varchar(33),
  membership varchar(18),
  advisor varchar(18),
  outcome varchar(134)
);

create table if not exists stg_cancelation_reports_may_25 (
  id bigserial primary key,
  name varchar(20),
  reason varchar(47),
  membership varchar(16),
  advisor varchar(17),
  outcome varchar(182)
);

create table if not exists stg_cancelation_reports_june (
  id bigserial primary key,
  name varchar(18),
  reason varchar(36),
  membership varchar(12),
  advisor varchar(17),
  outcome text
);

create table if not exists stg_cancelation_reports_july (
  id bigserial primary key,
  name varchar(23),
  reason varchar(42),
  membership varchar(23),
  advisor varchar(17),
  outcome varchar(169),
  unnamed_5 varchar(5)
);

create table if not exists stg_cancelation_reports_august (
  id bigserial primary key,
  name varchar(24),
  reason varchar(37),
  membership varchar(24),
  advisor varchar(17),
  outcome varchar(222),
  unnamed_5 varchar(5),
  unnamed_6 varchar(5)
);

create table if not exists stg_cancelation_reports_september_2025 (
  id bigserial primary key,
  name varchar(22),
  reason varchar(37),
  membership varchar(29),
  advisor varchar(17),
  outcome text,
  unnamed_5 varchar(5)
);

create table if not exists stg_cancelation_reports_october_2025 (
  id bigserial primary key,
  name varchar(23),
  reason varchar(36),
  membership varchar(16),
  advisor varchar(17),
  outcome varchar(133)
);

create table if not exists stg_leads_reports_october_2025 (
  id bigserial primary key,
  date timestamptz,
  name varchar(18),
  source varchar(15),
  status varchar(13),
  lead_owner varchar(16),
  group_lead varchar(5),
  recent_notes varchar(105)
);

create table if not exists stg_sales_report_october (
  id bigserial primary key,
  date timestamptz,
  name varchar(29),
  plan varchar(14),
  size varchar(3),
  agent varchar(18),
  "group" varchar(5)
);
