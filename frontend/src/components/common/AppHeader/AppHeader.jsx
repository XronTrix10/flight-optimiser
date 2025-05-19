// src/components/common/AppHeader/AppHeader.jsx
import React from "react";
import "./AppHeader.css"; // Optional styling file

const AppHeader = () => {
  return (
    <header className="app-header">
      <div className="logo">Flight Optimization System</div>
      <nav className="main-nav">
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/routes">Routes</a>
          </li>
          <li>
            <a href="/simulation">Simulation</a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default AppHeader;
