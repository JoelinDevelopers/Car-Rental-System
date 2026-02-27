import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    FaUserFriends,
    FaGasPump,
    FaTachometerAlt,
    FaCheckCircle,
    FaCalendarAlt,
    FaPhone,
    FaEnvelope,
    FaUser,
    FaArrowLeft,
    FaCreditCard,
    FaMapMarkerAlt,
    FaCity,
    FaGlobeAsia,
    FaMapPin,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import carsData from "../../assets/carsData";
import { carDetailStyles } from "../../assets/dummyStyles";
import { AddCarPageStyles } from "../../../../admin/src/assets/dummyStyles";

// const API_BASE = "http://localhost:5000";
const API_BASE = "https://aurumdrive-backend-gamma.vercel.app";
const api = axios.create({
    baseURL: API_BASE,
    headers: { Accept: "application/json" },
});

const todayISO = () => new Date().toISOString().split("T")[0];

const buildImageSrc = (image) => {
    if (!image) return `${API_BASE}/uploads/default-car.png`;
    if (Array.isArray(image)) image = image[0];
    if (!image || typeof image !== "string")
        return `${API_BASE}/uploads/default-car.png`;
    const t = image.trim();
    if (!t) return `${API_BASE}/uploads/default-car.png`;
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
    if (t.startsWith("/")) return `${API_BASE}${t}`;
    return `${API_BASE}/uploads/${t}`;
};

const handleImageError = (
    e,
    fallback = `${API_BASE}/uploads/default-car.png`
) => {
    const img = e?.target;
    if (!img) return;
    img.onerror = null;
    img.src = fallback;
    img.onerror = () => {
        img.onerror = null;
        img.src = "https://via.placeholder.com/800x500.png?text=No+Image";
    };
    img.alt = img.alt || "Image not available";
    img.style.objectFit = img.style.objectFit || "cover";
};

const calculateDays = (from, to) => {
    if (!from || !to) return 1;
    const days = Math.ceil(
        (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, days);
};

// ✅ Success Popup Component
const SuccessPopup = ({ visible }) => {
    if (!visible) return null;
    return (
        <>
            <style>{`
                @keyframes successFadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes successFadeOut {
                    from { opacity: 1; }
                    to   { opacity: 0; }
                }
                @keyframes checkPop {
                    0%   { transform: scale(0) rotate(-15deg); }
                    60%  { transform: scale(1.2) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes ringPulse {
                    0%   { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.7); opacity: 0; }
                }
                @keyframes barFill {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
                .success-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.65);
                    backdrop-filter: blur(4px);
                    z-index: 9998;
                }
                .success-card {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 9999;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    border: 1px solid rgba(251,146,60,0.3);
                    border-radius: 24px;
                    padding: 48px 40px 36px;
                    width: 360px;
                    max-width: 90vw;
                    text-align: center;
                    animation: successFadeIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(251,146,60,0.08);
                }
                .check-ring {
                    width: 88px;
                    height: 88px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f97316, #fb923c);
                    margin: 0 auto 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    animation: checkPop 0.5s 0.2s cubic-bezier(0.175,0.885,0.32,1.275) both;
                    box-shadow: 0 0 30px rgba(249,115,22,0.5);
                }
                .check-ring::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 3px solid rgba(249,115,22,0.6);
                    animation: ringPulse 1.2s 0.5s ease-out infinite;
                }
                .check-icon {
                    font-size: 38px;
                    color: #fff;
                }
                .success-title {
                    font-size: 22px;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 10px;
                    letter-spacing: -0.3px;
                }
                .success-message {
                    font-size: 14px;
                    color: rgba(255,255,255,0.65);
                    line-height: 1.6;
                    margin-bottom: 28px;
                }
                .success-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(249,115,22,0.12);
                    border: 1px solid rgba(249,115,22,0.3);
                    color: #fb923c;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 6px 14px;
                    border-radius: 20px;
                    margin-bottom: 24px;
                }
                .progress-bar-track {
                    width: 100%;
                    height: 3px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 4px;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #f97316, #fb923c);
                    border-radius: 2px;
                    animation: barFill 3s linear forwards;
                }
                .redirect-note {
                    font-size: 11px;
                    color: rgba(255,255,255,0.35);
                    margin-top: 10px;
                }
            `}</style>
            <div className="success-overlay" />
            <div className="success-card">
                <div className="check-ring">
                    <span className="check-icon">✓</span>
                </div>
                <div className="success-title">Booking Confirmed!</div>
                <div className="success-message">
                    Your reservation has been received successfully.<br />
                    Our team will get back to you shortly to confirm the details.
                </div>
                <div className="success-badge">
                    <span>📋</span> Booking Submitted
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" />
                </div>
                <div className="redirect-note">Redirecting to My Bookings…</div>
            </div>
        </>
    );
};

const CarDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [car, setCar] = useState(() => location.state?.car || null);
    const [loadingCar, setLoadingCar] = useState(false);
    const [carError, setCarError] = useState("");
    const [currentImage, setCurrentImage] = useState(0);
    const [formData, setFormData] = useState({
        pickupDate: "",
        returnDate: "",
        pickupLocation: "",
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        zipCode: "",
        idPassportImage: null,
        idPassportPreview: null,
        drivingLicenseImage: null,
        drivingLicensePreview: null,
    });
    const [activeField, setActiveField] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // ✅ NEW
    const fetchControllerRef = useRef(null);
    const submitControllerRef = useRef(null);
    const [today, setToday] = useState(todayISO());

    const handleImageChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            setFormData((prev) => ({
                ...prev,
                [`${type}Image`]: file,
                [`${type}Preview`]: evt.target.result,
            }));
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => setToday(todayISO()), []);

    useEffect(() => {
        if (car) {
            setCurrentImage(0);
            return;
        }

        const local = carsData.find((c) => String(c.id) === String(id));
        if (local) {
            setCar(local);
            setCurrentImage(0);
            return;
        }

        const controller = new AbortController();
        fetchControllerRef.current = controller;
        (async () => {
            setLoadingCar(true);
            setCarError("");
            try {
                const res = await api.get(`/api/cars/${id}`, {
                    signal: controller.signal,
                });
                const payload = res.data?.data ?? res.data ?? null;
                if (payload) setCar(payload);
                else setCarError("Car not found.");
            } catch (err) {
                const canceled =
                    err?.code === "ERR_CANCELED" ||
                    err?.name === "CanceledError" ||
                    err?.message === "canceled";
                if (!canceled) {
                    console.error("Failed to fetch car:", err);
                    setCarError(
                        err?.response?.data?.message || err.message || "Failed to load car"
                    );
                }
            } finally {
                setLoadingCar(false);
            }
        })();

        return () => {
            try {
                controller.abort();
            } catch { }
            fetchControllerRef.current = null;
        };
    }, [id]);

    if (!car && loadingCar)
        return <div className="p-6 text-white">Loading car...</div>;
    if (!car && carError)
        return <div className="p-6 text-red-400">{carError}</div>;
    if (!car) return <div className="p-6 text-white">Car not found.</div>;

    const carImages = [
        ...(Array.isArray(car.images) ? car.images : []),
        ...(car.image ? (Array.isArray(car.image) ? car.image : [car.image]) : []),
    ].filter(Boolean);

    const price = Number(car.price ?? car.dailyRate ?? 0) || 0;
    const days = calculateDays(formData.pickupDate, formData.returnDate);
    const calculateTotal = () => days * price;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isProcessing || submitting) {
            console.log('⚠️ Submission already in progress, ignoring...');
            return;
        }

        if (!formData.pickupDate || !formData.returnDate) {
            toast.error("Please select pickup and return dates.");
            return;
        }

        const pickupDateObj = new Date(formData.pickupDate);
        const returnDateObj = new Date(formData.returnDate);

        if (returnDateObj < pickupDateObj) {
            toast.error("Return date must be the same or after pickup date.");
            return;
        }

        const daysDiff = calculateDays(formData.pickupDate, formData.returnDate);
        if (daysDiff < 3) {
            toast.error("Minimum booking period is 3 days.");
            return;
        }

        if (!formData.idPassportImage) {
            toast.error("Please upload your ID/Passport");
            return;
        }
        if (!formData.drivingLicenseImage) {
            toast.error("Please upload your Driving License");
            return;
        }

        setSubmitting(true);
        setIsProcessing(true);

        if (submitControllerRef.current) {
            try {
                submitControllerRef.current.abort();
            } catch (err) { }
        }

        const controller = new AbortController();
        submitControllerRef.current = controller;

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = user?.id;
            const token = localStorage.getItem("token");

            const formDataToSend = new FormData();

            formDataToSend.append('userId', userId || '');
            formDataToSend.append('customer', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);

            // ✅ FIX: Resolve car ID — prefer _id (MongoDB ObjectId), fall back to id
            const carId = car._id?.toString?.() || car.id?.toString?.() || null;
            const carData = {
                id: carId,
                make: car.make || '',
                model: car.model || '',
                year: car.year || null,
                dailyRate: price,
                seats: car.seats || 4,
                transmission: car.transmission || '',
                fuelType: car.fuelType || car.fuel || '',
                mileage: car.mileage || 0,
                image: car.image || ''
            };
            formDataToSend.append('car', JSON.stringify(carData));

            formDataToSend.append('pickupDate', formData.pickupDate);
            formDataToSend.append('returnDate', formData.returnDate);
            formDataToSend.append('amount', calculateTotal().toString());

            const details = { pickupLocation: formData.pickupLocation };
            formDataToSend.append('details', JSON.stringify(details));

            const address = {
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
            };
            formDataToSend.append('address', JSON.stringify(address));

            const carImageUrl = car.image
                ? buildImageSrc(Array.isArray(car.image) ? car.image[0] : car.image)
                : '';
            formDataToSend.append('carImage', carImageUrl);

            formDataToSend.append('idPhoto', formData.idPassportImage);
            formDataToSend.append('licensePhoto', formData.drivingLicenseImage);

            const headers = { 'Content-Type': 'multipart/form-data' };
            if (token) headers.Authorization = `Bearer ${token}`;

            await api.post('/api/bookings', formDataToSend, {
                headers,
                signal: controller.signal,
            });

            // ✅ SHOW SUCCESS POPUP & REDIRECT AFTER 3s
            setShowSuccessPopup(true);

            setFormData({
                pickupDate: "",
                returnDate: "",
                pickupLocation: "",
                name: "",
                email: "",
                phone: "",
                city: "",
                state: "",
                zipCode: "",
                idPassportImage: null,
                idPassportPreview: null,
                drivingLicenseImage: null,
                drivingLicensePreview: null,
            });

            setTimeout(() => {
                setShowSuccessPopup(false);
                navigate("/bookings");
            }, 3200);

        } catch (err) {
            const canceled =
                err?.code === "ERR_CANCELED" ||
                err?.name === "CanceledError" ||
                err?.message === "canceled";
            if (canceled) return;

            console.error("Booking error:", err);
            console.error("🔴 SERVER RESPONSE DATA:", JSON.stringify(err?.response?.data, null, 2));
            console.error("🔴 STATUS:", err?.response?.status);
            console.error("🔴 BODY SENT:", {
                customer: formData.name,
                email: formData.email,
                phone: formData.phone,
                carId: car._id?.toString?.() || car.id?.toString?.() || "NO ID FOUND",
                pickupDate: formData.pickupDate,
                returnDate: formData.returnDate,
                userId: JSON.parse(localStorage.getItem("user") || "{}")?.id || "NO USER",
            });
            const serverMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err.message ||
                "Booking failed";
            toast.error(String(serverMessage));
        } finally {
            setSubmitting(false);
            setIsProcessing(false);
            submitControllerRef.current = null;
        }
    };

    const transmissionLabel = car.transmission
        ? String(car.transmission).toLowerCase()
        : "standard";

    return (
        <div className={carDetailStyles.pageContainer}>
            {/* ✅ SUCCESS POPUP */}
            <SuccessPopup visible={showSuccessPopup} />

            <div className={carDetailStyles.contentContainer}>
                <ToastContainer />
                <button
                    onClick={() => navigate(-1)}
                    className={carDetailStyles.backButton}
                >
                    <FaArrowLeft className={carDetailStyles.backButtonIcon} />
                </button>

                <div className={carDetailStyles.mainLayout}>
                    <div className={carDetailStyles.leftColumn}>
                        <div className={carDetailStyles.imageCarousel}>
                            <img
                                src={buildImageSrc(carImages[currentImage] ?? car.image)}
                                alt={car.name}
                                className={carDetailStyles.carImage}
                                onError={(e) => handleImageError(e)}
                            />
                            {(carImages.length > 0 || (car.image && car.image !== "")) && (
                                <div className={carDetailStyles.carouselIndicators}>
                                    {(carImages.length > 0 ? carImages : [car.image]).map(
                                        (_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImage(idx)}
                                                aria-label={`Show image ${idx + 1}`}
                                                className={carDetailStyles.carouselIndicator(
                                                    idx === currentImage
                                                )}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        <h1 className={carDetailStyles.carName}>{car.make}</h1>
                        <p className={carDetailStyles.carPrice}>
                            Kes{price}{" "}
                            <span className={carDetailStyles.pricePerDay}>/ day</span>
                        </p>

                        <div className={carDetailStyles.specsGrid}>
                            {[
                                {
                                    Icon: FaUserFriends,
                                    label: "Seats",
                                    value: car.seats ?? "—",
                                    color: "text-orange-400",
                                },
                                {
                                    Icon: FaGasPump,
                                    label: "Fuel",
                                    value: car.fuel ?? car.fuelType ?? "—",
                                    color: "text-green-400",
                                },
                                {
                                    Icon: FaTachometerAlt,
                                    label: "Mileage",
                                    value: car.mileage ? `${car.mileage} kmpl` : "—",
                                    color: "text-yellow-400",
                                },
                                {
                                    Icon: FaCheckCircle,
                                    label: "Transmission",
                                    value: transmissionLabel,
                                    color: "text-purple-400",
                                },
                            ].map((spec, i) => (
                                <div key={i} className={carDetailStyles.specCard}>
                                    <spec.Icon
                                        className={`${spec.color} ${carDetailStyles.specIcon}`}
                                    />
                                    <p
                                        className={
                                            carDetailStyles.aboutText +
                                            " " +
                                            carDetailStyles.specLabel
                                        }
                                    >
                                        {spec.label}
                                    </p>
                                    <p className={carDetailStyles.specValue}>{spec.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className={carDetailStyles.aboutSection}>
                            <h2 className={carDetailStyles.aboutTitle}>About this car</h2>
                            <p className={carDetailStyles.aboutText}>
                                Experience luxury in the {car.name}. With its{" "}
                                {transmissionLabel} transmission and seating for{" "}
                                {car.seats ?? "—"}, every journey is exceptional.
                            </p>
                            <p className={carDetailStyles.aboutText}>
                                {car.description ??
                                    "This car combines performance and comfort for an unforgettable drive."}
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="flex items-center">
                                    <FaCheckCircle className="text-green-400 mr-2 text-sm" />
                                    <span className="text-gray-300 text-sm">Free cancellation</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="text-green-400 mr-2 text-sm" />
                                    <span className="text-gray-300 text-sm">24/7 Roadside assistance</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="text-green-400 mr-2 text-sm" />
                                    <span className="text-gray-300 text-sm">Unlimited mileage</span>
                                </div>
                                <div className="flex items-center">
                                    <FaCheckCircle className="text-green-400 mr-2 text-sm" />
                                    <span className="text-gray-300 text-sm">Collision damage waiver</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={carDetailStyles.rightColumn}>
                        <div className={carDetailStyles.bookingCard}>
                            <h2 className={carDetailStyles.bookingTitle}>
                                Reserve{" "}
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 to-orange-500">
                                    Your Drive
                                </span>
                            </h2>
                            <p className={carDetailStyles.bookingSubtitle}>
                                Fast · Secure · Easy · Minimum 3 Days
                            </p>

                            <form onSubmit={handleSubmit} className={carDetailStyles.form}>
                                <div className={carDetailStyles.grid2}>
                                    <div className="flex flex-col">
                                        <label
                                            htmlFor="pickupDate"
                                            className={carDetailStyles.formLabel}
                                        >
                                            Pickup Date
                                        </label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "pickupDate"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaCalendarAlt />
                                            </div>
                                            <input
                                                id="pickupDate"
                                                type="date"
                                                name="pickupDate"
                                                min={today}
                                                value={formData.pickupDate}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("pickupDate")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.inputField}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label
                                            htmlFor="returnDate"
                                            className={carDetailStyles.formLabel}
                                        >
                                            Return Date
                                        </label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "returnDate"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaCalendarAlt />
                                            </div>
                                            <input
                                                id="returnDate"
                                                type="date"
                                                name="returnDate"
                                                min={formData.pickupDate || today}
                                                value={formData.returnDate}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("returnDate")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.inputField}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {formData.pickupDate && formData.returnDate && days < 3 && (
                                    <div className="text-yellow-400 text-sm mt-2 px-3 py-2 bg-yellow-900/20 rounded-lg border border-yellow-400/30">
                                        ⚠️ Minimum booking period is 3 days. Currently selected: {days} day{days !== 1 ? 's' : ''}
                                    </div>
                                )}

                                <div className="flex flex-col">
                                    <label className={carDetailStyles.formLabel}>
                                        Pickup Location
                                    </label>
                                    <div
                                        className={carDetailStyles.inputContainer(
                                            activeField === "pickupLocation"
                                        )}
                                    >
                                        <div className={carDetailStyles.inputIcon}>
                                            <FaMapMarkerAlt />
                                        </div>
                                        <input
                                            type="text"
                                            name="pickupLocation"
                                            placeholder="Enter pickup location"
                                            value={formData.pickupLocation}
                                            onChange={handleInputChange}
                                            onFocus={() => setActiveField("pickupLocation")}
                                            onBlur={() => setActiveField(null)}
                                            required
                                            className={carDetailStyles.textInputField}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className={carDetailStyles.formLabel}>Full Name</label>
                                    <div
                                        className={carDetailStyles.inputContainer(
                                            activeField === "name"
                                        )}
                                    >
                                        <div className={carDetailStyles.inputIcon}>
                                            <FaUser />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Your full name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onFocus={() => setActiveField("name")}
                                            onBlur={() => setActiveField(null)}
                                            required
                                            className={carDetailStyles.textInputField}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className={carDetailStyles.formLabel}>
                                            Email Address
                                        </label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "email"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaEnvelope />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Your email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("email")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.textInputField}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className={carDetailStyles.formLabel}>
                                            Phone Number
                                        </label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "phone"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaPhone />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Your phone number"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("phone")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.textInputField}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col">
                                        <label className={carDetailStyles.formLabel}>City</label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "city"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaCity />
                                            </div>
                                            <input
                                                type="text"
                                                name="city"
                                                placeholder="Your city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("city")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.textInputField}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className={carDetailStyles.formLabel}>State</label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "state"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaGlobeAsia />
                                            </div>
                                            <input
                                                type="text"
                                                name="state"
                                                placeholder="Your State"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("state")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.textInputField}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className={carDetailStyles.formLabel}>
                                            ZIP Code
                                        </label>
                                        <div
                                            className={carDetailStyles.inputContainer(
                                                activeField === "zipCode"
                                            )}
                                        >
                                            <div className={carDetailStyles.inputIcon}>
                                                <FaMapPin />
                                            </div>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                placeholder="ZIP/Postal code"
                                                value={formData.zipCode}
                                                onChange={handleInputChange}
                                                onFocus={() => setActiveField("zipCode")}
                                                onBlur={() => setActiveField(null)}
                                                required
                                                className={carDetailStyles.textInputField}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className={AddCarPageStyles.label}>
                                            ID/Passport <span className="text-red-500">*</span>
                                        </label>
                                        <div className={AddCarPageStyles.imageUploadContainer}>
                                            <label className={AddCarPageStyles.imageUploadLabel}>
                                                {formData.idPassportPreview ? (
                                                    <div className="w-full h-full rounded-xl overflow-hidden">
                                                        <img
                                                            src={formData.idPassportPreview}
                                                            alt="ID Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={AddCarPageStyles.imageUploadPlaceholder}>
                                                        <svg
                                                            className={AddCarPageStyles.iconUpload}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        <p className={AddCarPageStyles.imageUploadText}>
                                                            <span className={AddCarPageStyles.imageUploadTextSemibold}>
                                                                Click to upload
                                                            </span>
                                                            <br />
                                                            or drag and drop
                                                        </p>
                                                        <p className={AddCarPageStyles.imageUploadSubText}>
                                                            PNG, JPG up to 5MB
                                                        </p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    name="idPassport"
                                                    onChange={(e) => handleImageChange(e, "idPassport")}
                                                    className="hidden"
                                                    accept="image/*"
                                                    required
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className={AddCarPageStyles.label}>
                                            Driving License <span className="text-red-500">*</span>
                                        </label>
                                        <div className={AddCarPageStyles.imageUploadContainer}>
                                            <label className={AddCarPageStyles.imageUploadLabel}>
                                                {formData.drivingLicensePreview ? (
                                                    <div className="w-full h-full rounded-xl overflow-hidden">
                                                        <img
                                                            src={formData.drivingLicensePreview}
                                                            alt="License Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={AddCarPageStyles.imageUploadPlaceholder}>
                                                        <svg
                                                            className={AddCarPageStyles.iconUpload}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        <p className={AddCarPageStyles.imageUploadText}>
                                                            <span className={AddCarPageStyles.imageUploadTextSemibold}>
                                                                Click to upload
                                                            </span>
                                                            <br />
                                                            or drag and drop
                                                        </p>
                                                        <p className={AddCarPageStyles.imageUploadSubText}>
                                                            PNG, JPG up to 5MB
                                                        </p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    name="drivingLicense"
                                                    onChange={(e) => handleImageChange(e, "drivingLicense")}
                                                    className="hidden"
                                                    accept="image/*"
                                                    required
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className={carDetailStyles.priceBreakdown}>
                                    <div className={carDetailStyles.priceRow}>
                                        <span>Rate/day</span>
                                        <span>Kes{price}</span>
                                    </div>
                                    {formData.pickupDate && formData.returnDate && (
                                        <div className={carDetailStyles.priceRow}>
                                            <span>Days</span>
                                            <span>{days}</span>
                                        </div>
                                    )}
                                    <div className={carDetailStyles.totalRow}>
                                        <span>Total</span>
                                        <span>Kes{calculateTotal()}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || isProcessing || (formData.pickupDate && formData.returnDate && days < 3)}
                                    className={carDetailStyles.submitButton}
                                    style={{
                                        opacity: (submitting || isProcessing || (formData.pickupDate && formData.returnDate && days < 3)) ? 0.5 : 1,
                                        cursor: (submitting || isProcessing || (formData.pickupDate && formData.returnDate && days < 3)) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <FaCreditCard className="mr-2 group-hover:scale-110 transition-transform" />
                                    <span>
                                        {submitting ? "Processing..." : "Confirm Booking"}
                                    </span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CarDetail;