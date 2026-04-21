import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from "./pages/Home";
import Test from "./pages/Test";
import RealTime from "./pages/RealTime";
import RealTimeEntry from "./pages/RealTimeEntry";
import Collab from "./pages/Collab";
import CollabEntry from "./pages/CollabEntry";
import Playback from "./pages/Playback";
import PlaybackEntry from "./pages/PlaybackEntry";
import { ErrorBoundary } from './components/ErrorBoundary';

function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #f6f7ff 0%, #eef7ff 100%)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: '#0f172a', opacity: 0.15 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>Page not found</div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
          This URL doesn't match any whiteboard route.
        </div>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid black',
            background: 'black',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/local' element={<Test />} />
          <Route path='/realtime' element={<RealTimeEntry />} />
          <Route path='/realtime/:roomId' element={<RealTime />} />
          <Route path='/collab' element={<CollabEntry />} />
          <Route path='/collab/:roomId' element={<Collab />} />
          <Route path='/playback' element={<PlaybackEntry />} />
          <Route path='/playback/:roomId' element={<Playback />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
