interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  return (
    <label className={`inline-flex items-center cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`block w-14 h-8 rounded-full transition-colors ${
          checked 
            ? 'bg-sky-600 dark:bg-sky-500' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`}></div>
        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}></div>
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
}; 