INSERT INTO calendar_events (
  pet_id,
  title,
  event_date,
  event_time,
  type,
  location,
  notes,
  is_completed
)
SELECT
  pets.id,
  cal.title,
  cal.event_date,
  cal.event_time,
  cal.type,
  cal.location,
  cal.notes,
  cal.is_completed
FROM (
  VALUES
    ('alice@example.com',  '900138000000001', '年度健康檢查',         DATE '2026-07-10', TIME '10:00', 'vet'::event_type,        '台北市大安動物醫院',    '記得帶疫苗手冊',          FALSE),
    ('alice@example.com',  '900138000000001', '狂犬病疫苗',            DATE '2026-08-05', TIME '14:30', 'vaccine'::event_type,    '台北市大安動物醫院',    NULL,                      FALSE),
    ('alice@example.com',  '900138000000001', '寵物美容',              DATE '2026-06-25', TIME '11:00', 'grooming'::event_type,   '毛孩沙龍',             '修指甲+洗澡+造型',        FALSE),
    ('bob@example.com',    '900138000000002', '例行健診',              DATE '2026-07-03', TIME '09:30', 'vet'::event_type,        '信義貓咪診所',          NULL,                      FALSE),
    ('bob@example.com',    '900138000000002', '餵心絲蟲預防藥',        DATE '2026-06-20', NULL,         'medication'::event_type, NULL,                   '每月固定一次',             TRUE),
    ('carol@example.com',  '900138000000003', '關節炎回診',            DATE '2026-07-15', TIME '15:00', 'vet'::event_type,        '中山動物醫院',          '帶上次X光片',             FALSE),
    ('carol@example.com',  '900138000000003', '洗澡',                  DATE '2026-06-28', TIME '13:00', 'bath'::event_type,       '全能寵物美容',          NULL,                      FALSE),
    ('carol@example.com',  '900138000000003', '服從訓練課程',          DATE '2026-07-01', TIME '10:00', 'training'::event_type,   '寵物運動公園',          '第三堂課',                FALSE),
    ('david@example.com',  '900138000000004', '牙齒檢查',              DATE '2026-07-20', TIME '11:30', 'vet'::event_type,        '小動物診所',            '兔子牙齒過長需定期檢查',   FALSE),
    ('david@example.com',  '900138000000004', '指甲修剪',              DATE '2026-06-22', NULL,         'grooming'::event_type,   NULL,                   '自行在家修剪',             TRUE),
    ('emma@example.com',   '900138000000005', '絕育術後回診',          DATE '2026-07-08', TIME '10:30', 'vet'::event_type,        '愛貓動物醫院',          '確認傷口癒合狀況',         FALSE),
    ('emma@example.com',   '900138000000005', '三合一疫苗',            DATE '2026-09-01', TIME '14:00', 'vaccine'::event_type,    '愛貓動物醫院',          NULL,                      FALSE)
) AS cal (owner_email, microchip_number, title, event_date, event_time, type, location, notes, is_completed)
JOIN users ON users.email = cal.owner_email
JOIN pets ON pets.user_id = users.id AND pets.microchip_number = cal.microchip_number
WHERE NOT EXISTS (
  SELECT 1
  FROM calendar_events existing
  WHERE existing.pet_id = pets.id
    AND existing.title = cal.title
    AND existing.event_date = cal.event_date
    AND existing.event_time IS NOT DISTINCT FROM cal.event_time
    AND existing.type = cal.type
);
