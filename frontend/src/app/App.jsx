import { RouterProvider } from "react-router";
import { router } from "./app.routes";
import { useAuthInit } from "../features/auth/hooks/useAuth";
import { useEffect } from "react";

function App() {
    // useAuthInit is Router-context-free — safe to call here
    // It restores the user session on app load by calling GET /api/auth/get-me
    const { init } = useAuthInit();

    useEffect(() => {
        init();
    }, []);

    return <RouterProvider router={router} />;
}

export default App;