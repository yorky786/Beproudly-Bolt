import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Discover from './pages/Discover';
import BlazeBold from './pages/BlazeBold';
import Challenges from './pages/Challenges';
import GlowVault from './pages/GlowVault';
import DevilsDen from './pages/DevilsDen';
import PrideCircles from './pages/PrideCircles';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import Layout from './components/Layout';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile?.name) {
    return <ProfileSetup />;
  }

  const path = window.location.pathname;

  if (path === '/blazebold') {
    return <BlazeBold />;
  }

  if (path === '/challenges') {
    return (
      <Layout currentPage="challenges">
        <Challenges />
      </Layout>
    );
  }

  if (path === '/glowvault') {
    return (
      <Layout currentPage="glowvault">
        <GlowVault />
      </Layout>
    );
  }

  if (path === '/devilsden') {
    return (
      <Layout currentPage="devilsden">
        <DevilsDen />
      </Layout>
    );
  }

  if (path === '/pridecircles') {
    return (
      <Layout currentPage="pridecircles">
        <PrideCircles />
      </Layout>
    );
  }

  if (path === '/messages') {
    return (
      <Layout currentPage="messages">
        <Messages />
      </Layout>
    );
  }

  if (path === '/profile') {
    return (
      <Layout currentPage="profile">
        <Profile />
      </Layout>
    );
  }

  if (path === '/premium') {
    return (
      <Layout currentPage="premium">
        <Premium />
      </Layout>
    );
  }

  return (
    <Layout currentPage="discover">
      <Discover />
    </Layout>
  );
}

export default App;
