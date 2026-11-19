const AdminPageHeader = ({
  title,
  subtitle,
  action
}) => {
  return <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#152423] tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-[#5A6D6B]">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>;
};
export {
  AdminPageHeader
};
