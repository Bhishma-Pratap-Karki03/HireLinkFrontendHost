import { FormEvent, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ContactUsPage.css";
import heroShape from "../images/Public Page/contact-hero-shape.svg";
import sectionLine from "../images/Public Page/contact-section-line.svg";
import sendArrow from "../images/Public Page/contact-send-arrow.svg";
import socialFacebook from "../images/Public Page/contact-social-facebook.svg";
import socialTwitter from "../images/Public Page/contact-social-twitter.svg";
import socialPinterest from "../images/Public Page/contact-social-pinterest.svg";
import socialInstagram from "../images/Public Page/contact-social-instagram.svg";
import socialYoutube from "../images/Public Page/contact-social-youtube.svg";

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");

  const onInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setStatusMessage("");
    setStatusType("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setStatusType("error");
      setStatusMessage("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setStatusType("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      setStatusType("success");
      setStatusMessage(
        "Message sent successfully. We will get back to you soon.",
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      setStatusType("error");
      setStatusMessage(
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="contact-page">
        <section id="contact-hero-section">
          <div className="contact-hero-container">
            <img src={heroShape} className="contact-hero-shape" alt="" />
            <div className="contact-hero-content">
              <h1>Contact Us</h1>
            </div>
          </div>
        </section>

        <section id="contact-body-section">
          <div className="container contact-body-wrapper">
            <div className="contact-form-col">
              <div className="contact-section-header">
                <div className="contact-header-line">
                  <img src={sectionLine} alt="" />
                  <span>CONTACT US</span>
                </div>
                <h2>
                  We&apos;re here to support your career journey and hiring
                  needs.
                </h2>
              </div>

              <form className="contact-main-form" onSubmit={onSubmit}>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label htmlFor="contact-name">Your Name *</label>
                    <div className="contact-input-wrapper">
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={onInputChange}
                      />
                    </div>
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="contact-email">Email *</label>
                    <div className="contact-input-wrapper">
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={onInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-subject">Subject *</label>
                  <div className="contact-input-wrapper">
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      placeholder="Enter subject"
                      value={formData.subject}
                      onChange={onInputChange}
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-message">Your Message *</label>
                  <div className="contact-input-wrapper">
                    <textarea
                      id="contact-message"
                      name="message"
                      placeholder="Enter here..."
                      rows={6}
                      value={formData.message}
                      onChange={onInputChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="contact-btn-send"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                  <span className="contact-btn-icon">
                    <img src={sendArrow} alt="" />
                  </span>
                </button>

                {statusMessage && (
                  <p
                    className={`contact-status ${
                      statusType === "success" ? "success" : "error"
                    }`}
                  >
                    {statusMessage}
                  </p>
                )}
              </form>
            </div>

            <div className="contact-info-col">
              <div className="contact-info-card">
                <div className="contact-info-group">
                  <h3>Address</h3>
                  <p>Kamal Pokhari, Kathmandu, Nepal</p>
                </div>
                <div className="contact-info-group">
                  <h3>Contact</h3>
                  <p>Phone: +977-97756242</p>
                  <p>Email: hirelinknp@gmail.com</p>
                </div>
                <div className="contact-info-group">
                  <h3>Open Time</h3>
                  <p>Monday-Friday : 10:00-19:00</p>
                  <p>Sunday-Saturday: 11:00-19:00</p>
                </div>

                <div className="contact-social-icons">
                  <a
                    href="#"
                    className="contact-social-icon"
                    aria-label="Facebook"
                  >
                    <img src={socialFacebook} alt="" />
                  </a>
                  <a
                    href="#"
                    className="contact-social-icon"
                    aria-label="Twitter"
                  >
                    <img src={socialTwitter} alt="" />
                  </a>
                  <a
                    href="#"
                    className="contact-social-icon"
                    aria-label="Pinterest"
                  >
                    <img src={socialPinterest} alt="" />
                  </a>
                  <a
                    href="#"
                    className="contact-social-icon"
                    aria-label="Instagram"
                  >
                    <img src={socialInstagram} alt="" />
                  </a>
                  <a
                    href="#"
                    className="contact-social-icon"
                    aria-label="YouTube"
                  >
                    <img src={socialYoutube} alt="" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ContactUsPage;


