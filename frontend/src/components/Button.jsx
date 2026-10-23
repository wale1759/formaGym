import { ArrowUpRight } from 'lucide-react';

export default function Button({ children, onClick, secondary = false, ...props }) {
  return (
    <button className={secondary ? 'button secondary' : 'button'} onClick={onClick} {...props}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
