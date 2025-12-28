import HeroForm from "./HeroForm.jsx";
import HeroInfo from "./HeroInfo.jsx";
import HeroReviews from "./HeroReviews.jsx";
import { useEffect } from "react";

function Hero() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <HeroForm />
            <HeroInfo />
            <HeroReviews />
        </>
    );
}

export default Hero;
