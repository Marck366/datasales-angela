interface TipoBadgeProps {
  tipo: string;
}

export const TipoBadge = ({ tipo }: TipoBadgeProps) => {
  const isPartner = tipo === 'Partner';
  const config = {
    Cliente: 'bg-sky-50 dark:bg-white/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-400/20',
    Partner: 'bg-lime-50 dark:bg-white/10 text-lime-700 dark:text-lime-400 border border-lime-100 dark:border-lime-400/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
        isPartner ? config.Partner : config.Cliente
      }`}
    >
      {tipo}
    </span>
  );
};
