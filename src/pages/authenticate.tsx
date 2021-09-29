import React, { useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { setItem } from "localforage";
import { AuthenticationContext } from "src/context/authentication";

const AuthenticatePage: React.FunctionComponent = (props) => {
	const { setAuthenticated } = useContext(AuthenticationContext);
	return (
		<div className={`flex w-full h-full items-center justify-center`}>
			<button
				className={`pb-2 pt-2 pl-4 pr-4 rounded-full bg-green-900 text-white font-base`}
				onPointerDown={() => {
					invoke("authenticate_user").then(async (response) => {
						if (typeof response === "string") {
							await setItem("refresh_token", response);
							setAuthenticated(true);
						}
					});
				}}
			>
				authenticate
			</button>
		</div>
	);
};

export default AuthenticatePage;
