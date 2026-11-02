import EquipmentCards from './components/EquipmentCards.jsx';
import MembershipPlans from './components/MembershipPlans.jsx';
import ShoppingDialogs from './components/ShoppingDialogs.jsx';
import ProductCards from './components/ProductCards.jsx';
import { pages, plans, workouts, imageSrc } from './data/catalog.js';
import { products } from './data/products.js';
import useStored from './hooks/useStored.js';
import { gymToday } from '../../shared/gym.js';
import HomePage from './components/HomePage.jsx';
import useMemberSession from './hooks/useMemberSession.js';
import UpcomingClasses from './components/UpcomingClasses.jsx';
import SigninForm from './components/SigninForm.jsx';
import { useState, useEffect, useRef } from 'react';
import { Check, X, Play, Pause } from 'lucide-react';
import './styles.css';
import Header from './components/Header.jsx';
import JoinMembership from './components/JoinMembership.jsx';
import MemberDashboard from './components/MemberDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Footer from './components/Footer.jsx';
import Button from './components/Button.jsx';
import SectionHeading from './components/SectionHeading.jsx';
async function api(type, data) {
  const res = await fetch(`/api/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) {
    throw Error(result.error);
  }
  return result;
}
function trackActivity(action, target) {
  fetch('/api/member/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, target }),
  }).catch(() => {});
}
export default function App() {
  const { user: member, loading: sessionLoading } = useMemberSession();
  const [signOutError, setSignOutError] = useState('');
  const [enrollment, setEnrollment] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('forma-enrollment'));
      return saved &&
        ['Starter', 'Standard', 'Premium', 'VIP'].includes(
          saved.selectedPlan,
        ) &&
        ['monthly', 'yearly'].includes(saved.billing)
        ? saved
        : { selectedPlan: 'Starter', billing: 'monthly' };
    } catch {
      return { selectedPlan: 'Starter', billing: 'monthly' };
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem('forma-enrollment', JSON.stringify(enrollment));
    } catch {
      /* Plan selection still works when browser storage is unavailable. */
    }
  }, [enrollment]);
  const [planPrices, setPlanPrices] = useState(
    Object.fromEntries(plans.map((plan) => [plan.name, plan.monthlyPrice])),
  );
  const [pricingError, setPricingError] = useState('');
  const [page, setPage] = useState(location.hash.slice(1) || 'Home');
  const [menu, setMenu] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useStored('forma-cart', []);
  const [saved, setSaved] = useStored('forma-saved', []);
  const [bookings, setBookings] = useStored('forma-bookings', []);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => gymToday());
  const [time, setTime] = useState('10:30');
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [size, setSize] = useState('M');
  useEffect(() => {
    trackActivity('page_view', page);
  }, [page]);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () =>
      fetch('/api/pricing', { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw Error(
              'Current pricing is unavailable. Displaying default naira prices; please confirm with management.',
            );
          }
          const result = await response.json();
          setPlanPrices(result.prices);
          setPricingError('');
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setPricingError(error.message);
          }
        });
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pricing-updated', refresh);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pricing-updated', refresh);
    };
  }, [page]);
  useEffect(() => {
    const fn = () => {
      setPage(location.hash.slice(1) || 'Home');
      setFilter('All');
      setSearch('');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    if (!toast) {
      return;
    }
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!playing) {
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);
  const dialog = useRef(null);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      setError('');
    } else {
      dialog.current?.close();
      setPlaying(false);
    }
  }, [modal]);
  async function signOut() {
    setSignOutError('');
    try {
      const response = await fetch('/api/member/logout', { method: 'POST' });
      if (!response.ok && response.status !== 401) {
        throw Error('Unable to sign out. Please try again.');
      }
      window.dispatchEvent(new Event('member-session-changed'));
      go('Signin');
    } catch (error) {
      setSignOutError(error.message);
    }
  }
  function go(name) {
    location.hash = name === 'Home' ? '' : name;
    setPage(name);
    setMenu(false);
  }
  function add(product, selectedSize = 'M') {
    trackActivity('cart_add', product.name);
    setCart((items) => {
      const exists = items.some(
        (item) => item.name === product.name && item.size === selectedSize,
      );
      return exists
        ? items.map((item) =>
            item.name === product.name && item.size === selectedSize
              ? { ...item, quantity: Math.min(20, item.quantity + 1) }
              : item,
          )
        : [...items, { ...product, quantity: 1, size: selectedSize }];
    });
    setToast('Added to your bag');
  }
  function favorite(product) {
    trackActivity('wishlist_update', product.name);
    setSaved((savedNames) => {
      const alreadySaved = savedNames.includes(product.name);
      if (alreadySaved) {
        return savedNames.filter((name) => name !== product.name);
      }
      return [...savedNames, product.name];
    });
  }
  async function submit(event, type, extra = {}) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api(type, { ...data, ...extra });
      if (type === 'bookings') {
        setBookings((b) => [...b, { ...extra, id: result.id }]);
      }
      if (type === 'orders') {
        setCart([]);
      }
      setModal({
        type: 'success',
        title: {
          bookings: 'You’re booked.',
          contacts: 'Thanks for reaching out.',
          memberships: 'Your next chapter starts here.',
          orders: 'Your next session, upgraded.',
          subscriptions: 'You’re on the list.',
        }[type],
        message:
          type === 'orders'
            ? 'Your demo order is saved. No payment has been taken.'
            : `We’ve received your request. Reference ${result.id.slice(0, 8).toUpperCase()}.`,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const button = (text, fn, secondary = false) => (
    <Button onClick={fn} secondary={secondary}>
      {text}
    </Button>
  );
  const heading = (eyebrow, title, description) => (
    <SectionHeading eyebrow={eyebrow} title={title} description={description} />
  );
  const memberships = () => (
    <MembershipPlans
      planPrices={planPrices}
      pricingError={pricingError}
      yearly={yearly}
      onBillingChange={setYearly}
      onJoin={(selection) => {
        setEnrollment(selection);
        go('Signup');
      }}
    />
  );
  const productCards = (items = products) => (
    <ProductCards
      items={items}
      saved={saved}
      onAdd={add}
      onFavorite={favorite}
      onQuickView={(product) => setModal({ type: 'product', product })}
    />
  );
  const equipmentCards = () => (
    <EquipmentCards
      filter={filter}
      onSelect={(item) => setModal({ type: 'equipment', item })}
    />
  );
  const tabs = (items) => (
    <div className="filters">
      {items.map((x) => (
        <button
          className={filter === x ? 'selected' : ''}
          onClick={() => setFilter(x)}
          key={x}
        >
          {x}
        </button>
      ))}
    </div>
  );
  const total = cart.reduce(
    (subtotal, item) => subtotal + item.price * item.quantity,
    0,
  );
  return (
    <>
      <Header
        pages={pages}
        page={page}
        menu={menu}
        setMenu={setMenu}
        cart={cart}
        go={go}
        setModal={setModal}
        member={member}
        sessionLoading={sessionLoading}
        onSignOut={signOut}
      />
      <main>
        {signOutError && (
          <p className="error" role="alert">
            {signOutError}
          </p>
        )}
        {page === 'Home' ? (
          <HomePage
            heading={heading}
            memberships={memberships}
            equipmentCards={equipmentCards}
            button={button}
            go={go}
            submit={submit}
            busy={busy}
            imageSrc={imageSrc}
          />
        ) : (
          <>
            <div className="page-heading">
              <span className="eyebrow">FORMA / {page.toUpperCase()}</span>
              <h1>
                {{
                  Signin: 'Welcome back to FORMA',
                  Admin: 'Gym management',
                  Signup: 'Join the FORMA community',
                  Membership: 'Find your membership',
                  Equipment: 'Premium equipment',
                  Shop: 'Performance essentials',
                  Trainers: 'Expert coaching. Personal results.',
                  Workouts: 'Workout library',
                  Nutrition: 'Fuel your progress',
                  Bookings: 'Make time for progress',
                  Dashboard: 'Your membership dashboard',
                }[page] || 'Find your next level.'}
              </h1>
              <p>Purposeful training. A little more progress, every day.</p>
            </div>
            {page === 'Admin' && <AdminDashboard />}
            {page === 'Signup' && (
              <JoinMembership member={member} sessionLoading={sessionLoading} />
            )}
            {page === 'Dashboard' && (
              <MemberDashboard
                enrollment={enrollment}
                onBook={(item) =>
                  setModal({
                    type: 'booking',
                    name: item.name,
                    waitlist: !!item.waitlist,
                  })
                }
              />
            )}
            {page === 'Signin' && <SigninForm />}
            {page === 'Membership' && (
              <section className="page-section">
                {memberships()}
                {heading(
                  'MADE FOR YOUR ROUTINE',
                  'A membership that fits your life.',
                  'Flexible access, expert support and a community that keeps you moving.',
                )}
                {button(
                  'Talk with our team',
                  () => {
                    go('Home');
                    setTimeout(
                      () =>
                        document.getElementById('contact')?.scrollIntoView(),
                      100,
                    );
                  },
                  true,
                )}
              </section>
            )}
            {page === 'Shop' && (
              <section className="page-section">
                <input
                  className="search"
                  aria-label="Search products"
                  placeholder="Search essentials..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {tabs(['All', 'Apparel', 'Footwear', 'Accessories'])}
                {productCards(
                  products.filter(
                    (p) =>
                      (filter === 'All' || p.category === filter) &&
                      p.name.toLowerCase().includes(search.toLowerCase()),
                  ),
                )}
                {!products.some(
                  (p) =>
                    (filter === 'All' || p.category === filter) &&
                    p.name.toLowerCase().includes(search.toLowerCase()),
                ) && <p>No products found. Try another search.</p>}
              </section>
            )}
            {page === 'Equipment' && (
              <section className="page-section">
                {tabs(['All', 'Cardio', 'Strength', 'Functional'])}
                {equipmentCards()}
                <div className="callout">
                  {heading(
                    'HERE TO HELP',
                    'Confidence starts with good guidance.',
                    'Our coaches will help you find your form.',
                  )}
                  {button('Find your coach', () => go('Trainers'))}
                </div>
              </section>
            )}
            {page === 'Trainers' && (
              <section className="page-section">
                <h2>Coaching for active members</h2>
                <p>
                  Instructor profiles and session requests are available in your
                  dashboard once your membership is approved and active.
                </p>
                <a className="button" href="#Dashboard">
                  Open member dashboard
                </a>
              </section>
            )}
            {page === 'Workouts' && (
              <section className="page-section">
                <input
                  className="search"
                  aria-label="Search workouts"
                  placeholder="Find your next workout..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {tabs(['All', 'Beginner', 'Intermediate', 'Advanced'])}
                <div className="grid three">
                  {workouts
                    .filter(
                      (workout) =>
                        (filter === 'All' ||
                          workout.description.includes(filter)) &&
                        workout.name
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .map((workout) => (
                      <article className="card" key={workout.name}>
                        <img
                          loading="lazy"
                          decoding="async"
                          className="workout-image"
                          src={imageSrc(workout.image)}
                          alt={workout.name}
                        />
                        <h3>{workout.name}</h3>
                        <p>{workout.description}</p>
                        <p className="fine">
                          Find your focus. Move with purpose.
                        </p>
                        {button('Start workout', () => {
                          trackActivity('workout_started', workout.name);
                          setSeconds(0);
                          setModal({ type: 'workout', item: workout });
                        })}
                      </article>
                    ))}
                </div>
              </section>
            )}
            {page === 'Nutrition' && (
              <section className="page-section">
                {tabs(['Today', 'Meal plans', 'Nutrition guidance'])}
                <div className="grid three">
                  {[
                    ['1,850 / 2,300', 'Daily calories'],
                    ['120 / 160 g', 'Protein'],
                    ['1.8 / 3.0 L', 'Water'],
                  ].map(([n, t]) => (
                    <div className="card metric" key={t}>
                      <h3>{n}</h3>
                      <p>{t}</p>
                      <div className="progress">
                        <i style={{ width: '75%' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card nutrition">
                  <h3>Your daily balance</h3>
                  {['Protein', 'Carbohydrates', 'Healthy fats'].map((n, i) => (
                    <div className="macro" key={n}>
                      <p>
                        {n}
                        <span>{[75, 65, 80][i]}%</span>
                      </p>
                      <div className="progress">
                        <i style={{ width: `${[75, 65, 80][i]}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {heading('EAT WELL. FEEL STRONG.', 'Today’s meals')}
                <div className="grid three">
                  {[
                    'Grilled fish & jollof bowl',
                    'Mango yoghurt smoothie',
                    'Chicken & ofada rice',
                  ].map((n, i) => (
                    <article className="card meal" key={n}>
                      <img
                        className="meal-photo"
                        src={`/assets/${['meal-jollof', 'meal-smoothie', 'meal-ofada'][i]}.jpg`}
                        alt={n}
                        loading="lazy"
                      />
                      <h3>{n}</h3>
                      <p>{[520, 280, 610][i]} kcal · Balanced nutrition</p>
                      {button('View recipe', () =>
                        setModal({ type: 'recipe', name: n, index: i }),
                      )}
                    </article>
                  ))}
                </div>
                <p className="fine">
                  Example daily nutrition data for demonstration.
                </p>
              </section>
            )}
            {page === 'Bookings' && (
              <section className="page-section">
                <UpcomingClasses
                  onBook={(item) =>
                    setModal({
                      type: 'booking',
                      name: item.name,
                      waitlist: !!item.waitlist,
                    })
                  }
                />
                {heading('YOUR TRAINING DIARY', 'Your upcoming reservations')}
                {bookings.length ? (
                  bookings.map((b) => (
                    <div className="card class-row" key={b.id}>
                      <div>
                        <h3>{b.item}</h3>
                        <p>
                          {b.date} · {b.time} · Nigeria (WAT)
                        </p>
                        <span className="status">
                          {b.waitlist ? 'Waitlisted' : 'Confirmed'}
                        </span>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() => {
                          setBookings((v) => v.filter((x) => x.id !== b.id));
                          setToast(
                            'Removed from this device’s diary. Contact FORMA to cancel the stored request.',
                          );
                        }}
                      >
                        Remove from diary
                      </button>
                    </div>
                  ))
                ) : (
                  <p>Your diary is ready for your next session.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <Footer pages={pages} submit={submit} busy={busy} />
      {toast && (
        <div role="status" className="toast">
          <Check size={18} />
          {toast}
        </div>
      )}
      <dialog
        ref={dialog}
        aria-label={modal ? `FORMA ${modal.type}` : 'FORMA'}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) {
            setModal(null);
          }
        }}
      >
        <button
          className="close icon"
          aria-label="Close dialog"
          onClick={() => setModal(null)}
        >
          <X />
        </button>
        {modal && (
          <div className="modal-content">
            <span className="eyebrow">FORMA / {modal.type}</span>
            {modal.type === 'success' ? (
              <>
                <span className="status">Request received</span>
                <h2>{modal.title}</h2>
                <p>{modal.message}</p>
                {button('Back to FORMA', () => setModal(null))}
              </>
            ) : null}
            {modal.type === 'booking' && (
              <>
                <h2>{modal.name}</h2>
                <p>
                  {modal.waitlist
                    ? 'Join the waitlist. We’ll contact you if a space opens.'
                    : 'Choose your session. Make time for progress.'}
                </p>
                <form
                  onSubmit={(e) =>
                    submit(e, 'bookings', {
                      item: modal.name,
                      date,
                      time,
                      waitlist: !!modal.waitlist,
                    })
                  }
                >
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                  <div className="card">
                    <h3>Choose your session</h3>
                    <label>
                      Date
                      <input
                        type="date"
                        min={gymToday()}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </label>
                    <div className="filters">
                      {['09:00', '10:30', '12:00', '14:00'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={time === t ? 'selected' : ''}
                          onClick={() => setTime(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="fine">All times · Nigeria (WAT)</p>
                  </div>
                  <button className="button" disabled={busy}>
                    {busy
                      ? 'Saving·'
                      : modal.waitlist
                        ? 'Join waitlist'
                        : 'Confirm reservation'}
                  </button>
                </form>
              </>
            )}
            {modal.type === 'equipment' && (
              <>
                <h2>{modal.item.name}</h2>
                <p>{modal.item.category}</p>
                <img
                  className="modal-image"
                  src={imageSrc(modal.item.image)}
                  alt={modal.item.name}
                />
                <span className="status">Available</span>
                <p>
                  A smooth, connected experience with adjustable resistance and
                  expert support.
                </p>
                <h3>Before you start</h3>
                <p>
                  1. Adjust the equipment to your needs.
                  <br />
                  2. Begin with a comfortable pace.
                  <br />
                  3. Ask a coach if you need help with setup.
                </p>
                {button('Reserve equipment', () =>
                  setModal({ type: 'booking', name: modal.item.name }),
                )}
              </>
            )}
            <ShoppingDialogs
              modal={modal}
              setModal={setModal}
              size={size}
              setSize={setSize}
              add={add}
              favorite={favorite}
              saved={saved}
              cart={cart}
              setCart={setCart}
              total={total}
              go={go}
              submit={submit}
              busy={busy}
            />
            {modal.type === 'workout' && (
              <>
                <h2>{modal.item.name}</h2>
                <p>{modal.item.description} · Dumbbells and bench</p>
                <div className="player">
                  <img
                    className="modal-image"
                    src={imageSrc(modal.item.image)}
                    alt="Workout guide"
                  />
                  <button
                    className="button"
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? <Pause size={18} /> : <Play size={18} />}{' '}
                    {playing ? 'Pause guided timer' : 'Start guided timer'} ·{' '}
                    {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                    {String(seconds % 60).padStart(2, '0')}
                  </button>
                </div>
                <h3>Session plan</h3>
                <p>
                  Warm up · 5 min
                  <br />
                  Strength circuit · 30 min
                  <br />
                  Core finisher · 5 min
                  <br />
                  Cool down · 5 min
                </p>
                {button('Complete workout', () => {
                  trackActivity('workout_completed', modal.item.name);
                  setPlaying(false);
                  setModal({
                    type: 'success',
                    title: 'Another step forward.',
                    message: 'Great work. Keep showing up for yourself.',
                  });
                })}
              </>
            )}
            {modal.type === 'recipe' && (
              <>
                <h2>{modal.name}</h2>
                <img
                  className="meal-photo"
                  src={`/assets/${['meal-jollof', 'meal-smoothie', 'meal-ofada'][modal.index]}.jpg`}
                  alt={modal.name}
                />
                <h3>Simple ingredients. Real fuel.</h3>
                <p>
                  {
                    [
                      'Grilled tilapia, jollof rice, fresh vegetables and a modest serving of plantain.',
                      'Mango, Greek yoghurt, milk of your choice and a little fresh ginger.',
                      'Grilled chicken, ofada rice, fresh greens and pepper sauce.',
                    ][modal.index]
                  }
                </p>
                <p>
                  Prepare the ingredients, combine in a bowl or blender, and
                  season to taste. Adjust portions to your needs.
                </p>
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </dialog>
      {error && !modal && (
        <div className="toast error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
