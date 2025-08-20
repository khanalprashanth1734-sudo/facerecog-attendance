-- Remove duplicate attendance records, keeping only the earliest record per student per day
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY student_id, DATE(timestamp) 
      ORDER BY timestamp ASC
    ) as rn
  FROM attendance_records
)
DELETE FROM attendance_records 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);