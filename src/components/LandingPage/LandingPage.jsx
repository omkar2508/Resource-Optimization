import React from 'react';
import './LandingPage.css';
import next from '../../assets/next-icon.png'
import hero2 from '../../assets/hero2.jpg'

const LandingPage = () => {
  return (  
    <div className='hero'>
      {/* left side */}
      <div className='hero-text'>
        <h1>Resource Optimization Dashboard</h1>
        <h2>Powered by AI</h2>
        <p>An AI-powered platform to simplify scheduling, optimize resources, and balance workloads efficiently. </p>
        <button className='btn'>Explore More <img src={next} alt=''/></button>
      </div>

      {/* Right side */}
        <div className='hero-right'>
          <img src={hero2} alt="dashboard preview" />
          {/* <div className="split-image-container">
          <div className="quadrant quadrant-1"></div>
          <div className="quadrant quadrant-2"></div>
          <div className="quadrant quadrant-3"></div>
          <div className="quadrant quadrant-4"></div>
        </div> */}
      </div>

      
    </div>
  )
}
export default LandingPage