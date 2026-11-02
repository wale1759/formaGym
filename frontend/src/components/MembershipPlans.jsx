import { Check } from 'lucide-react';
import { plans } from '../data/catalog.js';
import Button from './Button.jsx';
const button = (text, onClick, secondary = false) => (
  <Button onClick={onClick} secondary={secondary}>
    {text}
  </Button>
);
const naira = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
export default function MembershipPlans({
  planPrices,
  pricingError,
  yearly,
  onBillingChange,
  onJoin,
}) {
  return (
    <>
      {pricingError && (
        <p role="status" className="fine">
          {pricingError}
        </p>
      )}
      <div className="billing">
        <button
          className={!yearly ? 'selected' : ''}
          onClick={() => onBillingChange(false)}
        >
          Monthly
        </button>
        <button
          className={yearly ? 'selected' : ''}
          onClick={() => onBillingChange(true)}
        >
          Yearly <span>Save 17%</span>
        </button>
      </div>
      <div className="plans grid four">
        {plans.map(({ name, description }, i) => (
          <article
            className={`card plan ${i === 2 ? 'featured' : ''}`}
            key={name}
          >
            <span className="tag">
              {i === 2
                ? 'Recommended'
                : i === 3
                  ? 'Complete access'
                  : 'Flexible membership'}
            </span>
            <h3>{name}</h3>
            <p>{description}</p>
            <div className="price">
              {naira(planPrices[name] * (yearly ? 10 : 1))}
              <small> / {yearly ? 'year' : 'month'}</small>
            </div>
            <p className="fine">
              NGN · {yearly ? 'billed yearly' : 'billed monthly'}
            </p>
            <ul>
              {[
                'Full gym access',
                `${i > 0 ? 'Unlimited' : '2'} classes / month`,
                'Trainer introductory session',
                'Nutrition starter guide',
                ...(i > 1
                  ? [
                      'Sauna and recovery access',
                      'Priority reservations',
                      'Member events',
                    ]
                  : ['Member app access']),
              ].map((x) => (
                <li key={x}>
                  <Check size={13} />
                  {x}
                </li>
              ))}
            </ul>
            {button(
              `Join ${name}`,
              () => {
                onJoin({
                  selectedPlan: name,
                  billing: yearly ? 'yearly' : 'monthly',
                });
              },
              i !== 2,
            )}
          </article>
        ))}
      </div>
    </>
  );
}
