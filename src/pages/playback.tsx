import React, { useEffect, useState, useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { getItem, setItem } from "localforage";
import CrossfadeImage from "src/components/CrossfadeImage";
import { AuthenticationContext } from "src/context/authentication";

const PlaybackPage: React.FunctionComponent = (props) => {
	const { setAuthenticated } = useContext(AuthenticationContext);
	const [playbackState, setPlaybackState] = useState<SpotifyApi.CurrentlyPlayingResponse | undefined>(undefined);

	useEffect(() => {
		const updatePlaybackState = () => {
			getItem("refresh_token").then((refreshToken) => {
				invoke("get_playback_state", {
					refreshToken,
				})
					.then(async (response) => {
						if (Array.isArray(response)) {
							const playbackState = response[0] as SpotifyApi.CurrentlyPlayingResponse;

							await setItem("refresh_token", response[1]);
							setPlaybackState(playbackState);
						}
					})
					.catch(() => {
						setAuthenticated(false);
					});
			});
		};

		updatePlaybackState();
		let handle = setInterval(updatePlaybackState, 3000);

		return () => {
			clearInterval(handle);
		};
	}, []);

	return (
		<div className={`relative w-full h-full overflow-hidden`}>
			<CrossfadeImage
				src={playbackState?.item?.type === "track" ? playbackState.item.album?.images[0]?.url : ""}
				containerClassName={`w-full h-full`}
				imageClass={`rounded-2xl w-full h-full object-cover ${
					playbackState?.is_playing ? "normal-img" : "grayscale-img"
				}`}
			/>
			<div
				className={`selectDisable absolute rounded-2xl left-0 top-0 flex justify-start items-center w-full h-full overflow-hidden box-border`}
				style={{
					backgroundImage:
						"linear-gradient(to right, rgba(17,24,39,1), rgba(17,24,39,0.7) 50%, transparent, rgba(17,24,39,0))",
				}}
				draggable={false}
			>
				<div className={`flex flex-col justify-center box-border pb-1 ml-4`}>
					<p
						className={`-mb-4 box-border font-extrabold text-lg`}
						style={{
							backgroundSize: "100%",
							WebkitTextFillColor: "transparent",
							WebkitFontSmoothing: "antialiased",
							WebkitBackgroundClip: "text",

							backgroundImage: "linear-gradient(90deg,#fff 10rem,transparent 11rem)",

							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							color: "rgba(255,255,255,1)",

							lineHeight: "1.75rem",
						}}
					>
						{playbackState?.item?.name ?? "ad break"}
					</p>
					<div className={`h-3`} />
					<p
						className={`box-border font-semibold text-base`}
						style={{
							backgroundSize: "100%",
							WebkitTextFillColor: "transparent",
							WebkitFontSmoothing: "antialiased",
							WebkitBackgroundClip: "text",

							backgroundImage: "linear-gradient(90deg,#fff 10rem,transparent 11rem)",

							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							color: "rgba(255,255,255,1)",

							lineHeight: "1.5rem",
						}}
					>
						{playbackState?.item && playbackState.item.type === "track"
							? playbackState.item.artists.map((v) => v.name).join(", ")
							: ""}
					</p>
				</div>
			</div>
		</div>
	);
};

export default PlaybackPage;
