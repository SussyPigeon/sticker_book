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
	createdAt: number;
	order: number;
}

interface Sticker {
	id: string;
	filename: string;
	path: string;
	url: string;
	order: number;
}

interface PackRegistry {
	packs: Array<{ id: string; order: number }>;
	nextOrder: number;
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
	const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

	for (let i = 0; i < sortedFiles.length; i++) {
		const file = sortedFiles[i];
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
			order: i,
		});

		console.log("Imported sticker: ", file.name, "URL: ", url);
	}

	const packOrder = await addPackToRegistry(packId);
	const pack: StickerPack = {
		id: packId,
		name: `Pack ${Date.now()}`,
		stickers,
		createdAt: Date.now(),
		order: packOrder,
	};
	await saveStickerPackMetadata(pack);

	return pack;
}

async function getStickerUrl(relativePath: string): Promise<string> {
	const appData = await appDataDir();
	const abosolutePath = `${appData}/${relativePath}`;
	return convertFileSrc(abosolutePath);
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
			order: s.order,
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

		const registry = await loadPackRegistry();
		const entries = await readDir("stickers", {
			baseDir: BaseDirectory.AppData,
		});
		const packs: StickerPack[] = [];
		let registryModifed = false;

		for (const entry of entries) {
			if (entry.isDirectory && entry.name !== "registry.json") {
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
					const pack: StickerPack = JSON.parse(content);

					if (!registry.packs.find((p) => p.id === pack.id)) {
						console.log("Pack not in registry, adding: ", pack.id);
						registry.packs.push({
							id: pack.id,
							order: registry.nextOrder,
						});
						registry.nextOrder += 1;
						registryModifed = true;
					}

					pack.stickers = await Promise.all(
						pack.stickers
							.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
							.map(async (s: Sticker) => ({
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

		if (registryModifed) {
			await savePackRegistry(registry);
		}

		packs.sort((a, b) => {
			const aOrder = registry.packs.find((p) => p.id === a.id)?.order ?? 0;
			const bOrder = registry.packs.find((p) => p.id === b.id)?.order ?? 0;
			return aOrder - bOrder;
		});

		console.log("Loaded packs: ", packs);
		return packs;
	} catch (e) {
		console.error("Failed to read stickers directory: ", e);
		return [];
	}
}

async function loadPackRegistry(): Promise<PackRegistry> {
	try {
		const registryExists = await exists("stickers/registry.json", {
			baseDir: BaseDirectory.AppData,
		});

		if (!registryExists) {
			return { packs: [], nextOrder: 0 };
		}

		const content = await readTextFile("stickers/registry.json", {
			baseDir: BaseDirectory.AppData,
		});
		return JSON.parse(content);
	} catch (e) {
		console.error("Failed to load registry: ", e);
		return { packs: [], nextOrder: 0 };
	}
}

async function savePackRegistry(registry: PackRegistry): Promise<void> {
	await writeTextFile(
		"stickers/registry.json",
		JSON.stringify(registry, null, 2),
		{
			baseDir: BaseDirectory.AppData,
		},
	);
}

async function addPackToRegistry(packId: string): Promise<number> {
	const registry = await loadPackRegistry();
	const order = registry.nextOrder;

	registry.packs.push({ id: packId, order });
	registry.nextOrder += 1;

	await savePackRegistry(registry);
	return order;
}

export type { Sticker, StickerPack };

export {
	initStickerStorage,
	importStickerPack,
	saveStickerPackMetadata,
	loadUserStickerPacks,
	savePackRegistry,
	loadPackRegistry,
};
