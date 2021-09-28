import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { getItem, setItem } from "localforage";

const PlaybackPage: React.FunctionComponent = (props) => {
	const [playbackState, setPlaybackState] = useState<SpotifyApi.CurrentlyPlayingResponse | undefined>(undefined);

	useEffect(() => {
		const updatePlaybackState = () => {
			getItem("refresh_token").then((refreshToken) => {
				invoke("get_playback_state", {
					refreshToken,
				}).then(async (response) => {
					if (Array.isArray(response)) {
						const playbackState = response[0] as SpotifyApi.CurrentlyPlayingResponse;

						await setItem("refresh_token", response[1]);
						setPlaybackState(playbackState);
					}
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
		<>
			<button className={`bg-green-500`}>{playbackState?.item?.name}</button>
		</>
	);
};

export default PlaybackPage;
