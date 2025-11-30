import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
	onLongPress?: () => void;
	onClick?: () => void;
	delay?: number;
}

function useLongPress(options: UseLongPressOptions = {}) {
	const { onLongPress, onClick, delay = 500 } = options;

	const [isLongPressing, setIsLongPressing] = useState(false);
	const isLongPressRef = useRef(false);
	const timerRef = useRef(Number.NaN);

	const startPressTimer = useCallback(() => {
		isLongPressRef.current = false;
		timerRef.current = window.setTimeout(() => {
			isLongPressRef.current = true;
			setIsLongPressing(true);
			onLongPress?.();
		}, delay);
	}, [delay, onLongPress]);

	const handleOnClick = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (isLongPressRef.current) {
				e.preventDefault();
				return;
			}
			onClick?.();
		},
		[onClick],
	);

	const handleOnMouseDown = useCallback(() => {
		startPressTimer();
	}, [startPressTimer]);

	const handleOnMouseUp = useCallback(() => {
		clearTimeout(timerRef.current);
	}, []);

	const handleOnTouchStart = useCallback(() => {
		startPressTimer();
	}, [startPressTimer]);

	const handleOnTouchEnd = useCallback(() => {
		clearTimeout(timerRef.current);
	}, []);

	const reset = useCallback(() => {
		setIsLongPressing(false);
		isLongPressRef.current = false;
	}, []);

	return {
		isLongPressing,
		handlers: {
			onClick: handleOnClick,
			onMouseDown: handleOnMouseDown,
			onMouseUp: handleOnMouseUp,
			onTouchStart: handleOnTouchStart,
			onTouchEnd: handleOnTouchEnd,
		},
		reset,
	};
}

export default useLongPress;
