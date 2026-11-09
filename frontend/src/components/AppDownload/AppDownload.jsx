import React from 'react';
import './AppDownload.css';
import { Smartphone, Play } from 'lucide-react';

const AppDownload = () => {
  return (
    <div className="app-download" id="app-download">
      <p>
        For Better Experience Download <br />
        <span style={{ color: '#FF6347' }}>CraveKart App</span>
      </p>

      <div className="app-download-platforms">
        {/* Google Play Store Badge */}
        <div className="app-badge-btn" onClick={() => alert('CraveKart Android App is coming soon to Google Play Store!')}>
          <Play size={28} fill="white" />
          <div className="app-badge-text">
            <small>GET IT ON</small>
            <strong>Google Play</strong>
          </div>
        </div>

        {/* Apple App Store Badge */}
        <div className="app-badge-btn" onClick={() => alert('CraveKart iOS App is coming soon to Apple App Store!')}>
          <Smartphone size={28} />
          <div className="app-badge-text">
            <small>Download on the</small>
            <strong>App Store</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownload;
