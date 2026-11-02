import { X } from 'lucide-react';
import { products } from '../data/products.js';
import { imageSrc } from '../data/catalog.js';
import Button from './Button.jsx';
import ProductCards from './ProductCards.jsx';
const button = (text, onClick, secondary = false) => (
  <Button onClick={onClick} secondary={secondary}>
    {text}
  </Button>
);

export default function ShoppingDialogs({
  modal,
  setModal,
  size,
  setSize,
  add,
  favorite,
  saved,
  cart,
  setCart,
  total,
  go,
  submit,
  busy,
}) {
  const productCards = (items) => (
    <ProductCards
      items={items}
      saved={saved}
      onAdd={add}
      onFavorite={favorite}
      onQuickView={(product) => setModal({ type: 'product', product })}
    />
  );
  return (
    <>
      {' '}
      {modal.type === 'product' && (
        <>
          <img
            className="modal-image"
            src={imageSrc(modal.product.image)}
            alt={modal.product.name}
          />
          <h2>{modal.product.name}</h2>
          <h3>${modal.product.price.toFixed(2)}</h3>
          <p>Made to move. Thoughtful essentials for your everyday training.</p>
          <div className="filters">
            {['S', 'M', 'L', 'XL'].map((s) => (
              <button
                key={s}
                className={size === s ? 'selected' : ''}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {button(`Add to cart · ${size}`, () => add(modal.product, size))}
          {button(
            saved.includes(modal.product.name)
              ? 'Saved to wishlist'
              : 'Save to wishlist',
            () => favorite(modal.product),
            true,
          )}
        </>
      )}
      {modal.type === 'wishlist' && (
        <>
          <h2>Saved for your next session.</h2>
          {saved.length ? (
            productCards(products.filter((p) => saved.includes(p.name)))
          ) : (
            <p>
              Your favourites will be here when you’re ready. Tap a heart in the
              shop.
            </p>
          )}
        </>
      )}
      {modal.type === 'cart' && (
        <>
          <h2>Your bag</h2>
          <p>{cart.length} essentials for your next session.</p>
          {cart.map((p) => (
            <div className="cart-row" key={`${p.name}-${p.size}`}>
              <img
                loading="lazy"
                decoding="async"
                src={imageSrc(p.image)}
                alt={p.name}
              />
              <div>
                <h3>{p.name}</h3>
                <p>
                  ${p.price.toFixed(2)} · Size {p.size || 'M'}
                </p>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={p.quantity}
                    onChange={(e) =>
                      setCart((c) =>
                        c.map((x) =>
                          x.name === p.name && x.size === p.size
                            ? {
                                ...x,
                                quantity: Math.max(
                                  1,
                                  Math.min(20, Number(e.target.value) || 1),
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <button
                className="icon"
                aria-label={`Remove ${p.name}`}
                onClick={() =>
                  setCart((c) =>
                    c.filter((x) => x.name !== p.name || x.size !== p.size),
                  )
                }
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <h3>
            Subtotal <span className="float-right">${total.toFixed(2)}</span>
          </h3>
          <p className="fine">
            USD · Demo checkout. No payments are processed.
          </p>
          {cart.length > 0 &&
            button('Checkout', () => setModal({ type: 'checkout' }))}
          {button(
            'Continue shopping',
            () => {
              setModal(null);
              go('Shop');
            },
            true,
          )}
        </>
      )}
      {modal.type === 'checkout' && (
        <>
          <h2>A few final details.</h2>
          <p>Demo checkout · No payment will be collected.</p>
          <form
            onSubmit={(e) =>
              submit(e, 'orders', {
                items: cart.map((p) => ({
                  name: p.name,
                  quantity: p.quantity,
                  size: p.size || 'M',
                })),
              })
            }
          >
            <label>
              Email address
              <input name="email" type="email" required />
            </label>
            <label>
              Full name
              <input name="name" required />
            </label>
            <label>
              Delivery address
              <input name="address" required />
            </label>
            <label>
              City and postcode
              <input name="city" required />
            </label>
            <div className="card">
              <h3>Order summary</h3>
              {cart.map((p) => (
                <p key={`${p.name}-${p.size}`}>
                  {p.name} · {p.quantity}
                  <span className="float-right">
                    ${(p.price * p.quantity).toFixed(2)}
                  </span>
                </p>
              ))}
              <h3>
                Total <span className="float-right">${total.toFixed(2)}</span>
              </h3>
            </div>
            <button className="button" disabled={busy}>
              {busy ? 'Placing order·' : 'Place demo order'}
            </button>
          </form>
        </>
      )}
    </>
  );
}
