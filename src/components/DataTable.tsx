interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  const alignClass = (align?: string) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`pb-2 font-medium text-muted/60 text-xs ${alignClass(col.align)}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 font-mono text-sm ${alignClass(col.align)}`}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
