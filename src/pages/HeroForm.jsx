import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import boardingIcon from '../assets/icons/boarding.png';
import eventsIcon from '../assets/icons/events.png';
import shopIcon from '../assets/icons/shop.png';
import servicesIcon from '../assets/icons/services.png';
import { getTokenFromApi } from "../assets/js/getToken";
import { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
    { label: 'Boarding', icon: boardingIcon, path: '/' },
    { label: 'Events', icon: eventsIcon, path: '/events' },
    { label: 'Shop', icon: shopIcon, comingSoon: true },
    { label: 'Services', icon: servicesIcon, comingSoon: true },
];

const TRUST_BADGES = ['Verified Partners', 'Live CCTV Access', '24/7 Support'];

function HeroForm() {
    const navigate = useNavigate();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];

    const [activeTab, setActiveTab] = useState(0);
    const [petCount, setPetCount] = useState("");
    const [cityMap, setCityMap] = useState(() => {
        const stored = localStorage.getItem("city_data");
        return stored ? JSON.parse(stored) : {};
    });
    const [cityValue, setCityValue] = useState(() => {
        return localStorage.getItem("user_city") || "";
    });

    const cities = Object.keys(cityMap).sort();
    const [checkInValue, setCheckInValue] = useState(today);
    const [checkOutValue, setCheckOutValue] = useState(tomorrow);
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [toastMessage, setToastMessage] = useState("");
    // Handle pending search from redirect
    useEffect(() => {
        const pending = localStorage.getItem("pending_search");
        if (pending) {
            const { petCount, city, checkIn, checkOut } = JSON.parse(pending);
            setPetCount(petCount);
            setCityValue(city);
            setCheckInValue(new Date(checkIn));
            setCheckOutValue(new Date(checkOut));
            localStorage.removeItem("pending_search");
        }
    }, []);

    // Fetch city list on mount
    useEffect(() => {
        const fetchCities = async () => {
            // Check if already cached
            const cached = localStorage.getItem("city_data");
            const cachedTime = localStorage.getItem("city_data_time");
            const oneHour = 60 * 60 * 1000;
            if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < oneHour) {
                setCityMap(JSON.parse(cached));
                return;
            }

            const payload = { action: "GET_CITY_LIST" };

            try {
                const token = await getTokenFromApi(payload);
                if (!token) {
                    console.error("Failed to generate token for city list");
                    return;
                }

                const res = await callServicesApi({
                    ...payload,
                    token: token
                });
                if (res?.success && res.cities) {
                    localStorage.setItem("city_data_time", Date.now().toString());
                    setCityMap(res.cities);
                }
            } catch (err) {
                console.error("Failed to fetch cities:", err);
            }
        };

        fetchCities();
    }, []);

    // // Get user location on mount
    // useEffect(() => {
    //     if (localStorage.getItem("user_city")) return;
        
    //     navigator.geolocation.getCurrentPosition(async (pos) => {
    //         const { latitude: lat, longitude: lon } = pos.coords;
    //         localStorage.setItem("user_location", JSON.stringify({ lat, lon }));
            
    //         try {
    //             const res = await fetch(
    //                 `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    //             );
    //             const data = await res.json();
    //             const city = data.address.city || data.address.town || data.address.village || data.address.state;
                
    //             if (cities.includes(city)) {
    //                 localStorage.setItem("user_city", city);
    //                 setCityValue(city);
    //             }
    //         } catch (err) {
    //             console.error("Failed to fetch city:", err);
    //         }
    //     });
    // }, [cities]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoadingSearch(true);

        const sessionId = localStorage.getItem("session_id");
        const formData = { 
            petCount, 
            city: cityValue, 
            checkIn: formatDate(checkInValue), 
            checkOut: formatDate(checkOutValue) 
        };

        if (!sessionId) {
            localStorage.setItem("pending_search", JSON.stringify(formData));
            navigate("/login");
            return;
        }

        // Get location coordinates
        let location = null;
        if (cityValue && cityMap[cityValue]) {
            const { latitude: lat, longitude: lon } = cityMap[cityValue];
            location = { lat, lon };
            localStorage.setItem("user_location", JSON.stringify(location));
        }

        try {
            const res = await callServicesApi({
                action: "SEARCH_AVAILABILITY",
                session_id: sessionId,
                pet_count: petCount,
                city: cityValue,
                check_in: formatDate(checkInValue),
                check_out: formatDate(checkOutValue),
                location
            });

            if (res?.status_code === 498) {
                localStorage.clear();
                window.location.href = "/login";
                return;
            }

            navigate("/search-results", {
                state: { 
                    results: res, 
                    petCount, 
                    check_in: formatDate(checkInValue), 
                    check_out: formatDate(checkOutValue) 
                }
            });
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoadingSearch(false);
        }
    };

    return (
        <section className="hero-section">
            <div className="hero-pattern" />
            <div className="hero-content">
                <div className="row align-items-center g-5">
                    {/* Left Column */}
                    <div className="col-lg-6">
                        <div className="hero-nav-pills">
                            {NAV_ITEMS.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`hero-pill ${idx === activeTab ? 'active' : 'inactive'} ${item.comingSoon ? 'coming-soon' : ''}`}
                                    onClick={() => {
                                        if (item.comingSoon) {
                                            setToastMessage(`${item.label} is launching soon!`);
                                            setTimeout(() => setToastMessage(""), 3000);
                                        } else {
                                            setActiveTab(idx);
                                            localStorage.setItem("activeNav", item.label);
                                            window.dispatchEvent(new Event("activeNavChanged"));
                                            navigate(item.path);
                                        }
                                    }}
                                >
                                    <img src={item.icon} alt={item.label} className="hero-pill-icon" />
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mb-4">
                            <h1 className="hero-title">Premium Care for Your Furry Family</h1>
                            <p className="hero-subtitle">
                                Find trusted boarding, grooming, and pet services near you.
                                Because your pet deserves nothing but the best.
                            </p>
                        </div>

                        <div className="hero-trust-badges">
                            {TRUST_BADGES.map((badge, idx) => (
                                <div key={idx} className="hero-trust-badge">
                                    <span className="hero-check-icon">✓</span>
                                    {badge}
                                </div>
                            ))}
                        </div>

                        <div className="hero-partner-cta desktop-only">
                            <span>Own a pet crèche? </span>
                            <span 
                                className="hero-partner-link"
                                onClick={() => navigate("/contact", { state: { subject: "partnership" } })}
                            >
                                Partner with us
                            </span>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="col-lg-6">
                        <div className="hero-form-card">
                            <h2 className="hero-form-title">Find Pet Boarding</h2>
                            
                            <form onSubmit={handleSearch}>
                                <div className="hero-input-group">
                                    <label className="hero-input-label">Number of Pets</label>
                                    <select
                                        value={petCount}
                                        onChange={e => setPetCount(e.target.value)}
                                        required
                                        className="hero-input"
                                    >
                                        <option value="">Select number of pets</option>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>{n} Pet{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hero-input-group">
                                    <label className="hero-input-label">City</label>
                                    <select
                                        value={cityValue}
                                        onChange={e => setCityValue(e.target.value)}
                                        required
                                        className="hero-input"
                                    >
                                        <option value="">Select your city</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hero-date-row">
                                    <div className="hero-input-group">
                                        <label className="hero-input-label">Check-in</label>
                                        <DatePicker
                                            selected={checkInValue}
                                            onChange={(date) => {
                                                setCheckInValue(date);
                                                // Auto-adjust checkout if needed
                                                if (checkOutValue <= date) {
                                                    const nextDay = new Date(date);
                                                    nextDay.setDate(nextDay.getDate() + 1);
                                                    setCheckOutValue(nextDay);
                                                }
                                            }}
                                            minDate={today}
                                            dateFormat="MMM d, yyyy"
                                            className="hero-input"
                                            calendarClassName="hero-calendar"
                                            wrapperClassName="hero-datepicker-wrapper"
                                        />
                                    </div>
                                    <div className="hero-input-group">
                                        <label className="hero-input-label">Check-out</label>
                                        <DatePicker
                                            selected={checkOutValue}
                                            onChange={(date) => setCheckOutValue(date)}
                                            minDate={new Date(checkInValue.getTime() + 86400000)}
                                            dateFormat="MMM d, yyyy"
                                            className="hero-input"
                                            calendarClassName="hero-calendar"
                                            wrapperClassName="hero-datepicker-wrapper"
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={loadingSearch} className="hero-submit-btn">
                                    {loadingSearch && (
                                        <span className="spinner-border spinner-border-sm" role="status" />
                                    )}
                                    {loadingSearch ? 'Searching...' : 'Search Availability'}
                                </button>
                            </form>
                        </div>

                        <div className="hero-partner-cta mobile-only">
                            <span>Own a pet crèche? </span>
                            <span 
                                className="hero-partner-link"
                                onClick={() => navigate("/contact", { state: { subject: "partnership" } })}
                            >
                                Partner with us
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Message */}
            {toastMessage && (
                <div className="hero-toast">
                    <i className="bi bi-info-circle"></i>
                    {toastMessage}
                </div>
            )}
        </section>
    );
}

export default HeroForm;