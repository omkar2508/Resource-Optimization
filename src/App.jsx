import './index.css';
import styles from './style';
import { Navbar, LandingPage, Features, HowItWorks, Ready, FAQ, Footer, Login } from './components';

function App() {

  return (
    <div className='bg-primary w-full overflow-hidden'>
      
      {/* Navbar */}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar/>
        </div>
        {/* <Login/> */}
      </div>

      {/* Hero Section */}
      <div className={`bg-primary ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <LandingPage/>
        </div>
      </div>

      {/* Features Section */}
      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Features/>
        </div>
      </div>

      {/* How it Works */}
      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <HowItWorks/>
        </div>
      </div>

      {/* Ready Section */}
      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Ready/>
        </div>
      </div>

    </div>
  )
}

export default App
