import useLongPress from "@/hooks/useLongPress";
import type { Sticker } from "@/lib/stickers";
import { cn } from "@/lib/utils";

interface StickerItemProps {
	sticker: Sticker;
	editMode: boolean;
	isSelected: boolean;
	onEnterEditMode: () => void;
	onToggleSelect: () => void;
	onUse: (sticker: Sticker) => void;
}

const StickerItem = ({
	sticker,
	editMode,
	isSelected,
	onEnterEditMode,
	onToggleSelect,
	onUse,
}: StickerItemProps) => {
	const longPress = useLongPress({
		onLongPress: onEnterEditMode,
		onClick: () => {
			if (editMode) {
				onToggleSelect();
			} else {
				onUse(sticker);
			}
		},
		delay: 500,
	});

	return (
		<div className="relative">
			<img
				src={sticker.url}
				alt={sticker.filename}
				className={cn(
					"w-16 h-16 object-contain cursor-pointer rounded-s",
					"transition-transform",
					"hover:scale-110 hover:bg-background-tertiary/25",
					{
						"opacity-70": editMode,
						"scale-105": isSelected,
					},
				)}
				{...longPress.handlers}
			/>

			{editMode && (
				<div
					className={cn(
						"absolute -top-1 -right-1 w-5 h-5 rounded-full border",
						{
							"border-4 border-primary bg-foreground-primary": isSelected,
							"border-foreground-secondary bg-background-tertiary": !isSelected,
						},
					)}
				/>
			)}
		</div>
	);
};

export { StickerItem };
