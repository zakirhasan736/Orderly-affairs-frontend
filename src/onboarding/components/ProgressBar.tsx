interface Props {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: Props) => {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="mb-4">
      <div className="text-xs mb-2">
        Step {current + 1} of {total}
      </div>
      <div className="h-[3px] bg-gray-200 rounded">
        <div
          className="h-[3px] bg-amber-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
