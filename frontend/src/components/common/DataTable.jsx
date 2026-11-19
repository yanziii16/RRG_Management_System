function DataTable({
  columns,
  data,
  rowKey,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filter criteria.",
  onRowClick
}) {
  if (data.length === 0) {
    return <div className="bg-white border border-[#DCE5E3] rounded-xl py-10 px-4 text-center">
        <p className="text-sm font-medium text-[#152423]">{emptyTitle}</p>
        <p className="text-xs text-[#5A6D6B] mt-1">{emptyDescription}</p>
      </div>;
  }
  return <div className="bg-white border border-[#DCE5E3] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E8EEEC] bg-[#F7FAF9]">
              {columns.map((col) => <th
    key={col.key}
    className={`px-4 py-3 text-xs font-semibold text-[#435654] whitespace-nowrap ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
  >
                  {col.header}
                </th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F1]">
            {data.map((row) => <tr
    key={rowKey(row)}
    onClick={onRowClick ? () => onRowClick(row) : void 0}
    className={`text-sm text-[#152423] transition-colors ${onRowClick ? "hover:bg-[#F5F8F7] cursor-pointer" : "hover:bg-[#FAFCFB]"}`}
  >
                {columns.map((col) => <td
    key={col.key}
    className={`px-4 py-3 align-middle ${col.align === "right" ? "text-right tabular-nums" : col.align === "center" ? "text-center" : "text-left"}`}
  >
                    {col.render(row)}
                  </td>)}
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
export {
  DataTable
};
