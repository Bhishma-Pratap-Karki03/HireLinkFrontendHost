import React from "react";
import { Link } from "react-router-dom";
import "../styles/NotFoundPage.css";
import notfound from "../images/Register Page Images/1_14.svg";

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-wrapper">
      <div className="not-found-content">
        {/* Left Image Section */}
        <div className="image-container">
          <div className="image-wrapper">
            <img
              src={notfound}
              alt="404 illustration - explorer with binoculars"
              className="error-illustration"
            />
          </div>
        </div>

        {/* Right Content Section */}
        <div className="text-container">
          <div className="text-content">
            <div className="error-header">
              <h1 className="error-code">404</h1>
              <h2 className="error-heading">OOOps!</h2>
              <h3 className="error-subheading">Page Not Found</h3>
            </div>

            <div className="error-message">
              <p className="error-text">
                This page doesn't exist or was removed!
              </p>
              <p className="error-suggestion">We suggest you back to home</p>
            </div>

            <Link to="/" className="home-redirect-btn">
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
