import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

async function initDatabase(): Promise<Database> {
	if (db) return db;

	db = await Database.load("sqlite:stickers.db");

	await db.execute(`
		CREATE TABLE IF NOT EXISTS packs (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			created_at INTEGER NOT NULL, 
			display_order INTEGER NOT NULL, 
			is_favorite BOOLEAN DEFAULT 0
		)
	`);

	await db.execute(`
		CREATE TABLE IF NOT EXISTS stickers (
			id TEXT PRIMARY KEY,
			pack_id TEXT NOT NULL,
			filename TEXT NOT NULL,
			file_path TEXT NOT NULL,
			created_at INTEGER NOT NULL, 
			display_order INTEGER NOT NULL, 
			usage_count INTEGER DEFAULT 0, 
			last_used_at INTEGER, 
			is_favorite BOOLEAN DEFAULT 0,
			FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE
		)
	`);

	await db.execute(`
		CREATE TABLE IF NOT EXISTS tags (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL
		)
	`);

	await db.execute(`
		CREATE TABLE IF NOT EXISTS sticker_tags (
			sticker_id TEXT NOT NULL,
			tag_id INTEGER NOT NULL,
			PRIMARY KEY (sticker_id, tag_id),
			FOREIGN KEY (sticker_id) REFERENCES stickers(id) ON DELETE CASCADE,
			FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
		)
	`);

	await db.execute(
		"CREATE INDEX IF NOT EXISTS idx_stickers_pack_id ON stickers(pack_id)",
	);
	await db.execute(
		"CREATE INDEX IF NOT EXISTS idx_stickers_display_order ON stickers(display_order)",
	);
	await db.execute(
		"CREATE INDEX IF NOT EXISTS idx_packs_display_order ON packs(display_order)",
	);

	return db;
}

async function getDatabase(): Promise<Database> {
	if (!db) {
		return await initDatabase();
	}
	return db;
}

export { initDatabase, getDatabase };
