import { Link, useParams } from "react-router-dom";
import "../styles/UnderConstructionPage.css";
import cryCharacter from "../images/Public Page/Cry-Character.png";
import orangeCircular from "../images/Public Page/Oragenish-Criclular.png";

const titleBySlug: Record<string, string> = {
  "our-team": "Our Team",
  products: "Products",
  contact: "Contact",
  feature: "Feature",
  pricing: "Pricing",
  credit: "Credit",
  faq: "FAQ",
  ios: "iOS",
  android: "Android",
  microsoft: "Microsoft",
  desktop: "Desktop",
  privacy: "Privacy",
  help: "Help",
  terms: "Terms",
};

const UnderConstructionPage = () => {
  const { slug = "" } = useParams();
  const pageTitle = titleBySlug[slug] || "This Page";

  return (
    <main className="under-construction-page">
      <img
        src={orangeCircular}
        alt=""
        aria-hidden="true"
        className="under-construction-blob"
      />

      <section className="under-construction-left">
        <h1>Sorry</h1>
        <h2>{pageTitle} Is Under Construction</h2>
        <p>
          Sorry for the inconvenience. Please return to the Home Page.
        </p>
        <Link to="/home" className="under-construction-home-btn">
          Back to homepage
        </Link>
      </section>

      <section className="under-construction-right">
        <img
          src={cryCharacter}
          alt="Under construction illustration"
          className="under-construction-character"
        />
      </section>
    </main>
  );
};

export default UnderConstructionPage;
