import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { faqItems, toggleFaq } from "@/data/faq";
import "./faq.css";

export function Faq() {
  const [open, setOpen] = useState<string | null>(faqItems[0].id);
  const reduce = useMotionPreference();
  return <section className="home-faq" aria-labelledby="home-faq-title">
    <div className="container-site home-faq-grid">
      <div className="home-faq-intro"><Reveal>
        <p className="home-faq-eyebrow">Questions people ask</p>
        <h2 id="home-faq-title">Do AI ads actually work?</h2>
        <p className="home-faq-sub">Short answers. For anything else, ask us on a call.</p>
        <Button asChild variant="link" className="home-faq-call"><Link to="/book">Book a call</Link></Button>
      </Reveal></div>
      <div>{faqItems.map((item, index) => {
        const expanded = open === item.id;
        return <motion.div key={item.id} className="home-faq-item" initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : index * 0.06 }}>
          <h3><Button variant="ghost" className="home-faq-question" id={`faq-question-${item.id}`} aria-expanded={expanded} aria-controls={`faq-answer-${item.id}`} onClick={() => setOpen(current => toggleFaq(current, item.id))}>
            <span className="home-faq-question-text">{item.question}</span><span className="home-faq-plus" aria-hidden="true"><Plus /></span>
          </Button></h3>
          <AnimatePresence initial={false}>{expanded && <motion.div key="answer" className="home-faq-answer" id={`faq-answer-${item.id}`} role="region" aria-labelledby={`faq-question-${item.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.35 }}><p>{item.answer}</p></motion.div>}</AnimatePresence>
        </motion.div>;
      })}</div>
    </div>
  </section>;
}