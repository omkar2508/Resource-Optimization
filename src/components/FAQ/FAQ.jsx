import React, { useState } from 'react';
import './FAQ.css';
import { FAQ as FAQDATA } from '../../constants/index.js';

const FAQ = () => {
  const [isOpenDropdown, setOpenDropdown] = useState(null);
  const toggleFAQ = (index) => {
    setOpenDropdown(isOpenDropdown === index ? null : index);
  }
  return (
    <div className='section-FAQ'>
      <h1>Frequently Asked <span>Questions</span></h1>
      <h3>Got questions? We've got answers. If you don't see your query here, feel free to contact us.</h3>
      <div className='FAQ-container'>
        {FAQDATA.map((item, index)=>(
          <div className='FAQ-item' key={item.id}>
            <div className='FAQ-question' onClick={()=>toggleFAQ(index)}>
              <h3>{item.title}</h3>
              <span className="FAQ-icon">{isOpenDropdown === index ? "−" : "+"}</span>
            </div>
            {isOpenDropdown === index && (
              <div className='FAQ-answer'>
                <p>{item.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FAQ