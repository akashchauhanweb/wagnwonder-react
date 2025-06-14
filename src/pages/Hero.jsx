import React from "react";
import HeroForm from "./HeroForm.jsx";
import HeroInfo from "./HeroInfo.jsx";
import HeroReviews from "./HeroReviews.jsx";

function Hero() {
    return (
        <>
            <HeroForm />
            <HeroInfo />
            <HeroReviews />
        </>
    );
}

export default Hero;
