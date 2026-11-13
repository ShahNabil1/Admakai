import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { gsap, registerGsap } from "@/lib/gsap";
import ethicsImage from "@/assets/about/ethics.jpg";
import "./ethics.css";

const points = [
  { title: "Licensed and legal", text: "Every model, voice and music track we use is under a commercial licence. Your ad is yours to run anywhere." },
  { title: "You choose the format", text: "Director cut, hybrid or full AI speed. You decide how much AI goes into each piece, and we never switch it without telling you." },
  { title: "Disclosed on delivery", text: "Each delivery comes with a one page report that says what was generated, what was shot or hand made, and which models were used. You keep full control of the files." },
];

export function Ethics() {
  const reduce = useMotionPreference();
  const section = useRef<HTMLElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !section.current || !image.current) return;
    registerGsap();
    const context = gsap.context(() => {
      gsap.fromTo(image.current, { y: -15 }, { y: 15, ease: "none", scrollTrigger: { trigger: section.current, start: "top bottom", end: "bottom top", scrub: true } });
    }, section.current);
    return () => context.revert();
  }, [reduce]);

  return (
    <section ref={section} className="ethics" aria-labelledby="ethics-title">
      <div className="container-site">
        <motion.div className="ethics-panel" initial={reduce ? false : "hidden"} animate={reduce ? "visible" : false} whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="ethics-media">
            <motion.div className="ethics-image" variants={{ hidden: { clipPath: "inset(0 100% 0 0)" }, visible: { clipPath: "inset(0 0% 0 0)" } }} transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}>
              <img ref={image} src={ethicsImage} alt="A smiling man seated in an armchair beside a palm in a colourful studio" loading="lazy" width="1152" height="768" />
            </motion.div>
            <span className="ethics-caption">Made with AI, finished by people</span>
          </div>
          <div className="ethics-content">
            <p className="ethics-eyebrow">Honest by default</p>
            <h2 id="ethics-title">We tell you where the AI is.</h2>
            <ol className="ethics-points">
              {points.map((point, index) => (
                <motion.li key={point.title} className="ethics-point" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : index * 0.12 }}>
                  <span className="ethics-number" aria-hidden="true">
                    <svg viewBox="0 0 36 36"><motion.circle cx="18" cy="18" r="17.5" variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }} transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : index * 0.12 }} /></svg>
                    {index + 1}
                  </span>
                  <div><h3>{point.title}</h3><p>{point.text}</p></div>
                </motion.li>
              ))}
            </ol>
            <Button asChild variant="link" className="ethics-policy"><Link to="/about" hash="ai-policy">Read our AI policy <ArrowUpRight aria-hidden="true" /></Link></Button>
          </div>
        </motion.div>
        <p className="sr-only">Admakai discloses AI use in every ad and uses only commercially licensed models, voices and music.</p>
      </div>
    </section>
  );
}