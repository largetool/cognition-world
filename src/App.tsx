import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MePage from './pages/MePage';
import UserPage from './pages/UserPage';
import ThoughtPage from './pages/ThoughtPage';
import ExamplePage from './pages/ExamplePage';
import NotFoundPage from './pages/NotFoundPage';
import MessagesPage from './pages/MessagesPage';
import { AdminPage } from './pages/AdminPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WhitepaperPage from './pages/WhitepaperPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AccessibilityPage from './pages/AccessibilityPage';
import GuestbookPage from './pages/GuestbookPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 中文路由 */}
        <Route path="/" element={<IndexPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/example/:userId" element={<ExamplePage />} />
        <Route path="/whitepaper" element={<WhitepaperPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        <Route path="/:userId" element={<UserPage />} />
        <Route path="/:userId/thought/:thoughtId" element={<ThoughtPage />} />

        {/* 英文路由 */}
        <Route path="/en" element={<IndexPage />} />
        <Route path="/en/register" element={<RegisterPage />} />
        <Route path="/en/login" element={<LoginPage />} />
        <Route path="/en/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/en/reset-password" element={<ResetPasswordPage />} />
        <Route path="/en/me" element={<MePage />} />
        <Route path="/en/messages" element={<MessagesPage />} />
        <Route path="/en/admin" element={<AdminPage />} />
        <Route path="/en/whitepaper" element={<WhitepaperPage />} />
        <Route path="/en/privacy" element={<PrivacyPage />} />
        <Route path="/en/terms" element={<TermsPage />} />
        <Route path="/en/about" element={<AboutPage />} />
        <Route path="/en/contact" element={<ContactPage />} />
        <Route path="/en/accessibility" element={<AccessibilityPage />} />
        <Route path="/en/guestbook" element={<GuestbookPage />} />
        <Route path="/en/:userId" element={<UserPage />} />
        <Route path="/en/:userId/thought/:thoughtId" element={<ThoughtPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
