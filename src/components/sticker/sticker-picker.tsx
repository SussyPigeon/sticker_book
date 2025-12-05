import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	addStickersToExistingPack,
	importStickerPack,
	loadUserStickerPacks,
	type StickerPack,
} from "@/lib/stickers";
import { cn } from "@/lib/utils";
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

	const handleCreateNewPack = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const newPack = await importStickerPack(files);
		setPacks([...packs, newPack]);

		e.target.value = "";
	};

	const hadnleAddToPack = async (
		e: React.ChangeEvent<HTMLInputElement>,
		packId: string,
	) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const updatedPack = await addStickersToExistingPack(packId, files);
		setPacks(packs.map((pack) => (pack.id === packId ? updatedPack : pack)));

		e.target.value = "";
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
					<label className="cursor-pointer">
						<Button variant="primary" size="sm" asChild>
							<div>
								<Plus className="w-4 h-4" />
								New Pack
							</div>
						</Button>
						<input
							type="file"
							accept="image/png, image/jpegm image/gif, image/webp"
							multiple
							onChange={handleCreateNewPack}
							className="hidden"
						/>
					</label>
				)}
			</div>

			<div className="space-y-6">
				{packs.flatMap((pack) => (
					<div key={pack.id} className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-semibold text-foreground-secondary">
								{pack.name}
							</h3>
							<span className="text-xs text-foreground-secondary">
								{pack.stickers.length} sticker
								{pack.stickers.length !== 1 ? "s" : ""}
							</span>
						</div>

						<div className="grid grid-cols-6 gap-2">
							{pack.stickers.map((sticker) => (
								<StickerItem
									key={sticker.id}
									sticker={sticker}
									editMode={editMode}
									isSelected={selectedStickers.has(sticker.id)}
									onEnterEditMode={() => enterEditMode(sticker.id)}
									onToggleSelect={() => toggleStickerSelection(sticker.id)}
									onUse={(sticker) => console.log("Use sticker: ", sticker)}
								/>
							))}

							{!editMode && (
								<label
									className={cn(
										"group relative w-16 h-16 flex flex-col items-center justify-center cursor-pointer",
										"transition-colors duration-200 hover:bg-background-tertiary/25 hover:scale-110",
									)}
								>
									<div className="w-16 h-16 flex flex-col items-center justify-center group-hover:scale-[0.909]">
										<div className="bg-primary cursor-pointer rounded-full w-8 h-8 flex items-center justify-center">
											<Plus className="stroke-2 group-hover:stroke-3 transition-[stroke-width] duration-200 ease-in" />
										</div>
										<div className="text-xs text-center leading-tight mt-1">
											Add
										</div>
									</div>
									<input
										type="file"
										accept="image/png, image/jpeg, image/gif, image/webp"
										multiple
										onChange={(e) => hadnleAddToPack(e, pack.id)}
										className="hidden"
									/>
								</label>
							)}
						</div>
					</div>
				))}
			</div>

			{packs.length === 0 && (
				<div className="text-center py-12 text-foreground-secondary">
					<p className="mb-4">No Sticker packs yet</p>
					<label className="cursor-pointer">
						<Button variant="primary" asChild>
							<div>
								<Plus className="w-4 h-4" />
								Create Your First Pack
							</div>
						</Button>
						<input
							type="file"
							accept="image/png, image/jpegm image/gif, image/webp"
							multiple
							onChange={handleCreateNewPack}
							className="hidden"
						/>
					</label>
				</div>
			)}
		</div>
	);
};

export { StickerPicker };
