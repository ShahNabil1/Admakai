import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { aiOrShotAnswer, videos } from '@/content/videos';
import { VimeoPlayer } from './VimeoPlayer';
import { isReadyVideo, quizResult } from './video-rules';
import { ServiceHeadline, ServiceReveal } from './ServiceMotion';
export function AiOrShotQuiz() {
  const [guess, setGuess] = useState<'A' | 'B' | null>(null);
  const available = isReadyVideo(videos['aiOrShotA']) && isReadyVideo(videos['aiOrShotB']);
  return <section className="service-foundation service-section"><div className="container-site"><ServiceReveal>
    <h2 className="service-heading"><ServiceHeadline lines={['Shot on a camera, or made with AI?', 'You tell us.']} /></h2>
    <p className="service-copy mt-5">One of these two clips is real phone footage. The other was made with AI.</p>
    <div className="service-quiz-grid">{(['A', 'B'] as const).map(letter => <div key={letter}><p className="service-quiz-label">{letter}</p><VimeoPlayer videoKey={`aiOrShot${letter}`} mode="background" /></div>)}</div>
    <div className="service-actions">{(['A', 'B'] as const).map(letter => <Button key={letter} className="service-action" disabled={!available} aria-pressed={guess === letter} onClick={() => setGuess(letter)}>{letter} is AI</Button>)}</div>
    <div aria-live="polite">{guess && <div className="service-result"><p>{quizResult(guess, aiOrShotAnswer)}</p><Button asChild className="service-action mt-6"><Link to="/book">Find out on a free call</Link></Button></div>}</div>
  </ServiceReveal></div></section>;
}
