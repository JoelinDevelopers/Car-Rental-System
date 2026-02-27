import React, { useState } from 'react';
import { contactPageStyles as styles } from '../../assets/dummyStyles';
import { FaCalendarAlt, FaCar, FaClock, FaComment, FaEnvelope, FaMapMarkedAlt, FaPhone, FaUser, FaWhatsapp } from 'react-icons/fa';
import { IoIosSend } from "react-icons/io";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    carType: "",
    message: "",
  });
  const [activeField, setActiveField] = useState(null);

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFocus = (field) => setActiveField(field);
  const handleBlur = () => setActiveField(null);

  // OPEN WHATSAPP CHAT  ✅ CHANGED MESSAGE
  const openWhatsApp = (phone) => {
    if (!phone) return;

    const message = `Hello AurumDrive 👋
I’m interested in booking one of your available cars. Could you please share the available models, pricing, and the requirements needed to proceed with the reservation? Thank you.`;

    const whatsappMessage = encodeURIComponent(message);

    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${whatsappMessage}`, '_blank');
  };

  // OPEN EMAIL CLIENT
  const openEmail = (email, name, car) => {
    if (!email) return;
    const subject = encodeURIComponent("AurumDrive Booking Inquiry");
    const body = encodeURIComponent(
      `Hello ${name || ""},\n\nRegarding your booking for ${car || "your car"}.\n\nBest regards,\nAurumDrive`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // WHATSAPP FORM SUBMIT  ✅ SAME MESSAGE
  const handleSubmit = (e) => {
    e.preventDefault();

    const message = `Hello AurumDrive 👋
I’m interested in booking one of your available cars. Could you please share the available models, pricing, and the requirements needed to proceed with the reservation? Thank you.`;

    const whatsappMessage = encodeURIComponent(message);

    window.open(`https://wa.me/254111260565?text=${whatsappMessage}`, '_blank');

    setFormData({ name: '', email: '', phone: '', carType: '', message: '' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.diamondPattern}>
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(30deg, rgba(249,115,22,0.08) 12%, transparent 12.5%, transparent 87%, rgba(249,115,22,0.08) 87.5%, rgba(249,115,22,0.08)),
            linear-gradient(150deg, rgba(249,115,22,0.08) 12%, transparent 12.5%, transparent 87%, rgba(249,115,22,0.08) 87.5%, rgba(249,115,22,0.08)),
            linear-gradient(30deg, rgba(249,115,22,0.08) 12%, transparent 12.5%, transparent 87%, rgba(249,115,22,0.08) 87.5%, rgba(249,115,22,0.08)),
            linear-gradient(150deg, rgba(249,115,22,0.08) 12%, transparent 12.5%, transparent 87%, rgba(249,115,22,0.08) 87.5%, rgba(249,115,22,0.08)),
            linear-gradient(60deg, rgba(234,88,12,0.08) 25%, transparent 25.5%, transparent 75%, rgba(234,88,12,0.08) 75%, rgba(234,88,12,0.08)),
            linear-gradient(60deg, rgba(234,88,12,0.08) 25%, transparent 25.5%, transparent 75%, rgba(234,88,12,0.08) 75%, rgba(234,88,12,0.08))`,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
        }}></div>
      </div>

      <div className={styles.floatingTriangles}>
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className={styles.triangle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              background: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#fb923c' : '#fdba74',
              transform: `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.5})`
            }}
          ></div>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Contact Our Team</h1>
          <div className={styles.divider} />
          <p className={styles.subtitle}>
            Have questions about our premium fleet? 
            Our team is ready to assist with your car rental needs.
          </p>
        </div>

        <div className={styles.cardContainer}>
          <div className={styles.infoCard}>
            <div className={styles.infoCardCircle1}></div>
            <div className={styles.infoCardCircle2}></div>

            <div className="relative z-10 space-y-5">
              <h2 className={styles.infoTitle}>
                <FaMapMarkedAlt className={styles.infoIcon} /> Our Information
              </h2>

              <div className={styles.infoItemContainer}>
                {
                  [
                    { icon: FaWhatsapp, label: 'WhatsApp', value: '+254 111 260565', color: 'bg-green-900/30' },
                    { icon: FaEnvelope, label: 'Email', value: 'aurumdrivelogistics@gmail.com', color: 'bg-orange-900/30' },
                    { icon: FaClock, label: 'Hours', value: 'Mon-Sat: 8AM-8PM', color: 'bg-orange-900/30' },
                  ].map((info, i) => (
                    <div key={i} className={styles.infoItem}>
                      <div className={styles.iconContainer(info.color)}>
                        <info.icon
                         className={
                          i === 0
                            ? "text-green-400 text-lg"
                            : "text-orange-400 text-lg"
                         }
                        />
                      </div>

                      <div>
                        <h3 className={styles.infoLabel}>{info.label}</h3>
                        <p className={styles.infoValue}>
                          {i === 0 ? (
                            <button
                              onClick={() => openWhatsApp(info.value)}
                              className="text-green-400 hover:underline"
                            >
                              {info.value}
                            </button>
                          ) : i === 1 ? (
                            <button
                              onClick={() => openEmail(info.value, "Customer", "selected car")}
                              className="text-orange-400 hover:underline"
                            >
                              {info.value}
                            </button>
                          ) : (
                            <>
                              {info.value}
                              <span className="block text-gray-500">Sunday: 10AM-6PM</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* FORM (unchanged UI) */}
          <div className={styles.formCard}>
            <div className={styles.formCircle1}></div>
            <div className={styles.formCircle2}></div>

            <div className="mb-4">
              <h2 className={styles.formTitle}>
                <IoIosSend className={styles.infoIcon}/> Send Your Inquiry
              </h2>
              <p className={styles.formSubtitle}>
                Fill out the form and we'll get back to you promptly
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* the rest of your JSX remains EXACTLY the same */}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact;