import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import {
	BaseDirectory,
	exists,
	mkdir,
	readDir,
	readTextFile,
	writeFile,
	writeTextFile,
} from "@tauri-apps/plugin-fs";

interface StickerPack {
	id: string;
	name: string;
	stickers: Sticker[];
}

interface Sticker {
	id: string;
	filename: string;
	path: string;
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
	const packId = crypto.randomUUID();
	const packDir = `stickers/${packId}`;

	await mkdir(packDir, {
		baseDir: BaseDirectory.AppData,
		recursive: true,
	});

	const stickers: Sticker[] = [];
	for (const file of files) {
		const destPath = `${packDir}/${file.name}`;
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		await writeFile(destPath, uint8Array, {
			baseDir: BaseDirectory.AppData,
		});

		const url = await getStickerUrl(destPath);

		stickers.push({
			id: crypto.randomUUID(),
			filename: file.name,
			path: destPath,
			url,
		});

		console.log("Imported sticker: ", file.name, "URL: ", url);
	}

	const pack: StickerPack = {
		id: packId,
		name: `Pack ${Date.now()}`,
		stickers,
	};
	await saveStickerPackMetadata(pack);

	return pack;
}

async function saveStickerPackMetadata(pack: StickerPack) {
	const manifestPath = `stickers/${pack.id}/manifest.json`;
	const packToSave = {
		...pack,
		stickers: pack.stickers.map((s) => ({
			id: s.id,
			filename: s.filename,
			path: s.path,
			url: "",
		})),
	};

	await writeTextFile(manifestPath, JSON.stringify(packToSave, null, 2), {
		baseDir: BaseDirectory.AppData,
	});
	console.log("Saved manifest: ", manifestPath);
}

async function loadUserStickerPacks(): Promise<StickerPack[]> {
	try {
		const dirExists = await exists("stickers", {
			baseDir: BaseDirectory.AppData,
		});
		if (!dirExists) {
			console.log("Stickers directory does not exist yet");
			return [];
		}

		const entries = await readDir("stickers", {
			baseDir: BaseDirectory.AppData,
		});
		const packs: StickerPack[] = [];

		for (const entry of entries) {
			if (entry.isDirectory) {
				const manifestPath = `stickers/${entry.name}/manifest.json`;

				const manifestExists = await exists(manifestPath, {
					baseDir: BaseDirectory.AppData,
				});
				if (!manifestExists) {
					console.log("No manifest found for:", entry.name);
					continue;
				}

				try {
					const content = await readTextFile(manifestPath, {
						baseDir: BaseDirectory.AppData,
					});
					const pack = JSON.parse(content);

					pack.stickers = await Promise.all(
						pack.stickers.map(async (s: Sticker) => ({
							...s,
							url: await getStickerUrl(s.path),
						})),
					);

					packs.push(pack);
				} catch (e) {
					console.error("Failed to load pack: ", e);
				}
			}
		}

		console.log("Loaded packs: ", packs);
		return packs;
	} catch (e) {
		console.error("Failed to read stickers directory: ", e);
		return [];
	}
}

const stickerPacks = import.meta.glob(
	"@/assests/stickers/**/*.{png,jpg,jpeg,gif,webp}",
	{
		eager: true,
		query: "?url",
	},
);

function getBuiltInStickers() {
	return stickerPacks;
}

export type { Sticker, StickerPack };

export {
	initStickerStorage,
	importStickerPack,
	saveStickerPackMetadata,
	loadUserStickerPacks,
	getBuiltInStickers,
};
