import React from "react";
import HeroForm from "./HeroForm.jsx";
import HeroInfo from "./HeroInfo.jsx";
import HeroReviews from "./HeroReviews.jsx";
import HeroGallery from "./HeroGallery.jsx";

function Hero() {
    return (
        <>
            <HeroForm />
            <HeroInfo />
            <HeroReviews />
            {/* <HeroGallery /> */}
        </>
    );
}

export default Hero;
