import boardingIcon from '../icons/boarding.svg';
import shopIcon from '../icons/shop.svg';
import servicesIcon from '../icons/services.svg';
import healthIcon from '../icons/health.svg';


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
    return (
        <>
            <div id="hero-form-div" className="py-4 px-3" style={{ backgroundColor: 'rgb(216, 74, 57)'}}>
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
                    <form className="p-4 rounded shadow-sm" style={{backgroundColor: "#F8F8F8"}}>
                        <div className="form-floating mb-3">
                            <select id="petCount" className="form-select" placeholder="petCount">
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
                            <select id="city" className="form-select" placeholder="City">
                                <option value="">Select</option>
                                <option value="Siliguri">Siliguri</option>
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
                                        onFocus={(e) => (e.target.showPicker && e.target.showPicker())}
                                    />
                                    <label htmlFor="checkIn">Check-in</label>
                                </div>

                                <div className="form-floating" defaultValue={formatDate(tomorrow)}>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="checkOut"
                                        placeholder="Check-out"
                                        onFocus={(e) => (e.target.showPicker && e.target.showPicker())}
                                    />
                                    <label htmlFor="checkOut">Check-out</label>
                                </div>
                            </div>
                        </div>


                        <div className="d-grid mt-3">
                            <button type="submit" className="btn py-2" style={{backgroundColor: "#471915", color: "white"}}>
                                Book Now
                            </button>
                        </div>

                    </form>
                </div>
            </div>

        </>
    );
}

export default HeroForm;