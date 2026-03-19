import "../styles/Footer.css";
import { Link } from "react-router-dom";

// Import images
import logoImg from "../images/Register Page Images/Logo.png";
import socialBg1 from "../images/Register Page Images/1_2758.svg";
import socialFg1 from "../images/Register Page Images/1_2759.svg";
import socialBg2 from "../images/Register Page Images/1_2762.svg";
import socialFg2 from "../images/Register Page Images/1_2768.svg";
import socialBg3 from "../images/Register Page Images/1_2771.svg";
import socialFg3 from "../images/Register Page Images/1_2773.svg";
import socialBg4 from "../images/Register Page Images/1_2777.svg";
import socialFg4 from "../images/Register Page Images/1_2778.svg";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-about">
            <img src={logoImg} alt="HireLink Logo" className="footer-logo" />
            <p>
              HireLink connects candidates and recruiters in one smart platform
              to discover opportunities, manage applications, and hire faster.
            </p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-links-col">
              <h4>Company</h4>
              <ul>
                <li>
                  <Link to="/about-us">About us</Link>
                </li>
                <li>
                  <Link to="/under-construction/our-team">Our Team</Link>
                </li>
                <li>
                  <Link to="/under-construction/products">Products</Link>
                </li>
                <li>
                  <Link to="/contact-us">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Product</h4>
              <ul>
                <li>
                  <Link to="/under-construction/feature">Feature</Link>
                </li>
                <li>
                  <Link to="/under-construction/pricing">Pricing</Link>
                </li>
                <li>
                  <Link to="/under-construction/credit">Credit</Link>
                </li>
                <li>
                  <Link to="/under-construction/faq">FAQ</Link>
                </li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Download</h4>
              <ul>
                <li>
                  <Link to="/under-construction/ios">iOS</Link>
                </li>
                <li>
                  <Link to="/under-construction/android">Android</Link>
                </li>
                <li>
                  <Link to="/under-construction/microsoft">Microsoft</Link>
                </li>
                <li>
                  <Link to="/under-construction/desktop">Desktop</Link>
                </li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Support</h4>
              <ul>
                <li>
                  <Link to="/under-construction/privacy">Privacy</Link>
                </li>
                <li>
                  <Link to="/under-construction/help">Help</Link>
                </li>
                <li>
                  <Link to="/under-construction/terms">Terms</Link>
                </li>
                <li>
                  <Link to="/under-construction/faq">FAQ</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <p className="copyright">
            Copyright {String.fromCharCode(169)}{currentYear} <a href="#">HireLink</a>. All Rights Reserved
          </p>
          <div className="social-links">
            <Link to="/under-construction/desktop" className="social-icon" aria-label="Facebook">
              <img src={socialBg1} alt="" className="social-bg" />
              <img src={socialFg1} alt="Facebook icon" className="social-fg" />
            </Link>
            <Link to="/under-construction/desktop" className="social-icon" aria-label="Twitter">
              <img src={socialBg2} alt="" className="social-bg" />
              <img src={socialFg2} alt="Twitter icon" className="social-fg" />
            </Link>
            <Link to="/under-construction/desktop" className="social-icon" aria-label="Instagram">
              <img src={socialBg3} alt="" className="social-bg" />
              <img src={socialFg3} alt="Instagram icon" className="social-fg" />
            </Link>
            <Link to="/under-construction/desktop" className="social-icon" aria-label="TikTok">
              <img src={socialBg4} alt="" className="social-bg" />
              <img src={socialFg4} alt="TikTok icon" className="social-fg" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

