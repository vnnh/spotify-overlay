import React, { useEffect, useRef, useState } from "react";

const CrossfadeImage = (props: {
	src: string;
	containerClassName?: string;
	imageClass?: string;
}): React.ReactElement => {
	const { src, containerClassName } = props;

	const timeout = useRef<NodeJS.Timeout>();

	const [topSrc, setTopSrc] = useState(src);
	const [bottomSrc, setBottomSrc] = useState(src);
	const [bottomOpacity, setBottomOpacity] = useState(0);

	useEffect(() => {
		if (topSrc !== src) {
			setBottomSrc(topSrc);
			setTopSrc(src);

			setBottomOpacity(0.99);

			if (timeout.current) {
				clearTimeout(timeout.current);
			}

			timeout.current = setTimeout(() => {
				setBottomOpacity(0);
				if (timeout.current !== undefined) {
					clearTimeout(timeout.current);
				}
				timeout.current = undefined;
			}, 20);
		}
	}, [src]);

	return (
		<div className={containerClassName}>
			{topSrc && (
				<img
					className={`selectDisable absolute ${props.imageClass ?? ""}`}
					draggable={false}
					key={topSrc}
					src={topSrc}
					style={{
						content: topSrc.match(/url\(.+\)/) ? topSrc : undefined,
					}}
				/>
			)}
			{bottomSrc && topSrc !== bottomSrc && (
				<img
					className={`selectDisable absolute ${props.imageClass ?? ""}`}
					draggable={false}
					key={bottomSrc}
					src={bottomSrc}
					style={{
						content: bottomSrc.match(/url\(.+\)/) ? bottomSrc : undefined,

						opacity: bottomOpacity,
						transition: `opacity 1s ease`,
					}}
				/>
			)}
		</div>
	);
};

export default CrossfadeImage;
