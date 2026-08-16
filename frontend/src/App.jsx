import { Route, Routes } from 'react-router-dom';
import { Chat } from './pages/Chat';
import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';
import SignInWithGoogle from './pages/SignInWithGoogle';
import Profile from './pages/Profile';

function App() {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<SignInWithGoogle/>} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;
