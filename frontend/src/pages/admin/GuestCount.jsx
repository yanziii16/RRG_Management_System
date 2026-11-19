import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminStatCard } from "../../components/admin/AdminStatCard";
import { Button } from "../../components/common/Button";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { Input } from "../../components/common/Input";
import { Loading } from "../../components/common/Loading";
import { Select } from "../../components/common/Select";
import { useNotification } from "../../context/NotificationContext";
import { extractErrorMessage } from "../../services/api";
import { guestService } from "../../services/guestService";
import { formatDateDisplay, getTodayISO } from "../../utils/dateUtils";
const GuestCount = () => {
  const { notify } = useNotification();
  const today = getTodayISO();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [date, setDate] = useState(today);
  const [session, setSession] = useState("Morning");
  const [kids, setKids] = useState("0");
  const [adults, setAdults] = useState("1");
  const [seniorPwd, setSeniorPwd] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loadCounts = async () => {
    setLoading(true);
    try {
      const list = await guestService.getGuestCounts();
      setRecords(list);
    } catch (err) {
      notify(extractErrorMessage(err, "Failed to load guest counts."), "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadCounts();
  }, []);
  const todaySummary = useMemo(() => {
    const targetDate = filterDate || today;
    const dayRecords = records.filter((r) => r.date === targetDate);
    const bySession = (s) => dayRecords.filter((r) => r.session === s).reduce((sum, r) => sum + r.total, 0);
    return {
      targetDate,
      morning: bySession("Morning"),
      afternoon: bySession("Afternoon"),
      night: bySession("Night"),
      total: dayRecords.reduce((sum, r) => sum + r.total, 0)
    };
  }, [records, filterDate, today]);
  const filteredRecords = useMemo(() => {
    if (!filterDate) return records;
    return records.filter((r) => r.date === filterDate);
  }, [records, filterDate]);
  const handleRecord = async (e) => {
    e.preventDefault();
    const k = Math.max(0, Number(kids) || 0);
    const a = Math.max(0, Number(adults) || 0);
    const s = Math.max(0, Number(seniorPwd) || 0);
    if (k + a + s === 0) {
      notify("Enter at least 1 walk-in guest.", "error");
      return;
    }
    setSaving(true);
    try {
      await guestService.addGuestCount({
        date,
        session,
        kids: k,
        adults: a,
        seniorPwd: s,
        notes
      });
      setKids("0");
      setAdults("1");
      setSeniorPwd("0");
      setNotes("");
      notify("Walk-in guest count recorded.", "success");
      await loadCounts();
    } catch (err) {
      notify(extractErrorMessage(err, "Could not save guest count."), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await guestService.deleteGuestCount(deleteTarget.id);
      notify("Guest count entry removed.", "info");
      setDeleteTarget(null);
      await loadCounts();
    } catch (err) {
      notify(extractErrorMessage(err, "Delete failed."), "error");
    }
  };
  const columns = [
    {
      key: "date",
      header: "Date",
      render: (r) => <span className="text-xs tabular-nums">{formatDateDisplay(r.date)}</span>
    },
    {
      key: "session",
      header: "Session",
      render: (r) => <span className="text-xs font-medium">{r.session}</span>
    },
    {
      key: "kids",
      header: "Kids",
      align: "right",
      render: (r) => <span className="text-xs">{r.kids}</span>
    },
    {
      key: "adults",
      header: "Adults",
      align: "right",
      render: (r) => <span className="text-xs">{r.adults}</span>
    },
    {
      key: "senior",
      header: "Senior / PWD",
      align: "right",
      render: (r) => <span className="text-xs">{r.seniorPwd}</span>
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (r) => <span className="text-xs font-semibold text-[#143E3B]">{r.total}</span>
    },
    {
      key: "notes",
      header: "Notes",
      render: (r) => <span className="text-xs text-[#5A6D6B]">{r.notes || "—"}</span>
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => <button
        type="button"
        onClick={() => setDeleteTarget(r)}
        title="Delete record"
        className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
      >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
    }
  ];
  return <div className="space-y-6">
      <AdminPageHeader
    title="Walk-In Guest Count"
    subtitle="Log walk-in entrance counts by Kids, Adults, and Senior/PWD across Morning, Afternoon, and Night sessions."
  />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
    label={`Morning (${formatDateDisplay(todaySummary.targetDate)})`}
    value={todaySummary.morning}
  />
        <AdminStatCard
    label={`Afternoon (${formatDateDisplay(todaySummary.targetDate)})`}
    value={todaySummary.afternoon}
  />
        <AdminStatCard
    label={`Night (${formatDateDisplay(todaySummary.targetDate)})`}
    value={todaySummary.night}
  />
        <AdminStatCard
    label="Daily Total Walk-Ins"
    value={todaySummary.total}
    helper="All sessions combined"
  />
      </div>

      {
    /* Log Entry Form */
  }
      <form
    onSubmit={handleRecord}
    className="bg-white border border-[#DCE5E3] rounded-xl p-5 space-y-4"
  >
        <h2 className="text-sm font-semibold text-[#152423]">Record Walk-In Entrance Count</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Input
    label="Date"
    type="date"
    required
    value={date}
    onChange={(e) => setDate(e.target.value)}
  />
          <Select
    label="Session"
    value={session}
    onChange={(e) => setSession(e.target.value)}
    options={[
      { value: "Morning", label: "Morning" },
      { value: "Afternoon", label: "Afternoon" },
      { value: "Night", label: "Night" }
    ]}
  />
          <Input
    label="Kids"
    type="number"
    min={0}
    value={kids}
    onChange={(e) => setKids(e.target.value)}
  />
          <Input
    label="Adults"
    type="number"
    min={0}
    value={adults}
    onChange={(e) => setAdults(e.target.value)}
  />
          <Input
    label="Senior / PWD"
    type="number"
    min={0}
    value={seniorPwd}
    onChange={(e) => setSeniorPwd(e.target.value)}
  />
          <Button type="submit" loading={saving} className="w-full">
            Save Count
          </Button>
        </div>
        <Input
    label="Notes (optional)"
    placeholder="Group name or entrance remarks..."
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
  />
      </form>

      {
    /* Historical Records */
  }
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#152423]">Historical Entrance Records</h2>
          <div className="flex items-center gap-2">
            <input
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
    className="min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#DCE5E3] rounded-lg tabular-nums"
  />
            {filterDate && <Button type="button" size="sm" variant="outline" onClick={() => setFilterDate("")}>
                Clear
              </Button>}
          </div>
        </div>

        {loading ? <Loading /> : <DataTable columns={columns} data={filteredRecords} rowKey={(r) => r.id} />}
      </div>

      <ConfirmDialog
    open={Boolean(deleteTarget)}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleDelete}
    title="Delete entrance count record?"
    message="This will remove the selected walk-in count record from daily totals."
    confirmLabel="Delete"
  />
    </div>;
};
export {
  GuestCount
};
