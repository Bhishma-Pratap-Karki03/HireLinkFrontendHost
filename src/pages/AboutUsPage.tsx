import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AboutUsPage.css";

import decorShape1 from "../images/Static Page Images/0_316.svg";
import decorShape2 from "../images/Static Page Images/0_452.svg";
import decorShape3 from "../images/Static Page Images/0_453.svg";
import decorShape4 from "../images/Static Page Images/0_317.svg";
import videoThumb from "../images/Static Page Images/3c669822e65f197887f1941b84ea2a08d29bcdaf.png";
import expertMain from "../images/Static Page Images/4e467700f6eac573fec33db122cc8f3e53adc529.png";
import expertAccent1 from "../images/Static Page Images/18db43fb4df317392515e99f2011c165393d863c.png";
import expertAccent2 from "../images/Static Page Images/6e4c42fdbc68f43b85f4f9665f8048f2e3a04f6b.png";
import aboutAiMatchingIcon from "../images/Public Page/aboutAiMatchingIcon.png";
import aboutAtsScannerIcon from "../images/Public Page/aboutAtsScannerIcon.png";
import aboutRealtimeTrackingIcon from "../images/Public Page/aboutRealtimeTrackingIcon.png";

const AboutUsPage = () => {
  const [activeAccordion, setActiveAccordion] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 },
    );

    const elements = document.querySelectorAll(".about-fade-up");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <Navbar />

      <section className="about-hero">
        <div className="about-hero-bg-decorations">
          <img
            src={decorShape1}
            className="about-decor-shape about-shape-1"
            alt=""
          />
          <img
            src={decorShape2}
            className="about-decor-shape about-shape-2"
            alt=""
          />
          <img
            src={decorShape3}
            className="about-decor-shape about-shape-3"
            alt=""
          />
          <img
            src={decorShape4}
            className="about-decor-shape about-shape-4"
            alt=""
          />
        </div>
        <div className="about-hero-blob about-hero-blob-1" />
        <div className="about-hero-blob about-hero-blob-2" />

        <div className="about-container about-hero-content">
          <div className="about-hero-tag">
            <span className="dot" />
            Smart Recruitment Platform
          </div>
          <h1 className="about-hero-title">
            About <span>HireLink</span>
          </h1>
          <p className="about-hero-subtitle">
            Bridging talent with opportunity through AI-powered job matching,
            skill portfolios, and intelligent recruitment tools.
          </p>
          <nav className="about-breadcrumb">
            <a href="/home">Home</a>
            <span className="sep">/</span>
            <span className="current">About Us</span>
          </nav>
        </div>
      </section>

      <section className="about-mission-strip">
        <div className="about-container about-mission-grid">
          <div className="about-mission-item">
            <div className="about-mission-icon blue">
              <img src={aboutAiMatchingIcon} alt="AI-Powered Matching" />
            </div>
            <div className="about-mission-text">
              <h4>AI-Powered Matching</h4>
              <p>
                Smart job recommendations based on your unique skill portfolio
              </p>
            </div>
          </div>
          <div className="about-mission-item">
            <div className="about-mission-icon green">
              <img src={aboutAtsScannerIcon} alt="ATS Resume Scanner" />
            </div>
            <div className="about-mission-text">
              <h4>ATS Resume Scanner</h4>
              <p>Automated screening to rank candidates efficiently</p>
            </div>
          </div>
          <div className="about-mission-item">
            <div className="about-mission-icon orange">
              <img src={aboutRealtimeTrackingIcon} alt="Real-Time Tracking" />
            </div>
            <div className="about-mission-text">
              <h4>Real-Time Tracking</h4>
              <p>Live application status updates for full transparency</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-intro-section">
        <div className="about-container">
          <div className="about-intro-grid">
            <div className="about-intro-left about-fade-up">
              <div className="about-section-label">Our Story</div>
              <h2>
                We&apos;ve been connecting talent with <em>opportunity</em>{" "}
                globally.
              </h2>
              <p>
                HireLink was built to solve one of the biggest challenges in
                recruitment - the gap between talented candidates and the right
                opportunities. We combine structured digital portfolios,
                AI-driven assessments, and smart matching to create a fairer,
                faster hiring process.
              </p>
              <div className="about-intro-chips">
                <span className="about-chip">Job Seekers</span>
                <span className="about-chip">Recruiters</span>
                <span className="about-chip">Administrators</span>
                <span className="about-chip">AI Assessments</span>
                <span className="about-chip">ATS Scanner</span>
              </div>
            </div>

            <div className="about-intro-right about-fade-up">
              <div className="about-accordion">
                {[
                  {
                    title: "Who we are?",
                    body: "HireLink is a MERN-stack recruitment platform designed to connect job seekers, recruiters, and administrators in a unified system.",
                  },
                  {
                    title: "What's our goal?",
                    body: "Our goal is to eliminate manual screening bottlenecks and improve job-candidate matching accuracy using AI.",
                  },
                  {
                    title: "Our vision",
                    body: "We envision a world where every candidate's potential is fairly assessed and where recruiters hire through transparent, skill-first data.",
                  },
                  {
                    title: "What makes us different?",
                    body: "Unlike traditional job boards, HireLink integrates AI quizzes, ATS screening, and structured portfolios into one system.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className={`about-accordion-item ${
                      activeAccordion === index ? "active" : ""
                    }`}
                  >
                    <button
                      className="about-accordion-header"
                      onClick={() => setActiveAccordion(index)}
                      type="button"
                    >
                      <h3>{item.title}</h3>
                      <span className="about-acc-icon">+</span>
                    </button>
                    <div className="about-accordion-body">
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-video-section">
        <div className="about-container">
          <div className="about-section-header">
            <div className="about-section-label center">Platform Overview</div>
            <h2>See HireLink in Action</h2>
            <p>
              Watch how our platform transforms the recruitment experience for
              candidates and recruiters alike.
            </p>
          </div>
          <div className="about-video-frame">
            <img
              src={videoThumb}
              alt="HireLink Platform Overview"
              className="about-video-thumb"
            />
            <div className="about-play-overlay">
              <div className="about-play-btn">▶</div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-experts-section">
        <div className="about-container">
          <div className="about-experts-grid">
            <div className="about-experts-image-wrap about-fade-up">
              <div className="about-img-stack">
                <img
                  src={expertMain}
                  alt="Expert team"
                  className="about-img-main"
                />
                <img
                  src={expertAccent1}
                  alt=""
                  className="about-img-accent-1"
                />
                <img
                  src={expertAccent2}
                  alt=""
                  className="about-img-accent-2"
                />
              </div>
            </div>

            <div className="about-experts-content about-fade-up">
              <div className="about-section-label">Our Talent Network</div>
              <h2>
                Access <em>50,000+</em> Talented Experts on HireLink.
              </h2>
              <p className="desc">
                A full hybrid workforce management toolkit is at your
                fingertips, alongside access to our top 1% of vetted talent
                matched by AI to your exact project needs.
              </p>

              <ul className="about-feature-list">
                <li>
                  <span className="about-check-circle">✓</span> Seamless
                  skill-based candidate searching
                </li>
                <li>
                  <span className="about-check-circle">✓</span> Get top experts
                  for your project
                </li>
                <li>
                  <span className="about-check-circle">✓</span> Protected and
                  transparent workflows
                </li>
                <li>
                  <span className="about-check-circle">✓</span> AI-powered
                  portfolio assessment and ranking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <div className="about-container">
          <div className="about-cta-box">
            <div className="about-cta-text">
              <h2>The Complete Job and Talent Portal.</h2>
              <p>Sign up today and discover smarter hiring powered by AI.</p>
            </div>
            <div className="about-cta-actions">
              <a href="/register" className="about-btn about-btn-white">
                Looking for a Job?
              </a>
              <a
                href="/recruiter/post-job"
                className="about-btn about-btn-ghost"
              >
                Post a Job
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUsPage;
