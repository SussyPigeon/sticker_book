import { useEffect, useState } from "react";
import useLongPress from "@/hooks/useLongPress";
import {
	importStickerPack,
	loadUserStickerPacks,
	type Sticker,
	type StickerPack,
} from "@/lib/stickers";

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
		const newPack = await importStickerPack(files);
		setPacks([...packs, newPack]);
	};

	const handleStickerClick = (s: Sticker) => {
		console.log(s);
	};

	return (
		<div className="p-4">
			<input
				type="file"
				accept="image/png, image/jpeg, image/gif, image/webp"
				multiple
				onChange={handleImport}
			/>

			<div className="grid grid-cols-6 gap-2 mt-4">
				{packs.flatMap((pack) =>
					pack.stickers.map((sticker) => (
						<img
							key={sticker.id}
							src={sticker.url}
							alt={sticker.filename}
							className="w-16 h-16 object-contain hover:scale-110 transition-transform"
							onClick={() => handleStickerClick(sticker)}
						/>
					)),
				)}
			</div>
		</div>
	);
};

export { StickerPicker };
