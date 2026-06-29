import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import HowItWorksPage from './pages/HowItWorksPage'
import ChallengesListPage from './pages/ChallengesListPage'
import ChallengeDetailPage from './pages/ChallengeDetailPage'
import CreateChallengePage from './pages/CreateChallengePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/come-funziona" element={<HowItWorksPage />} />
        <Route path="/sfide" element={<ChallengesListPage />} />
        <Route
          path="/sfide/nuova"
          element={
            <ProtectedRoute>
              <CreateChallengePage />
            </ProtectedRoute>
          }
        />
        <Route path="/sfide/:id" element={<ChallengeDetailPage />} />
        <Route path="/classifica" element={<LeaderboardPage />} />
        <Route
          path="/profilo"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrati" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
