// components/UI/MedCard.tsx
interface MedCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'gold' | 'crimson' | 'ember';
}

export const MedCard = ({ title, subtitle, children, variant = 'gold' }: MedCardProps) => {
  const borderColors = {
    gold: 'border-gold/30',
    crimson: 'border-crimson/30',
    ember: 'border-ember/30'
  }

  return (
    <div className={`bg-paper border ${borderColors[variant]} rounded-lg p-6 relative overflow-hidden`}>
      <div className="flex flex-col mb-4">
        <h4 className="text-gold font-bold uppercase tracking-wider text-sm">{title}</h4>
        {subtitle && <span className="text-medMuted text-[10px] italic">{subtitle}</span>}
      </div>
      <div className="text-medText">
        {children}
      </div>
      {/* Estetik Köşe Süslemesi */}
      <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 ${borderColors[variant]} opacity-20`}></div>
    </div>
  )
}