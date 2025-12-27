import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './assets/components/Header.jsx';
import Hero from './pages/Hero.jsx';
import Footer from './assets/components/Footer.jsx';
import Login from "./pages/Login";
import Signup from './pages/Signup.jsx';
import Account from './pages/Account.jsx';
import AccountInfo from './pages/AccountInfo.jsx';
import YourPets from "./pages/YourPets";
import TopPageLoader from "./assets/components/TopPageLoader";
import AdminPage from './pages/AdminPage';
import ManageProducts from './pages/ManageProducts';
import ManageUsers from './pages/ManageUsers.jsx';
import ManageKennels from "./pages/ManageKennels";
import SearchResults from "./pages/SearchResults";
import SearchDetails from "./pages/SearchDetails.jsx";
import BookingReview from './pages/BookingReview.jsx';
import PaymentStatus from './pages/PaymentStatus.jsx';
import CrecheBookings from './pages/CrecheBookings.jsx';
import ManageBookings from './pages/ManageBookings.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsConditions from './pages/TermsConditions.jsx';
import RefundPolicy from './pages/RefundPolicy.jsx';
import ContactUs from './pages/ContactUs.jsx';
import { useLoading } from "./contexts/LoadingContext";


function App() {
  const { loading } = useLoading();
  return (
    <>
      <Router>
        <TopPageLoader active={loading} />
        <Header />
        <Routes>
          <Route path="" element={<Hero />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/search-results/:kennelId" element={<SearchDetails />} />
          <Route path="/booking-review" element={<BookingReview />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/account" element={<Account />}>
            <Route path="info" element={<AccountInfo />} />
            <Route path="pets" element={<YourPets />} />
            <Route path="creche-bookings" element={<CrecheBookings />} />
          </Route>
          <Route path="/admin" element={<AdminPage />}>
            <Route path="manage-products" element={<ManageProducts />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-kennels" element={<ManageKennels />} />
            <Route path="manage-bookings" element={<ManageBookings />} />
          </Route>
        </Routes>

        <Footer />
      </Router>


    </>
  )
}

export default App;
