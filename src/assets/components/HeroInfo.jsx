import React, { useEffect } from "react";


function HeroInfo() {
    const items = [
    {
      icon: "🐾",
      title: "Verified Creches",
      description: "Every creche is verified for safety and hygiene.",
    },
    {
      icon: "🩺",
      title: "Vet-on-Call Support",
      description: "Immediate assistance from qualified veterinarians.",
    },
    {
      icon: "🧼",
      title: "Grooming & Spa",
      description: "Pamper your pets with professional grooming services.",
    },
    {
      icon: "📸",
      title: "Real-Time Updates",
      description: "Stay connected with photo/video updates of your pet.",
    },
  ];

  // Initialize carousel manually for small screens
  useEffect(() => {
    if (window.bootstrap) {
      const carouselElement = document.querySelector('#whyChooseCarousel');
      if (carouselElement && window.innerWidth < 768) {
        new window.bootstrap.Carousel(carouselElement, {
          interval: 2000,
          ride: 'carousel',
        });
      }
    }
  }, []);

  return (
    <div className="py-5" style={{ backgroundColor: "#ffffff"}}>
      <div className="container">
        <h2 className="mb-4 text-center" style={{fontFamily: "san-serif"}}>Why Choose Us?</h2>

        {/* Show as cards on md+ */}
        <div className="row d-none d-md-flex">
          {items.map((item, index) => (
            <div className="col-md-3 mb-4" key={index}>
              <div className="card h-100 shadow-lg border-0 rounded-4 p-3">
                <div className="display-4">{item.icon}</div>
                <h5 className="mt-3">{item.title}</h5>
                <p className="text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Show as carousel on small screens */}
        <div id="whyChooseCarousel" className="carousel slide d-md-none" data-bs-ride="carousel">
          <div className="carousel-inner">
            {items.map((item, index) => (
              <div className={`carousel-item ${index === 0 ? "active" : ""}`} key={index}>
                <div className="card mx-3 shadow-lg border-0 rounded-4 p-4">
                  <div className="display-4">{item.icon}</div>
                  <h5 className="mt-3">{item.title}</h5>
                  <p className="text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroInfo;