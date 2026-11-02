import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Dumbbell,
  Zap,
  Target,
  Activity,
  Heart,
} from 'lucide-react';
import HeroVideo from './HeroVideo.jsx';

export default function HomePage({
  heading,
  memberships,
  equipmentCards,
  button,
  go,
  submit,
  busy,
  imageSrc,
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow badge">
            <span /> TRAIN WITH PURPOSE
          </span>
          <h1>
            Built for your
            <br />
            next level<span>.</span>
          </h1>
          <p>
            Expert coaching. Exceptional spaces. A connected fitness experience
            designed around you.
          </p>
          <div className="hero-buttons">
            {button('Explore memberships', () => go('Membership'))}
            {button('Explore the gym', () => go('Equipment'), true)}
          </div>
          <span className="fine">One membership. Every way to move.</span>
        </div>
        <HeroVideo poster={imageSrc('hero')} />
      </section>
      <div className="stats grid four">
        {[
          ['2,500+', 'Members'],
          ['20+', 'Expert coaches'],
          ['12', 'Years of experience'],
          ['40+', 'Weekly classes'],
        ].map(([n, t]) => (
          <div className="card" key={t}>
            <strong>{n}</strong>
            <span>{t}</span>
          </div>
        ))}
      </div>
      <section>
        {heading(
          'A MEMBERSHIP THAT MOVES WITH YOU',
          'Your ambition. Your membership.',
          'Flexible plans for every stage of your fitness journey.',
        )}
        {memberships()}
      </section>
      <section>
        {heading('FIND YOUR MOVEMENT', 'Everything you need to move forward.')}
        <div className="grid three">
          {[
            [
              'Strength training',
              Dumbbell,
              'Build strength with focused resistance sessions, sound technique and steady progress at your own pace.',
            ],
            [
              'Cardio and conditioning',
              Zap,
              'Improve stamina and everyday fitness with energising sessions that keep your heart and body moving.',
            ],
            [
              'Nutrition coaching',
              Target,
              'Explore practical food choices and balanced meal ideas that support your training and everyday routine.',
            ],
            [
              'Personal training',
              ArrowUpRight,
              'Find direction with a coach who helps you refine your technique and work towards your individual goals.',
            ],
            [
              'Yoga and mobility',
              Activity,
              'Move more freely with stretches, controlled movement and mindful breathing for flexibility and balance.',
            ],
            [
              'Recovery and wellbeing',
              Heart,
              'Make recovery part of your routine with gentler movement and time to recharge between demanding sessions.',
            ],
          ].map(([title, Icon, description]) => (
            <button
              className="card feature"
              key={title}
              onClick={() =>
                go(title.includes('Nutrition') ? 'Nutrition' : 'Workouts')
              }
            >
              <Icon size={23} />
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowUpRight className="feature-arrow" size={18} />
            </button>
          ))}
        </div>
      </section>
      <section>
        {heading(
          'MORE THAN A GYM',
          'Elevated spaces. Personal attention.',
          'A place to train well, recover fully and keep moving forward.',
        )}
        <div className="grid three">
          {[
            [
              'Professional coaching',
              'Get clear instruction and useful feedback from coaches who help you train with confidence, session after session.',
            ],
            [
              'Premium equipment',
              'Build variety into your workouts with dedicated strength, cardio and functional training equipment.',
            ],
            [
              'A connected community',
              "Meet people who share your commitment, enjoy group sessions and celebrate each other's progress along the way.",
            ],
          ].map(([title, description]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        {heading('THE FORMA COMMUNITY', 'Stronger, together.')}
        <div className="card testimonial">
          <span className="stars">?????</span>
          <blockquote>
            ·For the first time, my training feels like it was designed for me.
            The coaches keep me focused and the community keeps me coming back.·
          </blockquote>
          <p>Alex M. · Premium member</p>
          <span className="tag">Real people. Real progress.</span>
        </div>
      </section>
      <section>
        {heading('THE TOOLS TO GO FURTHER', 'Made for performance.')}
        {equipmentCards()}
        <div className="section-link">
          {button('Explore equipment', () => go('Equipment'), true)}
        </div>
      </section>

      <section className="app-section">
        <div>
          {heading(
            'TAKE FORMA WITH YOU',
            'Your fitness. In your pocket.',
            'Book classes, follow workouts and keep your progress close.',
          )}
          <h3>A daily rhythm that moves with you.</h3>
          <p>
            ? Book on the go
            <br />? Track your progress
            <br />? Discover your next workout
          </p>
          {button('Open your dashboard', () => go('Dashboard'))}
        </div>
        <div className="phone card">
          <span className="logo">
            <img src="/assets/forma-logo-transparent.png" alt="FORMA" />
          </span>
          <h3>
            Today looks
            <br />
            strong, Alex.
          </h3>
          <div className="card">
            <strong>3 / 4</strong>
            <p>Weekly workout goal</p>
            <div className="progress">
              <i style={{ width: '75%' }} />
            </div>
          </div>
          {button('Book a class', () => go('Bookings'))}
        </div>
      </section>
      <section>
        {heading('GOOD QUESTIONS. CLEAR ANSWERS.', 'A few things to know.')}
        {[
          'How do I choose a membership?',
          'Can I book a trial session?',
          'Are personal trainers included?',
          'Can I pause my membership?',
          'How do equipment reservations work?',
        ].map((q, i) => (
          <details key={q} open={i === 0}>
            <summary>
              {q}
              <ChevronDown size={17} />
            </summary>
            <p>
              {
                [
                  'Compare the package benefits, then select a plan that fits your training routine. Our team can help you choose.',
                  'Contact our team about trial options. Instructor sessions are available to approved, active members.',
                  'All plans include an introductory session. Premium and VIP offer additional coaching benefits.',
                  'Contact our team to discuss a pause that fits your circumstances.',
                  'Choose your equipment, date and time. Your confirmation will include the session details.',
                ][i]
              }
            </p>
          </details>
        ))}
      </section>
      <section id="contact">
        {heading('YOUR NEXT CHAPTER', 'Let’s build your next chapter.')}
        <div className="grid two">
          <form onSubmit={(e) => submit(e, 'contacts')}>
            <label>
              Full name
              <input name="name" placeholder="Your name" required />
            </label>
            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Message
              <textarea
                name="message"
                placeholder="Tell us about your goals"
                required
              />
            </label>
            <button className="button" disabled={busy}>
              Send message <ArrowUpRight size={15} />
            </button>
          </form>
          <div className="card contact-card">
            <h3>Come find your rhythm.</h3>
            <p>A space to move and a team to be confident with.</p>
            <p>
              Mon’Fri 06:00·22:00
              <br />
              Sat’Sun 08:00·20:00
            </p>
            <div className="card">
              <h3>? Your gym location</h3>
              <p>Brisbane · Australia</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
