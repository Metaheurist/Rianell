-- Delete all data from anonymized_data table
DELETE FROM anonymized_data;

-- Reset the ID sequence to start from 1
ALTER SEQUENCE anonymized_data_id_seq RESTART WITH 1;

-- Verify deletion (should return 0)
SELECT COUNT(*) FROM anonymized_data;
