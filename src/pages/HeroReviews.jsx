// import React, { useEffect } from "react";
// import meetaSharmaPhoto from '../assets/images/reviews/meeta-sharma.png';
// import jayeetaMitraPhoto from '../assets/images/reviews/jayeeta-mitra.png';

// function HeroReviews() {
//     const reviews = [
//         {
//             name: "Meeta Sharma",
//             role: "Entrepreneur",
//             photo: meetaSharmaPhoto,
//             content: `We boarded our pet here, and the experience was truly exceptional. He had an amazing time exploring the wide, open spaces and playing to his heart's content.
//                     It's rare to find such a safe, clean, and thoughtfully designed environment where pets can just be themselves. Our furry friend came back happy and full of energy.
//                     This place is nothing short of perfect for pet parents looking for quality care.`,
//         },
//         {
//             name: "Jayeeta Mitra",
//             role: "Homemaker",
//             photo: jayeetaMitraPhoto,
//             content: `The facility is beautifully designed with pets in mind, offering a safe and
//                     welcoming space for them to feel at home. Every corner reflects thoughtful attention to detail.
//                     The staff is incredibly cooperative and genuinely
//                     passionate about caring for animals. It's the kind of place where you instantly feel confident
//                     leaving your pet. I'm certain any furry guest here will have a wonderful time!`,
//         }
//     ];

//     useEffect(() => {
//         if (window.bootstrap) {
//             const el = document.querySelector("#reviewCarousel");
//             new window.bootstrap.Carousel(el, {
//                 interval: 6000,
//                 ride: "carousel",
//             });
//         }
//     }, []);

//     return (
//         <>
//             <div className="py-5" style={{ backgroundColor: "#471915" }}>
//                 <div className="container">
//                     <div className="position-relative">
//                         <div className="position-relative mx-auto" style={{ maxWidth: "900px" }}>
//                             <div id="reviewCarousel" className="carousel slide" data-bs-ride="carousel">
//                                 <div className="carousel-inner">
//                                     <h2 className="fw-bold mb-4 text-center" style={{ color: "white" }}>
//                                         What pet lovers <br /> say about us?
//                                     </h2>
//                                     {reviews.map((r, i) => (
//                                         <div className={`carousel-item ${i === 0 ? "active" : ""}`} key={i}>
//                                             <div className="d-flex flex-column flex-md-row align-items-center px-5 gap-5 mt-4 justify-content-center">
//                                                 <img
//                                                     src={r.photo}
//                                                     alt={r.name}
//                                                     className="rounded-circle"
//                                                     style={{ width: "220px", height: "220px", objectFit: "cover" }}
//                                                 />
//                                                 <div style={{ color: "white" }}>
//                                                     <div className="d-flex justify-content-between align-items-center gap-2 fw-semibold" style={{ color: "#ffd166" }}>
//                                                         <div>{r.name}</div>
//                                                         <div>
//                                                             <span style={{ fontSize: "0.9rem", color: "#FFFFFF" }}>
//                                                                 ★★★★★
//                                                             </span>
//                                                         </div>
//                                                     </div>

//                                                     <div className="small mb-2" style={{ color: "#f6f1e5" }}>{r.role}</div>
//                                                     <p className="mb-0" style={{ color: "white" }}>{r.content}</p>
//                                                 </div>
//                                             </div>

//                                         </div>
//                                     ))}

//                                 </div>

//                                 {/* Controls */}
//                                 <button className="carousel-control-prev" type="button" data-bs-target="#reviewCarousel" data-bs-slide="prev">
//                                     <span className="carousel-control-prev-icon" aria-hidden="true"></span>
//                                 </button>
//                                 <button className="carousel-control-next" type="button" data-bs-target="#reviewCarousel" data-bs-slide="next">
//                                     <span className="carousel-control-next-icon" aria-hidden="true"></span>
//                                 </button>
//                             </div>
//                         </div>


//                     </div>
//                 </div>
//             </div>

//         </>
//     );
// }

// export default HeroReviews;

import React from "react";
import meetaSharmaPhoto from "../assets/images/reviews/meeta-sharma.png";
import jayeetaMitraPhoto from "../assets/images/reviews/jayeeta-mitra.png";

function HeroReviews() {
    const reviews = [
        {
            name: "Meeta Sharma",
            role: "Entrepreneur",
            photo: meetaSharmaPhoto,
            content: `We boarded our pet here, and the experience was truly exceptional. He had an amazing time exploring the wide, open spaces and playing to his heart's content. It's rare to find such a safe, clean, and thoughtfully designed environment where pets can just be themselves. Our furry friend came back happy and full of energy. This place is nothing short of perfect for pet parents looking for quality care.`,
        },
        {
            name: "Jayeeta Mitra",
            role: "Homemaker",
            photo: jayeetaMitraPhoto,
            content: `The facility is beautifully designed with pets' comfort in mind. I loved the attention to detail and the warmth of the staff. My dog usually takes time to settle in, but here he felt at home from day one. A heartfelt thank you to the entire team for their care and dedication.`,
        },
    ];

    return (
        <section className="container py-5 mt-5 border-top">
            <div className="text-center mb-5">
                <h2 className="fw-bold">What Pet Parents Say</h2>
                <p className="lead text-muted">
                    Hear directly from our happy customers who’ve experienced the Wag n Wonder difference.
                </p>
            </div>
            <div className="row g-4">
                {reviews.map((review, idx) => (
                    <div key={idx} className="col-md-6">
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-body">
                                <div className="d-flex align-items-center mb-3">
                                    <img
                                        src={review.photo}
                                        alt={review.name}
                                        className="rounded-circle me-3"
                                        style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                    />
                                    <div>
                                        <h6 className="mb-0 fw-bold">{review.name}</h6>
                                        <small className="text-muted">{review.role}</small>
                                    </div>
                                </div>
                                <p className="text-muted fst-italic">“{review.content}”</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-5">
                <p className="fs-5 fst-italic text-muted">
                    Your pet’s comfort is our biggest reward. Join hundreds of happy pet parents today!
                </p>
            </div>
        </section>
    );
}

export default HeroReviews;

