INSERT INTO growth_records (
    pet_id, 
    metric_type, 
    value, 
    unit, 
    recorded_at, 
    notes
    )
SELECT
    pets.id,
    growth.metric_type::metric_type_enum,
    growth.value,
    growth.unit,
    growth.recorded_at,
    growth.notes
FROM (
  VALUES
    ('900138000000001', 'weight', 5.20, 'kg', TIMESTAMP '2021-06-15 10:00:00', 'Three months checkup'),
    ('900138000000001', 'weight', 7.10, 'kg', TIMESTAMP '2021-12-15 10:00:00', 'Six months checkup'),
    ('900138000000001', 'weight', 8.20, 'kg', TIMESTAMP '2022-06-15 10:00:00', 'One year checkup'),
    ('900138000000002', 'weight', 2.50, 'kg', TIMESTAMP '2021-02-02 10:00:00', 'Three months checkup'),
    ('900138000000002', 'weight', 3.80, 'kg', TIMESTAMP '2021-05-02 10:00:00', 'Six months checkup'),
    ('900138000000002', 'weight', 4.80, 'kg', TIMESTAMP '2021-11-02 10:00:00', 'One year checkup'),
    ('900138000000003', 'weight', 8.00, 'kg', TIMESTAMP '2020-01-21 10:00:00', 'Six months checkup'),
    ('900138000000003', 'weight', 12.50, 'kg', TIMESTAMP '2020-07-21 10:00:00', 'One year checkup'),
    ('900138000000003', 'weight', 16.50, 'kg', TIMESTAMP '2021-07-21 10:00:00', 'Two year checkup'),
    ('900138000000004', 'weight', 0.80, 'kg', TIMESTAMP '2022-04-10 10:00:00', 'Three months checkup'),
    ('900138000000004', 'weight', 1.30, 'kg', TIMESTAMP '2022-07-10 10:00:00', 'Six months checkup'),
    ('900138000000004', 'weight', 1.70, 'kg', TIMESTAMP '2023-01-10 10:00:00', 'One year checkup'),
    ('900138000000005', 'weight', 3.20, 'kg', TIMESTAMP '2019-03-30 10:00:00', 'Six months checkup'),
    ('900138000000005', 'weight', 4.50, 'kg', TIMESTAMP '2019-09-30 10:00:00', 'One year checkup'),
    ('900138000000005', 'weight', 5.30, 'kg', TIMESTAMP '2020-09-30 10:00:00', 'Two year checkup')
) AS growth (microchip_number, metric_type, value, unit, recorded_at, notes)
JOIN pets ON pets.microchip_number = growth.microchip_number
WHERE NOT EXISTS (
  SELECT 1
  FROM growth_records existing
  WHERE existing.pet_id = pets.id
    AND existing.metric_type = growth.metric_type::metric_type_enum
    AND existing.recorded_at = growth.recorded_at
    AND existing.value = growth.value
    AND existing.unit = growth.unit
);
