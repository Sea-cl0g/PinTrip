import { HomeLayout } from "./components/layout/home-layout";
import mapImage from "./images/map-placeholder.png";

export default function App() {
  return (
    <HomeLayout
      map={<img src={mapImage} alt="仮の地図" className="h-full w-full object-cover" />}
    />
  );
}
