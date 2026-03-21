import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React from 'react';
import Header from './assets/components/Header.jsx';
import Hero from './pages/Hero.jsx';
import Footer from './assets/components/Footer.jsx';
import Login from "./pages/Login";
import Signup from './pages/Signup.jsx';
import Account from './pages/Account.jsx';
import AccountInfo from './pages/AccountInfo.jsx';
import YourPets from "./pages/YourPets";
import AdminPage from './pages/AdminPage';
import ManageProducts from './pages/ManageProducts';
import ManageUsers from './pages/ManageUsers.jsx';
import ManageKennels from "./pages/ManageKennels";
import MyTickets from './pages/MyTickets.jsx';
import SearchResults from "./pages/SearchResults";
import SearchDetails from "./pages/SearchDetails.jsx";
import BookingReview from './pages/BookingReview.jsx';
import PaymentStatus from './pages/PaymentStatus.jsx';
import CrecheBookings from './pages/CrecheBookings.jsx';
import ManageBookings from './pages/ManageBookings.jsx';
import SupportTickets from './pages/SupportTickets.jsx';
import EarningsDashboard from './pages/EarningsDashboard.jsx';
import ManageEvents from './pages/ManageEvents.jsx';
import ManagePets from './pages/ManagePets.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsConditions from './pages/TermsConditions.jsx';
import RefundPolicy from './pages/RefundPolicy.jsx';
import ContactUs from './pages/ContactUs.jsx';
import Events from './pages/Events.jsx';
import EventDetails from './pages/EventDetails.jsx';
import EventBookingReview from './pages/EventBookingReview.jsx';
import EventBookings from './pages/EventBookings.jsx';
import EventsRevenue from './pages/EventsRevenue.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import WhatsAppButton from './assets/components/WhatsAppButton.jsx';
import EventsAdminPage from './pages/EventsAdminPage.jsx';
import KennelsAdminPage from './pages/KennelsAdminPage.jsx';
import KennelTickets from './pages/KennelTickets.jsx';
import ManageServiceCities from './pages/ManageServiceCities.jsx';
import WoofWallet from './pages/WoofWallet.jsx';
import ManageCoupons from './pages/ManageCoupons.jsx';
import { useSession, setGlobalSessionHandler } from './contexts/SessionContext';
import SessionExpiredModal from './assets/components/SessionExpiredModal';


function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { sessionExpired, handleSessionExpired } = useSession();

  React.useEffect(() => {
    setGlobalSessionHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // Track page views in Google Analytics on route change
  React.useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return (
    <div className={isAdminRoute ? 'admin-layout' : ''}>
      {!isAdminRoute && <Header />}
      <Routes>
        <Route path="" element={<Hero />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/search-results/:kennelId" element={<SearchDetails />} />
        <Route path="/booking-review" element={<BookingReview />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/event-booking-review" element={<EventBookingReview />} />
        <Route path="/account" element={<Account />}>
          <Route path="info" element={<AccountInfo />} />
          <Route path="pets" element={<YourPets />} />
          <Route path="creche-bookings" element={<CrecheBookings />} />
          <Route path="event-bookings" element={<EventBookings />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="wallet" element={<WoofWallet />} />
        </Route>
        <Route path="/admin" element={<AdminPage />}>
          <Route path="earnings" element={<EarningsDashboard />} />
          <Route path="manage-products" element={<ManageProducts />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="manage-pets" element={<ManagePets />} />
          <Route path="manage-kennels" element={<ManageKennels />} />
          <Route path="manage-cities" element={<ManageServiceCities />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
          <Route path="manage-events" element={<ManageEvents />} />
          <Route path="manage-coupons" element={<ManageCoupons />} />
          <Route path="kennels-admin" element={<KennelsAdminPage />} />
          <Route path="kennels-admin/:section" element={<KennelsAdminPage />} />
          <Route path="kennel-tickets" element={<KennelTickets />} />
          <Route path="events-admin" element={<EventsAdminPage />} />
          <Route path="events-revenue" element={<EventsRevenue />} />
        </Route>
      </Routes>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <WhatsAppButton />}
      <SessionExpiredModal isOpen={sessionExpired} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;