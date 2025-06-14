import boardingIcon from '../assets/icons/boarding.svg';
import shopIcon from '../assets/icons/shop.svg';
import servicesIcon from '../assets/icons/services.svg';
import healthIcon from '../assets/icons/health.svg';
import stateCityMap from '../assets/js/stateCityMap';
import React, { useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useNavigate } from "react-router-dom";


function HeroForm() {
    const navItems = [
        { label: 'Boarding', icon: boardingIcon, active: true },
        { label: 'Shop', icon: shopIcon },
        { label: 'Services', icon: servicesIcon },
        { label: 'Health', icon: healthIcon },
    ];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const formatDate = (date) => date.toISOString().split('T')[0];
    // get state→city mapping, flatten into one array, dedupe & sort
    const cityMap = stateCityMap();
    const allCities = Object.values(cityMap)
        .flatMap(stateCities => Object.keys(stateCities))

    // 3. Dedupe & sort
    const cities = Array.from(new Set(allCities)).sort()
    const storedCity = localStorage.getItem("user_city");
    const defaultCity = storedCity && cities.includes(storedCity)
        ? storedCity
        : "";

    const navigate = useNavigate();
    const [petCount, setPetCount] = useState("");
    const [cityValue, setCityValue] = useState(defaultCity);
    const [checkInValue, setCheckInValue] = useState(formatDate(today));
    const [checkOutValue, setCheckOutValue] = useState(formatDate(tomorrow));
    const [loadingSearch, setLoadingSearch] = useState(false);

    const pending = localStorage.getItem("pending_search");
    if (pending) {
        const { petCount, city, checkIn, checkOut } = JSON.parse(pending);
        setPetCount(petCount);
        setCityValue(city);
        setCheckInValue(checkIn);
        setCheckOutValue(checkOut);
        localStorage.removeItem("pending_search");
    }

    // ── New submit handler ───────────────────────────────────────────────────
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoadingSearch(true);
        // before building your payload
        const rawLocation = localStorage.getItem("user_location");
        let location;
        if (rawLocation) {
            // already stored from header or previous search
            location = JSON.parse(rawLocation);

        } else if (cityValue) {
            // no geo, but user has picked a city → grab its coords
            const map = stateCityMap();
            for (const st in map) {
                if (map[st][cityValue]) {
                    const { latitude: lat, longitude: lon } = map[st][cityValue];
                    location = { lat, lon };
                    // cache for next time
                    localStorage.setItem("user_location", JSON.stringify(location));
                    break;
                }
            }

        } else {
            // still nothing
            location = null;
        }                    // missing or empty → keep null

        const payload = {
            action: "SEARCH_AVAILABILITY",
            session_id: localStorage.getItem("session_id"),
            pet_count: petCount,
            city: cityValue,
            check_in: checkInValue,
            check_out: checkOutValue,
            location: location
        };

        const sessionId = localStorage.getItem("session_id");
        const formData = {
            petCount,
            city: cityValue,
            checkIn: checkInValue,
            checkOut: checkOutValue,
        };
        if (!sessionId) {
            // save pending form
            localStorage.setItem("pending_search", JSON.stringify(formData));
            // redirect to login
            navigate("/login");
            return;
        }
        console.log(payload);
        try {
            const res = await callServicesApi(payload);
            if (res?.status_code === 498) {
                localStorage.clear();
                window.location.href = "/login";
                return;
            }
            console.log(res);
            navigate("/search-results", {
                state: {
                    results: res,
                    petCount: petCount,       // the array of available kennels
                    check_in: checkInValue,  // pass along dates if needed
                    check_out: checkOutValue,
                },
            });
        } catch (err) {
            console.error("Search error:", err);
        }
    };

    return (
        <>
            <div
                id="hero-form-div"
                className="py-4 px-3"
                style={{
                    backgroundColor: "rgb(216, 74, 57)",
                }}
            >
                <div className="container" style={{ maxWidth: "1000px" }}>
                    <div className="d-flex align-items-center gap-3 overflow-auto" style={{ whiteSpace: 'nowrap' }}>
                        {navItems.map((item, idx) => (
                            <div
                                key={idx}
                                id="hero-scroll-icon"
                                className={
                                    `d-flex align-items-center flex-md-row flex-column text-center gap-2 px-3 py-2 rounded shadow ${item.active ? 'bg-white border border-dark' : 'bg-white opacity-4'}`
                                }
                                style={{
                                    cursor: 'pointer'
                                }}
                            >
                                <img id="hero-icons" src={item.icon} alt={item.label} />
                                <span className="fw-medium fs-6">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 fs-5">
                        <form
                            onSubmit={handleSearch}
                            className="p-4 rounded shadow-sm"
                            style={{ backgroundColor: "#F8F8F8" }}
                        >
                            <div className="form-floating mb-3">
                                <select
                                    id="petCount"
                                    className="form-select"
                                    placeholder="petCount"
                                    value={petCount}
                                    onChange={e => setPetCount(e.target.value)}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                                <label htmlFor="petCount" className="form-label">Number of pets</label>
                            </div>
                            <div className="form-floating mb-3">
                                <select
                                    id="city"
                                    className="form-select"
                                    placeholder="City"
                                    value={cityValue}
                                    onChange={e => setCityValue(e.target.value)}
                                    required
                                >
                                    <option value="">Select</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                                <label htmlFor="city" className="form-label">City</label>
                            </div>
                            <div className="mb-3">
                                <div className="input-group">

                                    <div className="form-floating" defaultValue={formatDate(today)}>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="checkIn"
                                            placeholder="Check-in"
                                            value={checkInValue}
                                            onChange={e => setCheckInValue(e.target.value)}
                                            onFocus={e => e.target.showPicker && e.target.showPicker()}
                                            required
                                        />
                                        <label htmlFor="checkIn">Check-in</label>
                                    </div>

                                    <div className="form-floating" defaultValue={formatDate(tomorrow)}>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="checkOut"
                                            placeholder="Check-out"
                                            value={checkOutValue}
                                            onChange={e => setCheckOutValue(e.target.value)}
                                            onFocus={e => e.target.showPicker && e.target.showPicker()}
                                            required
                                        />

                                        <label htmlFor="checkOut">Check-out</label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-grid mt-3">
                                <button
                                    type="submit"
                                    className="btn py-2"
                                    style={{ backgroundColor: "#471915", color: "white" }}
                                    disabled={loadingSearch}
                                >
                                    {loadingSearch && (
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {loadingSearch ? "" : "Book Now"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HeroForm;