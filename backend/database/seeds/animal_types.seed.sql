INSERT INTO animal_types (
  name,
  slug
)
VALUES
  ('狗', 'dog'),
  ('貓', 'cat'),
  ('兔', 'rabbit'),
  ('鼠類', 'rodent'),
  ('鳥類', 'bird'),
  ('爬蟲類', 'reptile'),
  ('兩棲類', 'amphibian'),
  ('其他特殊寵物', 'other_exotic')
ON CONFLICT (slug) DO NOTHING;
