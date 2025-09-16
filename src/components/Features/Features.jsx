import React from 'react';
import './Features.css';
import {features} from '../../constants/index';
import Title from '../Title/Title';

const Features = () => {
  return (
    <div className='features-section'>
      <Title subtitle="Everything you need, nothing you dont!" title="Key Features"></Title>
      <div className='feature-container'>
        {features.map((feature)=>(
          <div key={feature.id} className='feature-card'>
            <img src={feature.icon} alt="" />
            <h3>{feature.title}</h3>
            <p>{feature.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Features
