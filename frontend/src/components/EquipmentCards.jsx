import { equipment, imageSrc } from '../data/catalog.js';
import Button from './Button.jsx';
export default function EquipmentCards({ filter = 'All', onSelect }) {
  const visibleEquipment = equipment.filter(
    (item) => filter === 'All' || item.category.includes(filter),
  );
  return (
    <div className="grid three">
      {visibleEquipment.map((item) => (
        <article className="card" key={item.name}>
          <img
            loading="lazy"
            decoding="async"
            className="equipment-image"
            src={imageSrc(item.image)}
            alt={item.name}
          />
          <span className="status">Available</span>
          <h3>{item.name}</h3>
          <p>{item.category}</p>
          <p className="fine">
            Smooth, connected training built around your performance.
          </p>
          <Button onClick={() => onSelect(item)}>Learn more</Button>
        </article>
      ))}
    </div>
  );
}
