// src/components/HeroSleek.jsx
import React, { useEffect, useRef, useState } from "react";
import img1 from "../../assets/hero.png";
import { heroStyles as styles } from "../../assets/dummyStyles";

export default function HeroSleek() {
  const wrapRef = useRef(null);
  const bgRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = (clientX - r.left) / r.width;
      const y = (clientY - r.top) / r.height;
      setMouse({ x, y });
      el.style.setProperty("--mx", `${x}`);
      el.style.setProperty("--my", `${y}`);
    }

    function onLeave() {
      setMouse({ x: 0.5, y: 0.5 });
      el.style.setProperty("--mx", `0.5`);
      el.style.setProperty("--my", `0.5`);
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchend", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchend", onLeave);
    };
  }, []);

  const maxTranslate = 14;
  const tx = (mouse.x - 0.5) * 2 * maxTranslate;
  const ty = (mouse.y - 0.5) * 2 * (maxTranslate * 0.55);

  return (
    <div className="">
       

        {/* Refined glass CTA card */}
        <div className={styles.ctaContainer}>
          <div className={styles.ctaCard}>
            <div>
              <p className={styles.subtitle}>THE BAZZAR</p>
              <h3 className={styles.title}>Next-gen fleet. Instant drive</h3>
              <p className={styles.description}>
                Rent your Dream Car. Transparent pricing. Book in seconds.
              </p>
            </div>

            <a href="/cars" className="flex items-center gap-3">
              <button className={styles.ctaButton}>
                <span className={styles.buttonText}>See Fleet</span>
              </button>
            </a>
            <span aria-hidden className={styles.outline}></span>
          </div>
        </div>
    
    
    </div>
  );
}