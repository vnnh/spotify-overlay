import React, { useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { setItem } from "localforage";
import { AuthenticationContext } from "src/context/authentication";

const AuthenticatePage: React.FunctionComponent = (props) => {
	const { setAuthenticated } = useContext(AuthenticationContext);
	return (
		<button
			className={`bg-red-500`}
			onPointerDown={() => {
				invoke("authenticate_user").then(async (response) => {
					if (typeof response === "string") {
						await setItem("refresh_token", response);
						setAuthenticated(true);
					}
				});
			}}
		>
			hey guys button
		</button>
	);
};

export default AuthenticatePage;
