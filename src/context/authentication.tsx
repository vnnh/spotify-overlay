import React, { createContext, FunctionComponent, useState } from "react";

const AuthenticationContext = createContext<{
	authenticated: boolean;
	setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
}>({ authenticated: true, setAuthenticated: () => {} });

const AuthenticationProvider: FunctionComponent = (props) => {
	const [authenticated, setAuthenticated] = useState(true);

	return (
		<AuthenticationContext.Provider value={{ authenticated, setAuthenticated }}>
			{props.children}
		</AuthenticationContext.Provider>
	);
};

export { AuthenticationContext, AuthenticationProvider };
