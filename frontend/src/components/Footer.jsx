import { ArrowRight } from 'lucide-react';

export default function Footer({ pages, submit, busy }) {
  return (
    <footer className="site-footer">
      <div className="footer-column footer-brand">
        <a className="logo" href="#"><img src="/assets/forma-logo-transparent.png" alt="FORMA" /></a>
        <p>Fitness with purpose. Progress for life.</p>
        <p className="fine">Instagram · YouTube · Facebook</p>
      </div>
      <div className="footer-column">
        <h4>Explore</h4>
        <div className="footer-links">
          {pages.map(name => <a href={`#${name}`} key={name}>{name}</a>)}
          <a href="#Dashboard">Dashboard</a>
          <a href="#Bookings">My bookings</a>
          <a href="#Signup">Create account</a>
        </div>
        <a className="button secondary" href="#Admin">Admin sign in</a>
      </div>
      <div className="footer-column">
        <h4>Stay in your rhythm</h4>
        <p>Training tips. Fresh perspectives. FORMA news.</p>
        <form onSubmit={event => submit(event, 'subscriptions')}>
          <label className="sr-only" htmlFor="subscribe">Your email</label>
          <input id="subscribe" name="email" type="email" placeholder="Your email address" required />
          <button className="button" disabled={busy}>Subscribe <ArrowRight size={15} /></button>
        </form>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} FORMA. All rights reserved.</span>
        <span>Privacy · Terms · Move with purpose.</span>
      </div>
    </footer>
  );
}
