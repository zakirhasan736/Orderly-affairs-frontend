interface Props {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: Props) => {
  const percent = ((current + 1) / total) * 100;

  return (
    <div className="mb-4">
      <div className="text-xs text-muted-foreground mb-2">
        Step {current + 1} of {total}
      </div>
      <div className="h-[2px] bg-slate-200 rounded">
        <div
          className="h-[2px] bg-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
