interface TimelineItem {
  label: string;
  date?: string;
  detail?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.label}-${item.date ?? ''}`}>
          <strong>{item.label}</strong>
          {item.date ? <span>{new Date(item.date).toLocaleString()}</span> : null}
          {item.detail ? <p>{item.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}
