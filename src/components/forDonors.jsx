import React from "react";
import { Link } from "react-router-dom";
import "../styles/forDonors.css";
import { useLanguage } from "../context/LanguageContext";

// DonorGuidelines Component
const DonorGuidelines = () => {
  const { t } = useLanguage();
  return (
    <div className="guidelines-container fade-in">
      <h3 className="guideline-title">{t('donorGuidelinesTitle')}</h3>
      <ul className="guideline-list">
        <li className="guideline-item">{t('goodHealth')}</li>
        <li className="guideline-item">{t('ageRequirement')}</li>
        <li className="guideline-item">{t('weightRequirement')}</li>
        <li className="guideline-item">{t('healthConditions')}</li>
        <li className="guideline-item">{t('healthyMeal')}</li>
        <li className="guideline-item">{t('drinkWater')}</li>
        <li className="guideline-item">{t('avoidAlcohol')}</li>
        <li className="guideline-item">{t('goodSleep')}</li>
      </ul>
    </div>
  );
};

// ForDonors Component
const ForDonors = () => {
  const { t } = useLanguage();
  return (
    <div className="for-donors-container fade-in">
      <h2 className="title">{t('infoForDonors')}</h2>
      <p className="paragraph">{t('donationProcess')}</p>
      
      <h3 className="subtitle">{t('stepsForDonating')}</h3>
      <ol className="list">
        <li className="list-item">{t('step1Register')}</li>
        <li className="list-item">{t('step2HealthCheck')}</li>
        <li className="list-item">{t('step3Donation')}</li>
        <li className="list-item">{t('step4Rest')}</li>
      </ol>

      <h3 className="subtitle">{t('thingsToRemember')}</h3>
      <ul className="list">
        <li className="list-item">{t('rememberWater')}</li>
        <li className="list-item">{t('rememberMeal')}</li>
        <li className="list-item">{t('avoidActivities')}</li>
      </ul>

      <h3 className="subtitle">{t('eligibilityTitle')}</h3>
      <p className="paragraph">{t('eligibilityDesc')}</p>
      <p className="paragraph">{t('moreInfo')}</p>

      {/* Integrate DonorGuidelines Component */}
      <DonorGuidelines />
    </div>
  );
};

export default ForDonors;
