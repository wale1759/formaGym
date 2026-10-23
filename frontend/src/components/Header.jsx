import { ArrowUpRight, Heart, Menu, ShoppingBag, X } from 'lucide-react';
export default function Header({ pages, page, menu, setMenu, cart, go, setModal, member, sessionLoading, onSignOut }) {
  const authPage = page === 'Signup' || page === 'Signin';
  const links = member ? [['Dashboard', 'My dashboard'], ['Bookings', 'Classes'], ['Workouts', 'Workouts'], ['Nutrition', 'Nutrition']] : [...(!authPage ? [['Signup', 'Sign up'], ['Signin', 'Sign in']] : []), ...pages.filter(name => name !== 'Shop').map(name => [name, name])];
  return <header className={member ? 'member-header' : ''}>
    <a href={member ? '#Dashboard' : '#'} className="logo" onClick={() => go(member ? 'Dashboard' : 'Home')}><img src="/assets/forma-logo-transparent.png" alt="FORMA"/></a>
    {!sessionLoading && <><nav className={menu ? 'open' : ''} aria-label={member ? 'Member navigation' : 'Main navigation'}>{links.map(([name, label]) => <a className={page === name ? 'current' : ''} aria-current={page === name ? 'page' : undefined} href={`#${name}`} key={name} onClick={() => go(name)}>{label}</a>)}</nav>
    <div className="header-actions">{member ? <><span className="member-header-name">{member.name}</span><button className="button secondary header-signout" onClick={onSignOut}>Sign out</button></> : <><button className="icon" aria-label="Wishlist" onClick={() => setModal({ type: 'wishlist' })}><Heart size={19}/></button><button className="icon bag" aria-label={`Shopping bag, ${cart.length} items`} onClick={() => setModal({ type: 'cart' })}><ShoppingBag size={19}/>{cart.length > 0 && <span>{cart.length}</span>}</button>{!authPage && <button className="join" onClick={() => go('Membership')}>Join now <ArrowUpRight size={14}/></button>}</>}<button className="icon mobile-menu" aria-label="Toggle navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div></>}
  </header>;
}
