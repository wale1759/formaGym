import { Heart } from 'lucide-react';
import { imageSrc } from '../data/catalog.js';
import Button from './Button.jsx';
export default function ProductCards({
  items,
  saved,
  onAdd,
  onFavorite,
  onQuickView,
}) {
  return (
    <div className="grid three">
      {items.map((product) => (
        <article className="card product" key={product.name}>
          <div className="image-wrap">
            <img
              loading="lazy"
              decoding="async"
              src={imageSrc(product.image)}
              alt={product.name}
            />
            <button
              className={`favorite ${saved.includes(product.name) ? 'active' : ''}`}
              aria-label={`Save ${product.name}`}
              aria-pressed={saved.includes(product.name)}
              onClick={() => onFavorite(product)}
            >
              <Heart size={18} />
            </button>
          </div>
          <span className="eyebrow">FORMA / {product.category}</span>
          <h3>{product.name}</h3>
          <p className="rating">
            ????? <span>4.8 (128 reviews)</span>
          </p>
          <div className="product-price">${product.price.toFixed(2)}</div>
          <p className="fine">
            Size S · M · L · XL &nbsp; / &nbsp; Black · Stone
          </p>
          <Button onClick={() => onAdd(product)}>Add to cart</Button>
          <Button onClick={() => onQuickView(product)} secondary>
            Quick view
          </Button>
        </article>
      ))}
    </div>
  );
}
