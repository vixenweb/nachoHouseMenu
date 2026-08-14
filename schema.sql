CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  menu_type TEXT NOT NULL CHECK(menu_type IN ('food', 'drinks')),
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0 CHECK(price >= 0),
  sort_order INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(menu_type, sort_order);
