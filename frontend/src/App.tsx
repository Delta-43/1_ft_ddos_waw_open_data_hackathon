import { AssistantWidget } from './components/preferences/AssistantWidget';
import { MapView } from './map/MapView';

export function App() {
  return (
    <>
      <MapView />
      <AssistantWidget />
      <footer className="banner">
        <h1 className="banner__title">Warsaw – Interactive Map</h1>
        <p className="banner__subtitle">Warsaw 2076 · OpenStreetMap places and Warsaw open data</p>
      </footer>
    </>
  );
}
