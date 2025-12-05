import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import {
	BaseDirectory,
	exists,
	mkdir,
	remove,
	writeFile,
} from "@tauri-apps/plugin-fs";
import { getDatabase } from "@/lib/database";

interface StickerPack {
	id: string;
	name: string;
	created_at: number;
	display_order: number;
	is_favorite: boolean;
	stickers: Sticker[];
}

interface Sticker {
	id: string;
	pack_id: string;
	filename: string;
	file_path: string;
	display_order: number;
	created_at: number;
	usage_count: number;
	last_used_at: number | null;
	is_favorite: boolean;
	url: string;
}

async function getStickerUrl(relativePath: string): Promise<string> {
	const appData = await appDataDir();
	const abosolutePath = `${appData}/${relativePath}`;
	return convertFileSrc(abosolutePath);
}

async function initStickerStorage() {
	try {
		const dirExist = await exists("stickers", {
			baseDir: BaseDirectory.AppData,
		});
		if (!dirExist) {
			await mkdir("stickers", {
				baseDir: BaseDirectory.AppData,
				recursive: true,
			});
			console.log("Created sticker storage");
		}
	} catch (e) {
		console.error("Error initalizing sticker storage: ", e);
	}
}

async function importStickerPack(files: File[]): Promise<StickerPack> {
	const db = await getDatabase();
	const packId = crypto.randomUUID();
	const packDir = `stickers/${packId}`;
	const now = Date.now();

	await mkdir(packDir, {
		baseDir: BaseDirectory.AppData,
		recursive: true,
	});

	const result = await db.select<Array<{ max_order: number | null }>>(
		"SELECT MAX(display_order) as max_order FROM packs",
	);
	const nextPackOrder = (result[0]?.max_order ?? -1) + 1;
	await db.execute(
		"INSERT INTO packs (id, name, created_at, display_order, is_favorite) VALUES (?, ?, ?, ?, ?)",
		[
			packId,
			`Pack ${new Date(now).toLocaleDateString()}`,
			now,
			nextPackOrder,
			false,
		],
	);
	const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

	const stickers: Sticker[] = [];
	for (let i = 0; i < sortedFiles.length; i++) {
		const file = sortedFiles[i];
		const stickerId = crypto.randomUUID();
		const destPath = `${packDir}/${file.name}`;

		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		await writeFile(destPath, uint8Array, {
			baseDir: BaseDirectory.AppData,
		});

		await db.execute(
			`INSERT INTO stickers
			(id, pack_id, filename, file_path, display_order, created_at, usage_count, last_used_at, is_favorite)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[stickerId, packId, file.name, destPath, i, now, 0, null, false],
		);

		const url = await getStickerUrl(destPath);
		stickers.push({
			id: stickerId,
			pack_id: packId,
			filename: file.name,
			file_path: destPath,
			display_order: i,
			created_at: now,
			usage_count: 0,
			last_used_at: null,
			is_favorite: false,
			url,
		});

		console.log("Imported sticker: ", file.name, "URL: ", url);
	}

	return {
		id: packId,
		name: `Pack ${new Date(now).toLocaleDateString()}`,
		created_at: now,
		display_order: nextPackOrder,
		is_favorite: false,
		stickers,
	};
}

async function addStickersToExistingPack(
	packId: string,
	files: File[],
): Promise<StickerPack> {
	const db = await getDatabase();
	const packDir = `stickers/${packId}`;
	const now = Date.now();

	const result = await db.select<Array<{ max_order: number | null }>>(
		"SELECT MAX(display_order) as max_order FROM stickers WHERE pack_id = ?",
		[packId],
	);
	const max_order = result[0]?.max_order ?? -1;
	const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
	for (let i = 0; i < sortedFiles.length; i++) {
		const file = sortedFiles[i];
		const stickerId = crypto.randomUUID();
		const destPath = `${packDir}/${file.name}`;

		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		await writeFile(destPath, uint8Array, {
			baseDir: BaseDirectory.AppData,
		});

		await db.execute(
			`INSERT INTO stickers
			(id, pack_id, filename, file_path, display_order, created_at, usage_count, last_used_at, is_favorite)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				stickerId,
				packId,
				file.name,
				destPath,
				max_order + i + 1,
				now,
				0,
				null,
				false,
			],
		);

		console.log("Added sticker: ", file.name);
	}
	return await loadStickerPack(packId);
}

async function loadStickerPack(packId: string): Promise<StickerPack> {
	const db = await getDatabase();

	const packResult = await db.select<
		Array<{
			id: string;
			name: string;
			created_at: number;
			display_order: number;
			is_favorite: boolean;
		}>
	>("SELECT * FROM packs WHERE id = ?", [packId]);

	if (packResult.length === 0) {
		throw new Error(`Pack ${packId} not found`);
	}

	const pack = packResult[0];
	const stickerResult = await db.select<Array<Omit<Sticker, "url">>>(
		"SELECT * FROM stickers WHERE pack_id = ? ORDER BY display_order ASC",
		[packId],
	);
	const stickers: Sticker[] = await Promise.all(
		stickerResult.map(async (s) => ({
			...s,
			url: await getStickerUrl(s.file_path),
		})),
	);

	return {
		...pack,
		stickers,
	};
}

async function loadUserStickerPacks(): Promise<StickerPack[]> {
	const db = await getDatabase();

	const packResult = await db.select<
		Array<{
			id: string;
			name: string;
			created_at: number;
			display_order: number;
			is_favorite: boolean;
		}>
	>("SELECT * FROM packs ORDER BY display_order ASC");

	const packs: StickerPack[] = [];
	for (const pack of packResult) {
		const stickerResult = await db.select<Array<Omit<Sticker, "url">>>(
			"SELECT * FROM stickers WHERE pack_id = ? ORDER BY display_order ASC",
			[pack.id],
		);
		const stickers: Sticker[] = await Promise.all(
			stickerResult.map(async (s) => ({
				...s,
				url: await getStickerUrl(s.file_path),
			})),
		);
		packs.push({
			...pack,
			stickers,
		});
	}

	console.log("Loaded packs: ", packs);
	return packs;
}

async function deleteStickers(stickerIds: string[]): Promise<void> {
	const db = await getDatabase();

	for (const stickerId of stickerIds) {
		const result = await db.select<Array<{ file_path: string }>>(
			"SELECT file_path FROM stickers WHERE id = ?",
			[stickerId],
		);

		if (result.length > 0) {
			const filePath = result[0].file_path;
			try {
				await remove(filePath, { baseDir: BaseDirectory.AppData });
				console.log("Deleted file: ", filePath);
			} catch (e) {
				console.error("Failed to delete file: ", filePath, e);
			}
		}
		await db.execute("DELETE FROM stickers WHERE id = ?", [stickerId]);
	}
}

async function updateStickerOrder(
	stickerId: string,
	newOrder: number,
): Promise<void> {
	const db = await getDatabase();
	await db.execute("UPDATE stickers SET display_order = ? WHERE id = ?", [
		newOrder,
		stickerId,
	]);
}

async function updatePackOrder(
	packId: string,
	newOrder: number,
): Promise<void> {
	const db = await getDatabase();
	await db.execute("UPDATE packs SET display_order = ? WHERE id = ?", [
		newOrder,
		packId,
	]);
}

async function renamePack(packId: string, newName: string): Promise<void> {
	const db = await getDatabase();
	await db.execute("UPDATE packs SET name = ? WHERE id = ?", [newName, packId]);
}

async function recordStickerUsage(stickerId: string): Promise<void> {
	const db = await getDatabase();
	const now = Date.now();
	await db.execute(
		"UPDATE stickers SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?",
		[now, stickerId],
	);
}

export type { Sticker, StickerPack };

export {
	initStickerStorage,
	importStickerPack,
	addStickersToExistingPack,
	loadStickerPack,
	loadUserStickerPacks,
	deleteStickers,
	updateStickerOrder,
	updatePackOrder,
	renamePack,
	recordStickerUsage,
};
