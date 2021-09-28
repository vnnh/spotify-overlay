import { render } from "react-dom";
import React, { useContext, useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { AuthenticationContext, AuthenticationProvider } from "src/context/authentication";
import AuthenticatePage from "src/pages/authenticate";
import PlaybackPage from "src/pages/playback";

const StatusCard: React.FunctionComponent = () => {
	const { authenticated, setAuthenticated } = useContext(AuthenticationContext);
	useEffect(() => {
		let unlistenFn: () => void;
		listen("reauthenticate", (event) => {
			setAuthenticated(false);
		}).then((value) => {
			unlistenFn = value;
		});

		return () => {
			if (unlistenFn !== undefined) {
				unlistenFn();
			}
		};
	}, []);

	return (
		<div
			className={`rounded-2xl w-full h-full bg-green-800`}
			onPointerDown={() => {
				appWindow.startDragging();
			}}
		>
			{authenticated ? <PlaybackPage /> : <AuthenticatePage />}
		</div>
	);
};

render(
	<AuthenticationProvider>
		<StatusCard />
	</AuthenticationProvider>,
	document.getElementById("root"),
);
