const AdminStatCard = ({ label, value, helper }) => {
  return <div className="bg-white border border-[#DCE5E3] rounded-xl p-4 sm:p-5">
      <p className="text-xs font-medium text-[#5A6D6B]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#152423] tabular-nums tracking-tight">
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-[#5A6D6B] tabular-nums">{helper}</p>}
    </div>;
};
export {
  AdminStatCard
};
