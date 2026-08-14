"use client";

import { useEffect, useState } from "react";

// Replicates the "Hustle" plugin's network-wide "FREE 15-MINUTE
// CONSULTATION" slide-in (blog_id "0" in its own config - shared across
// every site, not per-page content, so it can't come from migrated
// post/page data). Confirmed against production (tyo and hk): appears
// bottom-right after a 15-second delay, dismissible, and stays dismissed
// for a year via a cookie - matching its own settings JSON
// (triggers.on_time_delay=15/seconds, expiration=365/days).
const DELAY_MS = 15000;
const COOKIE_NAME = "consultation_popup_dismissed";
const COOKIE_DAYS = 365;

function hasDismissedCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

function setDismissedCookie() {
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=1; max-age=${maxAge}; path=/`;
}

export default function ConsultationPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasDismissedCookie()) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const close = () => {
    setVisible(false);
    setDismissedCookie();
  };

  return (
    <div className="consultation-popup-overlay">
      <div className="consultation-popup">
        <button
          type="button"
          className="consultation-popup-close"
          aria-label="Close this module"
          onClick={close}
        >
          &times;
        </button>
        <div className="consultation-popup-image">
          <img
            src="/api/media/file/53841454_410839762822247_6902924111610118144_n-3.jpg"
            alt=""
          />
        </div>
        <div className="consultation-popup-content">
          <h3 className="consultation-popup-title">FREE 15-MINUTE CONSULTATION</h3>
          <p className="consultation-popup-text">
            Book a free 15-minute one-to-one phone consultation, with one of our friendly
            admissions specialists. Let&apos;s get your music moving!
          </p>
          <a
            className="consultation-popup-button"
            href="https://edu.garnishmusicproduction.com/connect"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here
          </a>
        </div>
      </div>
      <style>{`
        .consultation-popup-overlay {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999991;
          max-width: calc(100vw - 40px);
        }
        .consultation-popup {
          position: relative;
          display: flex;
          width: 580px;
          max-width: 100%;
          background: #F1FAEE;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
        .consultation-popup-close {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #F43918;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          z-index: 1;
        }
        .consultation-popup-image {
          flex: 0 0 232px;
          max-width: 232px;
        }
        .consultation-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .consultation-popup-content {
          padding: 32px 20px 20px;
          flex: 1;
        }
        .consultation-popup-title {
          color: #1D3557;
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 12px;
        }
        .consultation-popup-text {
          color: #888;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .consultation-popup-button {
          display: inline-block;
          background: #E63946;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          text-decoration: none;
          padding: 9px 45px;
        }
        @media (max-width: 640px) {
          .consultation-popup-overlay {
            left: 20px;
            right: 20px;
            bottom: 0;
          }
          .consultation-popup {
            width: 100%;
            flex-direction: column;
          }
          .consultation-popup-image {
            flex-basis: 140px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
