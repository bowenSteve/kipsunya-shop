import React from 'react';
import { Link } from 'react-router-dom';
import { FiTarget, FiEye } from 'react-icons/fi';
import { IoDiamondOutline } from 'react-icons/io5';
import { FaHandshake, FaRocket, FaGlobeAfrica, FaUserTie, FaLaptopCode, FaCogs, FaUserShield } from 'react-icons/fa';
import '../styles/About.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function About() {
    return (
        <div className="about-page">
            <Navbar />

            {/* Hero Section */}
            <section className="about-hero">
                <div className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">About Kipsunya</h1>
                        <p className="hero-subtitle">
                            Your trusted partner in quality products and exceptional service
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">10K+</span>
                                <span className="stat-label">Happy Customers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">5+</span>
                                <span className="stat-label">Years Experience</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">500+</span>
                                <span className="stat-label">Products</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="our-story">
                <div className="container">
                    <div className="story-content">
                        <div className="story-text">
                            <h2 className="section-title">Our Story</h2>
                            <p className="story-description">
                                Founded in 2019, Kipsunya began as a vision to bridge the gap between 
                                quality products and accessible pricing. What started as a small venture 
                                has grown into a trusted name in e-commerce, serving thousands of 
                                satisfied customers worldwide.
                            </p>
                            <p className="story-description">
                                Our journey has been marked by continuous innovation, unwavering 
                                commitment to quality, and a deep understanding of our customers' needs. 
                                We believe that everyone deserves access to premium products without 
                                compromising on value or service.
                            </p>
                            <div className="story-highlights">
                                <div className="highlight-item">
                                    <span className="highlight-icon"><FiTarget /></span>
                                    <div className="highlight-content">
                                        <h4>Our Mission</h4>
                                        <p>To provide exceptional products and services that enhance our customers' lives</p>
                                    </div>
                                </div>
                                <div className="highlight-item">
                                    <span className="highlight-icon"><FiEye /></span>
                                    <div className="highlight-content">
                                        <h4>Our Vision</h4>
                                        <p>To become the leading e-commerce platform known for quality and innovation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="story-image">
                            <div className="image-placeholder">
                                <span className="placeholder-text">Our Journey</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="values-section">
                <div className="container">
                    <h2 className="section-title centered">Our Core Values</h2>
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon"><IoDiamondOutline /></div>
                            <h3 className="value-title">Quality First</h3>
                            <p className="value-description">
                                We never compromise on quality. Every product is carefully selected
                                and tested to meet our high standards.
                            </p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon"><FaHandshake /></div>
                            <h3 className="value-title">Customer Trust</h3>
                            <p className="value-description">
                                Building lasting relationships with our customers through transparency,
                                reliability, and exceptional service.
                            </p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon"><FaRocket /></div>
                            <h3 className="value-title">Innovation</h3>
                            <p className="value-description">
                                Continuously evolving and adopting new technologies to provide
                                better shopping experiences.
                            </p>
                        </div>
                        <div className="value-card">
                            <div className="value-icon"><FaGlobeAfrica /></div>
                            <h3 className="value-title">Sustainability</h3>
                            <p className="value-description">
                                Committed to responsible business practices and environmental
                                stewardship in all our operations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="container">
                    <h2 className="section-title centered">Meet Our Team</h2>
                    <p className="team-description">
                        The passionate individuals behind Kipsunya's success
                    </p>
                    <div className="team-grid">
                        <div className="team-member">
                            <div className="member-photo">
                                <div className="photo-placeholder"><FaUserTie /></div>
                            </div>
                            <h4 className="member-name">David Kipkemboi</h4>
                            <p className="member-role">CEO & Founder</p>
                            <p className="member-bio">
                                Visionary leader with 10+ years in e-commerce and business development.
                            </p>
                        </div>
                        <div className="team-member">
                            <div className="member-photo">
                                <div className="photo-placeholder"><FaLaptopCode /></div>
                            </div>
                            <h4 className="member-name">Sarah Chepkemoi</h4>
                            <p className="member-role">CTO</p>
                            <p className="member-bio">
                                Technology expert passionate about creating seamless digital experiences.
                            </p>
                        </div>
                        <div className="team-member">
                            <div className="member-photo">
                                <div className="photo-placeholder"><FaCogs /></div>
                            </div>
                            <h4 className="member-name">Michael Rotich</h4>
                            <p className="member-role">Head of Operations</p>
                            <p className="member-bio">
                                Operations specialist ensuring smooth delivery and customer satisfaction.
                            </p>
                        </div>
                        <div className="team-member">
                            <div className="member-photo">
                                <div className="photo-placeholder"><FaUserShield /></div>
                            </div>
                            <h4 className="member-name">Grace Wanjiku</h4>
                            <p className="member-role">Customer Success Manager</p>
                            <p className="member-bio">
                                Dedicated to ensuring every customer has an exceptional experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact CTA Section */}
            <section className="contact-cta">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Experience Excellence?</h2>
                        <p className="cta-description">
                            Join thousands of satisfied customers and discover what makes Kipsunya special.
                        </p>
                        <div className="cta-buttons">
                            <Link to="/products" className="cta-button primary">
                                Shop Now
                            </Link>
                            <Link to="/contact" className="cta-button secondary">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default About;