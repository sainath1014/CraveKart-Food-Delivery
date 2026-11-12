import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <div className="footer-logo">CraveKart.</div>
          <p>
            CraveKart is your premier food delivery destination offering delicious meals crafted by top chefs with fresh, wholesome ingredients. From vibrant healthy salads to decadent cakes and sizzlers, every craving is delivered fast and fresh across India.
          </p>
          <div className="footer-social-icons">
            {/* Facebook SVG */}
            <div className="footer-social-icon" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </div>
            {/* Twitter / X SVG */}
            <div className="footer-social-icon" title="Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            {/* LinkedIn SVG */}
            <div className="footer-social-icon" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>
              <Link
                to="/"
                onClick={() => {
                  setTimeout(() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  }, 50);
                }}
              >
                Home
              </Link>
            </li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>+91-98765-43210</li>
            <li>contact@cravekart.com</li>
            <li>support@cravekart.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2026 © CraveKart.com - All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;
