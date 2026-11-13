import { createBrowserRouter, RouterProvider } from "react-router";
import TopPage from "./pages/TopPage";
import PinsPage from "./pages/PinsPage";
import PlansPage from "./pages/PlansPage";
import SettingsPage from "./pages/SettingsPage";

const router = createBrowserRouter([
  { path: "/", element: <TopPage /> },
  { path: "/posts", element: <PinsPage /> },
  { path: "/plans", element: <PlansPage /> },
  { path: "/settings", element: <SettingsPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}