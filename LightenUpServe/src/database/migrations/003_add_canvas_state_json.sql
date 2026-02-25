ALTER TABLE canvases
  ADD COLUMN state_json JSON NULL,
  ADD COLUMN state_version INT NOT NULL DEFAULT 1,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE canvases
SET state_json = JSON_OBJECT(
  'layers', JSON_ARRAY(),
  'safeArea', JSON_OBJECT(
    'enabled', 1,
    'visible', 1,
    'top', 50,
    'right', 50,
    'bottom', 50,
    'left', 50,
    'color', '#00bfff'
  )
)
WHERE state_json IS NULL;

ALTER TABLE canvases
  MODIFY COLUMN state_json JSON NOT NULL;

