export const Slider = ({ min, max, step = 1, value, onChange, marks = [] }) => (
  <div className="space-y-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-blue-500"
    />
    <div className="flex justify-between text-[10px] text-gray-500">
      {marks.map((mark) => (
        <span key={mark.value}>{mark.label}</span>
      ))}
    </div>
  </div>
);

