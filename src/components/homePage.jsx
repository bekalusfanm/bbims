import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/homePage.css";
import DonationLocations from "./donationLocations";
import ForDonors from "./forDonors";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import { FaHeart, FaUserNurse, FaStethoscope, FaPhone, FaMapMarkerAlt, FaEnvelope, FaAmbulance } from 'react-icons/fa';

const HomePage = () => {
  const [view, setView] = useState("");
  const { t } = useLanguage();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleWhereCanDonate = () => {
    setView("donationLocations");
  };

  const handleForDonors = () => {
    setView("forDonors");
  };

  return (
    <div className="homepage">
      <LanguageSwitcher />
      <HeroSection />
      <StatisticsSection />
      <BloodAvailability />
      <ServicesSection />
      <CallToAction
        onWhereCanDonate={handleWhereCanDonate}
        onForDonors={handleForDonors}
      />
      {view === "donationLocations" && <DonationLocations />}
      {view === "forDonors" && <ForDonors />}
      <Testimonials />
      <ContactInfo />
      <EmergencyButton onClick={() => setShowEmergencyModal(true)} />
      {showEmergencyModal && (
        <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
      )}
    </div>
  );
};

const StatisticsSection = () => {
  const [stats, setStats] = useState({
    donors: 0,
    donations: 0,
    lives: 0,
    hospitals: 0
  });

  useEffect(() => {
    // Animate the numbers
    const interval = setInterval(() => {
      setStats(prev => ({
        donors: prev.donors < 5000 ? prev.donors + 50 : 5000,
        donations: prev.donations < 15000 ? prev.donations + 150 : 15000,
        lives: prev.lives < 45000 ? prev.lives + 450 : 45000,
        hospitals: prev.hospitals < 100 ? prev.hospitals + 1 : 100
      }));
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="statistics-section">
      <div className="container">
        <div className="row">
          <StatItem number={stats.donors} label="Active Donors" />
          <StatItem number={stats.donations} label="Total Donations" />
          <StatItem number={stats.lives} label="Lives Saved" />
          <StatItem number={stats.hospitals} label="Partner Hospitals" />
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ number, label }) => (
  <div className="col-md-3">
    <div className="stat-item">
      <div className="stat-number">{number.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const BloodAvailability = () => {
  const bloodTypes = [
    { type: 'A+', level: 80 },
    { type: 'A-', level: 60 },
    { type: 'B+', level: 70 },
    { type: 'B-', level: 40 },
    { type: 'AB+', level: 90 },
    { type: 'AB-', level: 30 },
    { type: 'O+', level: 85 },
    { type: 'O-', level: 50 },
  ];

  return (
    <section className="blood-availability">
      <div className="container">
        <h2 className="text-center mb-5">Blood Availability</h2>
        <div className="row">
          {bloodTypes.map(({ type, level }) => (
            <div key={type} className="col-md-3 col-6 mb-4">
              <div 
                className="blood-type-indicator"
                style={{
                  background: `linear-gradient(to top, var(--primary-color) ${level}%, var(--light-bg) ${level}%)`
                }}
              >
                {type}
              </div>
              <p className="text-center mt-2">{level}% Available</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HeroSection = () => {
  const { t } = useLanguage();
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
  };

  return (
    <section className="hero-section">
      <Slider {...settings}>
        <div>
          <img className="carousel-image" src="./images/p0.png" alt="Slide 1" />
        </div>
        <div>
          <img className="carousel-image" src="./images/Ip1.jpg" alt="Slide 2" />
        </div>
        <div>
          <img className="carousel-image" src="./images/IP2.jpg" alt="Slide 3" />
        </div>
        <div>
          <img className="carousel-image" src="./images/IP7.jpg" alt="Slide 4" />
        </div>
        <div>
          <img className="carousel-image" src="./images/IP223.jpg" alt="Slide 5" />
        </div>
        <div>
          <img className="carousel-image" src="./images/IP1515.jpg" alt="Slide 6" />
        </div>
      </Slider>
      <div className="hero-text">
        <h1 className="fade-in">{t('welcome')}</h1>
        <p className="fade-in">{t('saveLifesDonating')}</p>
      </div>
    </section>
  );
};

const ServicesSection = () => {
  const { t } = useLanguage();
  return (
    <section className="services-section">
      <div className="container">
        <h2 className="text-center mb-5">{t('ourServices')}</h2>
        <div className="row">
          <div className="col-md-4">
            <div className="service-card fade-in">
              <div className="service-icon">
                <FaHeart />
              </div>
              <h3>{t('bloodDonation')}</h3>
              <p>{t('bloodDonationDesc')}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="service-card fade-in">
              <div className="service-icon">
                <FaUserNurse />
              </div>
              <h3>{t('bloodRequests')}</h3>
              <p>{t('bloodRequestsDesc')}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="service-card fade-in">
              <div className="service-icon">
                <FaStethoscope />
              </div>
              <h3>{t('healthChecks')}</h3>
              <p>{t('healthChecksDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CallToAction = ({ onWhereCanDonate, onForDonors }) => {
  const { t } = useLanguage();
  return (
    <section className="cta-section">
      <div className="container">
        <h2 className="fade-in">{t('becomeHero')}</h2>
        <p className="fade-in">{t('joinCommunity')}</p>
        <div className="cta-buttons">
          <button
            className="btn btn-primary fade-in"
            onClick={onWhereCanDonate}
          >
            {t('whereCanDonate')}
          </button>
          <button
            className="btn btn-primary fade-in"
            onClick={onForDonors}
          >
            {t('forDonors')}
          </button>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => {
  const { t } = useLanguage();
  return (
    <section className="testimonials-section">
      <div className="container">
        <h2 className="text-center mb-5">{t('testimonials')}</h2>
        <div className="row">
          <div className="col-md-4">
            <div className="testimonial-card fade-in">
              <p className="testimonial-text">
                "Donating blood was a rewarding experience. The staff was
                professional and caring."
              </p>
              <div className="testimonial-author">
                <img src="./images/avatar1.jpg" alt="Samrawit" className="author-image" />
                <div>
                  <h4>Samrawit Alebachew</h4>
                  <p>Regular Donor</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="testimonial-card fade-in">
              <p className="testimonial-text">
                "I received blood from this bank during my surgery. Grateful for
                the timely help."
              </p>
              <div className="testimonial-author">
                <img src="./images/avatar2.jpg" alt="Yonathan" className="author-image" />
                <div>
                  <h4>Yonathan Bedlu</h4>
                  <p>Blood Recipient</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="testimonial-card fade-in">
              <p className="testimonial-text">
                "Great experience! Will definitely donate again."
              </p>
              <div className="testimonial-author">
                <img src="./images/avatar3.jpg" alt="Kibrom" className="author-image" />
                <div>
                  <h4>Kibrom Alemayehu</h4>
                  <p>First-time Donor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactInfo = () => {
  const { t } = useLanguage();
  return (
    <section className="contact-info-section">
      <div className="container">
        <h2 className="text-center mb-5">{t('contactUs')}</h2>
        <p className="text-center mb-5">{t('contactDesc')}</p>
        <div className="row">
          <div className="col-md-4">
            <div className="contact-card fade-in">
              <div className="contact-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>{t('address')}</h3>
              <p>{t('addressValue')}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="contact-card fade-in">
              <div className="contact-icon">
                <FaEnvelope />
              </div>
              <h3>{t('email')}</h3>
              <p>nbb@bloodbank.com</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="contact-card fade-in">
              <div className="contact-icon">
                <FaPhone />
              </div>
              <h3>{t('phone')}</h3>
              <p>+251921279293</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const EmergencyButton = ({ onClick }) => (
  <button className="emergency-btn" onClick={onClick} title="Emergency Blood Request">
    <FaAmbulance size={24} />
  </button>
);

const EmergencyModal = ({ onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h2>Emergency Blood Request</h2>
      <p>For emergency blood requests, please contact:</p>
      <div className="emergency-contacts">
        <p><FaPhone /> Emergency Hotline: +251911223344</p>
        <p><FaAmbulance /> Ambulance Service: +251922334455</p>
      </div>
      <button className="btn btn-primary" onClick={onClose}>Close</button>
    </div>
  </div>
);

export default HomePage;
