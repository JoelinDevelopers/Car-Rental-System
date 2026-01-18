import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCar,
  FaGasPump,
  FaArrowRight,
  FaTachometerAlt,
  FaUserFriends,
  FaShieldAlt,
} from "react-icons/fa";
import axios from "axios";
import { carPageStyles } from "../../assets/dummyStyles";

const Cars = () => {
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  // const base = "http://localhost:5000";
  const base = "https://aurumdrive-backend-gamma.vercel.app";
  const fallbackImage = `${base}/uploads/default-car.png`;

  useEffect(() => {
    fetchCars();
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
        }
      }
    };
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    setError("");
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axios.get(`${base}/api/cars`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      const json = res.data;
      setCars(Array.isArray(json.data) ? json.data : json.data ?? json);
    } catch (err) {
      const isCanceled =
        err?.code === "ERR_CANCELED" ||
        (axios.isCancel && axios.isCancel(err)) ||
        err?.name === "CanceledError";
      if (isCanceled) return;

      console.error("Failed to fetch cars:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load cars"
      );
    } finally {
      setLoading(false);
    }
  };

  const buildImageSrc = (image) => {
    if (!image) return "";
    if (Array.isArray(image)) image = image[0];
    if (typeof image !== "string") return "";

    const trimmed = image.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("/")) {
      return `${base}${trimmed}`;
    }
    return `${base}/uploads/${trimmed}`;
  };

  const handleImageError = (e) => {
    const img = e?.target;
    if (!img) return;
    // prevent infinite loop if fallback also fails
    img.onerror = null;
    img.src = fallbackImage;
    img.alt = img.alt || "Image not available";
    img.style.objectFit = img.style.objectFit || "cover";
  };

  // ✅ SIMPLIFIED: All cars are always available
  const renderAvailabilityBadge = () => {
    return (
      <span className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 font-semibold">
        Available
      </span>
    );
  };

  // ✅ SIMPLIFIED: No cars are disabled
  const isBookDisabled = (car) => {
    // Only check if car has explicit status that's not "available"
    if (car?.status && car.status !== "available") return true;
    return false;
  };

  const handleBook = (car, id) => {
    const disabled = isBookDisabled(car);
    if (disabled) return;
    navigate(`/cars/${id}`, { state: { car } });
  };

  return (
    <div className={carPageStyles.pageContainer}>
      {/* Main Content */}
      <div className={carPageStyles.contentContainer}>
        <div className={carPageStyles.headerContainer}>
          <div className={carPageStyles.headerDecoration}></div>
          <h1 className={carPageStyles.title}>Premium Car Collection</h1>
          <p className={carPageStyles.subtitle}>
            Discover our exclusive fleet of luxury vehicles. Each car is
            meticulously maintained and ready for your journey.
          </p>
        </div>

        {/* Grid */}
        <div className={carPageStyles.gridContainer}>
          {loading &&
            // show skeleton placeholders when loading
            Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className={carPageStyles.carCard}>
                <div className={carPageStyles.glowEffect}></div>
                <div className={carPageStyles.imageContainer}>
                  <div className="w-full h-full bg-gray-200 animate-pulse" />
                </div>
                <div className={carPageStyles.cardContent}>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-10 bg-gray-200 rounded mt-4 animate-pulse" />
                </div>
              </div>
            ))}

          {!loading && error && (
            <div className="col-span-full text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && cars.length === 0 && (
            <div className="col-span-full text-center">No cars available.</div>
          )}

          {!loading &&
            cars.map((car, idx) => {
              const id = car._id ?? car.id ?? idx;
              const carName =
                `${car.make || car.name || ""} ${car.model || ""}`.trim() ||
                car.name ||
                "Unnamed";
              const imageSrc = buildImageSrc(car.image) || fallbackImage;
              const disabled = isBookDisabled(car);

              return (
                <div key={id} className={carPageStyles.carCard}>
                  <div className={carPageStyles.glowEffect}></div>

                  <div className={carPageStyles.imageContainer}>
                    <div className="absolute inset-0 z-10" />
                    <img
                      src={imageSrc}
                      alt={carName}
                      onError={handleImageError}
                      className={carPageStyles.carImage}
                    />

                    {/* availability badge at top-right of card */}
                    <div className="absolute right-4 top-4 z-20">
                      {renderAvailabilityBadge()}
                    </div>

                    <div className={carPageStyles.priceBadge}>
                      Kes{car.dailyRate ?? car.price ?? car.pricePerDay ?? "—"}
                      /day
                    </div>
                  </div>

                  <div className={carPageStyles.cardContent}>
                    <div className={carPageStyles.headerRow}>
                      <div>
                        <h3 className={carPageStyles.carName}>{carName}</h3>
                        <p className={carPageStyles.carType}>
                          {car.category ?? car.type ?? "Sedan"}
                        </p>
                      </div>
                    </div>

                    <div className={carPageStyles.specsGrid}>
                      <div className={carPageStyles.specItem}>
                        <div className={carPageStyles.specIconContainer}>
                          <FaUserFriends className="text-sky-400" />
                        </div>
                        <span>{car.seats ?? "4"} Seats</span>
                      </div>

                      <div className={carPageStyles.specItem}>
                        <div className={carPageStyles.specIconContainer}>
                          <FaGasPump className="text-amber-400" />
                        </div>
                        <span>{car.fuelType ?? car.fuel ?? "Gasoline"}</span>
                      </div>

                      <div className={carPageStyles.specItem}>
                        <div className={carPageStyles.specIconContainer}>
                          <FaTachometerAlt className="text-emerald-400" />
                        </div>
                        <span>{car.mileage ? `${car.mileage} kmpl` : "—"}</span>
                      </div>

                      <div className={carPageStyles.specItem}>
                        <div className={carPageStyles.specIconContainer}>
                          <FaShieldAlt className="text-purple-400" />
                        </div>
                        <span>Premium</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBook(car, id)}
                      className={`${carPageStyles.bookButton} ${
                        disabled ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      aria-label={`Book ${carName}`}
                      title={
                        disabled
                          ? "This car is currently unavailable"
                          : `Book ${carName}`
                      }
                      disabled={disabled}
                    >
                      <span className={carPageStyles.buttonText}>
                        {disabled ? "Unavailable" : "Book Now"}
                      </span>
                      <FaArrowRight className={carPageStyles.buttonIcon} />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Floating decorative elements */}
        <div className={carPageStyles.decor1}></div>
        <div className={carPageStyles.decor2}></div>
      </div>
    </div>
  );
};

export default Cars;