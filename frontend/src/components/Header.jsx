import { ArrowUpRight, Heart, Menu, ShoppingBag, X } from 'lucide-react';
export default function Header({
  pages,
  page,
  menu,
  setMenu,
  cart,
  go,
  setModal,
  member,
  sessionLoading,
  onSignOut,
}) {
  const isAccountPage = page === 'Signup' || page === 'Signin';
  const homePage = member ? 'Dashboard' : 'Home';
  const cartItemCount = cart.length;
  const memberLinks = [
    { page: 'Dashboard', label: 'My dashboard' },
    { page: 'Bookings', label: 'Classes' },
    { page: 'Workouts', label: 'Workouts' },
    { page: 'Nutrition', label: 'Nutrition' },
  ];
  // Members navigate to their account tools; guests explore the public pages.
  const links = member
    ? memberLinks
    : pages
        .filter((name) => !['Shop', 'Signup', 'Signin'].includes(name))
        .map((name) => ({ page: name, label: name }));
  return (
    <header className={member ? 'member-header' : ''}>
      <a
        href={member ? '#Dashboard' : '#'}
        className="logo"
        onClick={() => go(homePage)}
      >
        <img src="/assets/forma-logo-transparent.png" alt="FORMA" />
      </a>
      {!sessionLoading && (
        <>
          <nav
            id="primary-navigation"
            className={menu ? 'open' : ''}
            aria-label={member ? 'Member navigation' : 'Main navigation'}
          >
            {!member && !isAccountPage && (
              <a
                className="header-mobile-signin"
                href="#Signin"
                onClick={() => go('Signin')}
              >
                Sign in
              </a>
            )}
            {links.map(({ page: destination, label }) => (
              <a
                className={page === destination ? 'current' : ''}
                aria-current={page === destination ? 'page' : undefined}
                href={`#${destination}`}
                key={destination}
                onClick={() => go(destination)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            {member ? (
              <>
                <span className="member-header-name">{member.name}</span>
                <button
                  className="button secondary header-signout"
                  onClick={onSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  className="icon"
                  aria-label="Wishlist"
                  onClick={() => setModal({ type: 'wishlist' })}
                >
                  <Heart size={19} />
                </button>
                <button
                  className="icon bag"
                  aria-label={`Shopping bag, ${cartItemCount} items`}
                  onClick={() => setModal({ type: 'cart' })}
                >
                  <ShoppingBag size={19} />
                  {cartItemCount > 0 && <span>{cartItemCount}</span>}
                </button>
                {!isAccountPage && (
                  <div className="header-auth-actions">
                    <button
                      className="join header-signin"
                      onClick={() => go('Signin')}
                    >
                      Sign in
                    </button>
                    <button className="join" onClick={() => go('Membership')}>
                      Join now <ArrowUpRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              className="icon mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              aria-controls="primary-navigation"
              onClick={() => setMenu((isOpen) => !isOpen)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </>
      )}
    </header>
  );
}
