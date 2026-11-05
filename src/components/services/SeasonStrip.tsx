import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { season } from '@/content/season';
import './services.css';
export function SeasonStrip() {
  return <aside className="service-foundation service-season"><div className="container-site service-season-inner"><p>{season.text}</p><Button asChild className="service-action"><Link to="/book" search={{ service: season.service }}>{season.button}</Link></Button></div></aside>;
}
