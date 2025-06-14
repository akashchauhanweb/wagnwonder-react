
function HeroInfo() {
  // === Gallery photos (replace URLs with yours) ===
  const galleryPhotos = [
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/1.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/2.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/3.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/4.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/5.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/8.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/6.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/7.png"
  ];

  return (
    <section className="container py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold">Why Choose Wag n Wonder?</h2>
        <p className="lead text-muted">
          At Wag n Wonder, we believe that pets deserve more than just care—they deserve a joyful,
          secure, and enriching experience. We are redefining pet parenting with a curated platform
          that connects pet lovers with the most trusted services, all under one woof!
        </p>
      </div>
      <div className="mb-5">
        <h4 className="fw-semibold text-center mb-4">🐾 What Sets Us Apart</h4>
        <div className="row g-4">
          {[
            {
              icon: "✅",
              title: "Verified & Trusted Pet Services",
              description:
                "We partner only with carefully vetted service providers—from crèches and boardings to groomers and trainers—so you can book with complete confidence.",
            },
            {
              icon: "🎥",
              title: "Live CCTV Access",
              description:
                "Enjoy real-time peace of mind! Our platform offers live CCTV access to selected facilities, allowing you to check in on your pet whenever you like.",
            },
            {
              icon: "📱",
              title: "Seamless Booking Experience",
              description:
                "With a user-friendly interface and dedicated support, booking pet services has never been easier. Find, compare, and confirm—all in a few clicks.",
            },
            {
              icon: "🎯",
              title: "Personalized Recommendations",
              description:
                "Tell us about your pet, and we’ll match you with services tailored to their breed, age, temperament, and preferences.",
            },
            {
              icon: "🐶",
              title: "Paw-sitive Community",
              description:
                "Join a growing tribe of responsible pet parents and passionate caregivers. Get tips, reviews, and recommendations from real pet lovers like you.",
            },
          ].map((item, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body text-center">
                  <div className="fs-2 mb-3">{item.icon}</div>
                  <h5 className="card-title fw-bold">{item.title}</h5>
                  <p className="card-text text-muted">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 📸 Gallery Section */}
      <div>
        <h4 className="fw-semibold text-center mb-4">📸 Gallery</h4>
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {galleryPhotos.map((src, idx) => (
            <div key={idx} className="col">
              <div className="ratio ratio-1x1 overflow-hidden rounded shadow-sm">
                <img
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="w-100 h-100"
                  style={{ objectFit: 'cover', transition: 'transform .3s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <hr className="my-5" style={{ borderColor: "#471915" }} />
      <div className="mb-5">
        <h4 className="fw-semibold text-center mb-4">🌟 Upcoming Features to Love</h4>
        <div className="row g-4 justify-content-center">
          {[
            {
              icon: "🛡️",
              title: "Pet Insurance Plans",
              description:
                "Protect your furry family members with insurance options covering emergencies, illnesses, and more.",
            },
            {
              icon: "✈️",
              title: "Travel & Boarding Tie-Ups",
              description:
                "Going on vacation? Our partners ensure your pet is cared for in certified, loving facilities.",
            },
            {
              icon: "🛍️",
              title: "One-Stop Pet Shop",
              description:
                "From accessories to food and grooming essentials, shop handpicked products delivered to your doorstep.",
            },
          ].map((feature, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body text-center">
                  <div className="fs-2 mb-3">{feature.icon}</div>
                  <h5 className="card-title fw-bold">{feature.title}</h5>
                  <p className="card-text text-muted">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-5">
        <p className="fs-5 fst-italic text-muted">
          Because when it comes to your pet, nothing but the best will do.
        </p>
        <h5 className="fw-bold">Join the Wag n Wonder family—where every tail wags with joy.</h5>
      </div>
    </section>
  );
}

export default HeroInfo;