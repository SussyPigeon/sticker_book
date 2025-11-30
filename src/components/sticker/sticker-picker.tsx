import { useEffect, useState } from "react";
import {
	importStickerPack,
	loadUserStickerPacks,
	type StickerPack,
} from "@/lib/stickers";
import { Button } from "../ui/button";
import { StickerItem } from "./sticker-item";

const StickerPicker = () => {
	const [packs, setPacks] = useState<StickerPack[]>([]);
	const [editMode, setEditMode] = useState(false);
	const [selectedStickers, setSelectedStickers] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		loadUserStickerPacks().then(setPacks);
	}, []);

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const newPack = await importStickerPack(files);
		setPacks([...packs, newPack]);
	};

	const enterEditMode = (stickerId: string) => {
		setEditMode(true);
		toggleStickerSelection(stickerId);
	};

	const exitEditMode = () => {
		setEditMode(false);
		setSelectedStickers(new Set());
	};

	const toggleStickerSelection = (stickerId: string) => {
		const newSelected = new Set(selectedStickers);
		if (newSelected.has(stickerId)) {
			newSelected.delete(stickerId);
		} else {
			newSelected.add(stickerId);
		}
		setSelectedStickers(newSelected);
	};

	const deleteSelectedStickers = () => {
		console.log("Delete stickers: ", Array.from(selectedStickers));
		exitEditMode();
	};

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold">Stickers</h2>

				{editMode ? (
					<div className="flex gap-2">
						<Button
							onClick={deleteSelectedStickers}
							variant="danger"
							disabled={selectedStickers.size === 0}
						>
							Delete ({selectedStickers.size})
						</Button>
						<Button onClick={exitEditMode} variant="secondary">
							Done
						</Button>
					</div>
				) : (
					<label className="px-3 py-1 bg-primary text-foreground-primary rounded cursor-pointer">
						Import
						<input
							type="file"
							accept="image/png, image/jpeg, image/gif, image/webp"
							multiple
							onChange={handleImport}
							className="hidden"
						/>
					</label>
				)}
			</div>

			<div className="grid grid-cols-6 gap-2 mt-4">
				{packs.flatMap((pack) =>
					pack.stickers.map((sticker) => (
						<StickerItem
							key={sticker.id}
							sticker={sticker}
							editMode={editMode}
							isSelected={selectedStickers.has(sticker.id)}
							onEnterEditMode={() => enterEditMode(sticker.id)}
							onToggleSelect={() => toggleStickerSelection(sticker.id)}
							onUse={(sticker) => console.log("Use sticker: ", sticker)}
						/>
					)),
				)}
			</div>
		</div>
	);
};

export { StickerPicker };
