import React from 'react';
import Title from './Title/Title';
import './HowItWorks.css';
import {HowItWorks as HowItWorksData} from '../../constants/index.js'

const HowItWorks = () => {
  return (
    <div className='how-it-works'>
      <Title subtitle="Effortlessly generate your AI-powered timetable." title="Get Started in Simple Steps"></Title>
      <div className='how-it-works-container'>
        {HowItWorksData.map((step)=>(
            <div className='how-it-works-card' key={step.id}>
                <img src={step.icon} alt="" />
                <h3>{step.title}</h3>
                <p>{step.content}</p>
            </div>
        ))}
      </div>
    </div>
  )
}

export default HowItWorks

