import { AssistantWidget } from './components/preferences/AssistantWidget';
import { MapView } from './map/MapView';

export function App() {
  return (
    <>
      <MapView />
      <AssistantWidget />
      <footer className="moon-panel fixed left-1/2 bottom-[calc(1rem+env(safe-area-inset-bottom))] -translate-x-1/2 w-[min(40rem,calc(100%-2rem))] px-6 py-3 text-center pointer-events-none max-sm:px-4 max-sm:py-2">
        {/* pointer-events-none: the banner never blocks map gestures. */}
        <h1 className="text-moon-20 font-medium max-sm:text-moon-16">Warsaw – Interactive Map</h1>
        <p className="mt-1 text-moon-12 text-trunks">Warsaw 2076 · sample pins are placeholder data</p>
      </footer>
    </>
  );
}
