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
				<div className={`absolute bg-green-900 h-8 top-0 left-0 pl-3 pr-3`}>
					<div className={`h-full flex flex-row justify-center`}>
						<button
							className={`w-auto h-full`}
							onPointerDown={() => {
								getItem("refresh_token").then((refreshToken) => {
									invoke("modify_player", {
										refreshToken,
										action: "prev",
									})
										.then(async (response) => {
											if (Array.isArray(response)) {
												await setItem("refresh_token", response[1]);
											}
										})
										.catch(() => {
											setAuthenticated(false);
										});
								});
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24px"
								viewBox="0 0 24 24"
								width="24px"
								fill="#FFFFFF"
							>
								<path d="M0 0h24v24H0z" fill="none" />
								<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
							</svg>
						</button>
						<div className={`w-1`} />
						<button
							className={`w-auto h-full`}
							onPointerDown={() => {
								getItem("refresh_token").then((refreshToken) => {
									invoke("modify_player", {
										refreshToken,
										action: playbackState?.is_playing ? "pause" : "play",
									})
										.then(async (response) => {
											if (Array.isArray(response)) {
												const result: boolean = response[0];

												if (playbackState !== undefined) {
													const newPlaybackState = { ...playbackState };
													if (result === true) {
														newPlaybackState.is_playing = !newPlaybackState.is_playing;
													}

													setPlaybackState(newPlaybackState);
												}

												await setItem("refresh_token", response[1]);
											}
										})
										.catch(() => {
											setAuthenticated(false);
										});
								});
							}}
						>
							{playbackState?.is_playing ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									height="24px"
									viewBox="0 0 24 24"
									width="24px"
									fill="#FFFFFF"
								>
									<path d="M0 0h24v24H0z" fill="none" />
									<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									height="24px"
									viewBox="0 0 24 24"
									width="24px"
									fill="#FFFFFF"
								>
									<path d="M0 0h24v24H0z" fill="none" />
									<path d="M8 5v14l11-7z" />
								</svg>
							)}
						</button>
						<div className={`w-1`} />
						<button
							className={`w-auto h-full`}
							onPointerDown={() => {
								getItem("refresh_token").then((refreshToken) => {
									invoke("modify_player", {
										refreshToken,
										action: "next",
									})
										.then(async (response) => {
											if (Array.isArray(response)) {
												await setItem("refresh_token", response[1]);
											}
										})
										.catch(() => {
											setAuthenticated(false);
										});
								});
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24px"
								viewBox="0 0 24 24"
								width="24px"
								fill="#FFFFFF"
							>
								<path d="M0 0h24v24H0z" fill="none" />
								<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PlaybackPage;
