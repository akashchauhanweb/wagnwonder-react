import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './assets/components/Header.jsx';
import Hero from './assets/components/Hero.jsx';
import Footer from './assets/components/Footer.jsx';
import Login from "./pages/Login";
import Account from './pages/Account.jsx';
import AccountInfo from './pages/AccountInfo.jsx';
import YourPets from "./pages/YourPets";
import TopPageLoader from "./assets/components/TopPageLoader";
import AdminPage from './pages/AdminPage';
import ManageProducts from './pages/ManageProducts';
import ManageUsers from './pages/ManageUsers.jsx';
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
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />}>
            <Route path="info" element={<AccountInfo />} />
            <Route path="pets" element={<YourPets />} />
          </Route>
          <Route path="/admin" element={<AdminPage />}>
            <Route path="manage-products" element={<ManageProducts />} />
            <Route path="manage-users" element={<ManageUsers />} />
          </Route>
        </Routes>

        <Footer />
      </Router>


    </>
  )
}

export default App;
