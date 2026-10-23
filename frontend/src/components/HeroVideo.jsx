import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

export default function HeroVideo({ poster }) {
  const video = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  function failed() {
    setActive(false);
    setError('The video could not play. Please try again.');
  }
  useEffect(() => {
    if (active) video.current?.play().catch(failed);
  }, [active]);
  return <div className={`hero-image hero-video${active ? ' is-playing' : ''}`} role="group" aria-label="Explore the FORMA gym">
    {active ? <video ref={video} src="/assets/gym-video.mp4" poster={poster} controls playsInline preload="none" aria-label="FORMA gym tour" onError={failed} onEnded={() => setActive(false)}>
      Your browser does not support video playback.
    </video> : <>
      <img src={poster} fetchPriority="high" alt="Nigerian athlete training in a contemporary strength studio"/>
      <button className="hero-video-play" type="button" aria-label="Play gym video" onClick={() => { setError(''); setActive(true); }}><Play size={26} fill="currentColor" aria-hidden="true"/><span>Watch the gym</span></button>
      {!error && <div className="image-caption"><span>YOUR NEXT CHAPTER STARTS HERE</span></div>}
    </>}
    {error && <p className="hero-video-error" role="alert">{error}</p>}
  </div>;
}
