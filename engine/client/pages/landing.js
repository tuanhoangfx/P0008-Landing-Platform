import { boot } from "../motion.js";

boot({
  extra({ gsap, reduced }) {
    if (reduced) return;

    // Hero window starts tilted back and lands flat as the page scrolls.
    const stage = document.querySelector("[data-hero-stage] .frame");
    if (stage) {
      gsap.fromTo(
        stage,
        { rotateX: 22, scale: 0.92, y: 40, opacity: 0 },
        { rotateX: 22, scale: 0.92, y: 0, opacity: 1, duration: 1.4, ease: "expo.out", delay: 0.5 },
      );
      gsap.to(stage, {
        rotateX: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: "[data-hero-stage]", start: "top 85%", end: "top 20%", scrub: 0.6 },
      });
    }

    // Pipeline wire draws itself, then the nodes light up in order.
    const path = document.querySelector(".flow__path");
    if (path) {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: "[data-flow]", start: "top 75%", end: "bottom 55%", scrub: 0.8 },
      });
    }
    gsap.from("[data-flow-node]", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.15,
      scrollTrigger: { trigger: "[data-flow]", start: "top 80%" },
    });
  },
});
