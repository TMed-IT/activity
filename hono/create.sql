CREATE TABLE user(
  id TEXT PRIMARY KEY,
  screen_name TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  -- 公開状態．public: 公開, private: 非公開, internal: 学内限定
  visibility TEXT NOT NULL,
  -- リストに表示するか
  listed BOOLEAN NOT NULL,
  -- 過去の記録を表示するか
  displays_past BOOLEAN NOT NULL,
  -- トークンのハッシュ値
  hashed_token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  updated_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  UNIQUE (screen_name)
);

CREATE TABLE location(
  id TEXT PRIMARY KEY, -- e.g. uomori
  created_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  updated_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime'))
);

-- (ユーザ, 日付, 場所) をキーとする
CREATE TABLE checkin(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  day INT NOT NULL,
  hours INT NOT NULL,
  location_id TEXT NOT NULL,
  count INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  updated_at TIMESTAMP NOT NULL DEFAULT (DATETIME('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (location_id) REFERENCES location(id),
  UNIQUE (user_id, year, month, day, hours, location_id)
);

CREATE TRIGGER trigger_user_updated_at AFTER UPDATE ON user
BEGIN
  UPDATE user SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;

CREATE TRIGGER trigger_checkin_updated_at AFTER UPDATE ON checkin
BEGIN
  UPDATE checkin SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;

CREATE TRIGGER trigger_location_updated_at AFTER UPDATE ON location
BEGIN
  UPDATE location SET updated_at = DATETIME('now', 'localtime') WHERE rowid == NEW.rowid;
END;

INSERT INTO location (id) VALUES ("uomori");
INSERT INTO location (id) VALUES ("others");
