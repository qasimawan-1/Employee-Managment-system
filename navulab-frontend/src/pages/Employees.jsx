import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, EmptyState, Loading, ErrorBanner, SuccessBanner, Button, Pagination, Avatar } from "../components/ui";

const ALL_ROLES = ["EMPLOYEE", "TEAM_LEAD", "FINANCE", "HR", "CEO", "CTO"];

const EMPLOYEE_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACTUAL", label: "Contractual" },
  { value: "INTERN", label: "Intern" },
];

const ROLE_BADGE_CLASSES = {
  ADMIN: "bg-purple/15 text-purple border-purple/30",
  CEO: "bg-purple/15 text-purple border-purple/30",
  CTO: "bg-purple/15 text-purple border-purple/30",
  HR: "bg-signal/15 text-signal border-signal/30",
  FINANCE: "bg-amber/15 text-amber border-amber/30",
  TEAM_LEAD: "bg-mint/15 text-mint border-mint/30",
  EMPLOYEE: "bg-panel2 text-muted border-line",
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.EMPLOYEE}`}>
      {role?.replace("_", " ")}
    </span>
  );
}

export default function Employees() {
  const { isTeamLead, canSeeAllDepartments, user } = useAuth();
  // Team leads can only ever create Employee accounts, scoped to their own
  // department by the backend regardless of what's shown here.
  const ROLES = isTeamLead ? ["EMPLOYEE"] : ALL_ROLES;
  const {
    items: employees, page, count, hasNext, hasPrevious, loading, error, setError, goToPage,
  } = usePaginatedList("/api/auth/employees/", "Couldn't load employees.");
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "EMPLOYEE",
    department: "",
    password: "",
    phone: "",
    personal_email: "",
    cnic: "",
    residential_address: "",
    date_of_birth: "",
    reporting_manager: "",
    employee_type: "FULL_TIME",
    custom_role: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [customRoles, setCustomRoles] = useState([]);

  async function loadDepartments() {
    try {
      const { data } = await api.get("/api/auth/departments/");
      setDepartments(data.results || data);
    } catch {
      // HR/CEO-only endpoint; a non-HR viewer simply won't get a dropdown.
    }
  }

  async function loadManagers() {
    try {
      const { data } = await api.get("/api/auth/employees/", { params: { page_size: 500 } });
      setManagers(data.results || data);
    } catch {
      // Non-HR viewers just won't get a reporting-manager dropdown.
    }
  }

  async function loadCustomRoles() {
    try {
      const { data } = await api.get("/api/auth/roles/", { params: { page_size: 500 } });
      setCustomRoles(data.results || data);
    } catch {
      // HR/Admin-only endpoint; a non-HR/Admin viewer simply won't get a dropdown.
    }
  }

  useEffect(() => {
    loadDepartments();
    loadManagers();
    loadCustomRoles();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      await api.post("/api/auth/employees/", {
        ...form,
        department: form.department ? Number(form.department) : null,
        reporting_manager: form.reporting_manager ? Number(form.reporting_manager) : null,
        custom_role: form.custom_role ? Number(form.custom_role) : null,
        date_of_birth: form.date_of_birth || null,
      });
      setSuccess(
        `Account created for ${form.username} — username/password were emailed to ${form.email}. ` +
        `(No real mailbox is set up yet, so check the auth-service log if the email hasn't actually arrived.)`
      );
      setShowForm(false);
      setForm(emptyForm);
      loadManagers();
      goToPage(1);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.password?.[0] || data?.username?.[0] || "Couldn't create that account.";
      setError(msg);
    }
  }

  async function handleDelete(emp) {
    if (!window.confirm(`Delete ${emp.username}'s account? This can't be undone.`)) return;
    setError("");
    try {
      await api.delete(`/api/auth/employees/${emp.id}/`);
      goToPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't delete that account.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Employees"
        icon="fa-solid fa-users"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-user-plus"}`}></i>
            {showForm ? "Cancel" : "Add employee"}
          </Button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Username</label>
              <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Email</label>
              <input required type="email" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Password</label>
              <input required type="text" minLength={8} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal font-mono"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="min. 8 characters" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">First name</label>
              <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Last name</label>
              <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Role</label>
              <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            {isTeamLead ? (
              <div>
                <label className="block text-xs text-muted mb-1.5">Department</label>
                <div className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-muted">
                  Your department (added automatically)
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-muted mb-1.5">Department</label>
                <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                  <option value="">— none —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1.5">Primary contact no.</label>
              <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Personal email</label>
              <input type="email" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.personal_email} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">CNIC no.</label>
              <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Date of birth</label>
              <input type="date" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1.5">Residential address</label>
              <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.residential_address} onChange={(e) => setForm({ ...form, residential_address: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Reporting manager</label>
              <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.reporting_manager} onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}>
                <option value="">— none —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{`${m.first_name} ${m.last_name}`.trim() || m.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Employee type</label>
              <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.employee_type} onChange={(e) => setForm({ ...form, employee_type: e.target.value })}>
                {EMPLOYEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {customRoles.length > 0 && (
              <div>
                <label className="block text-xs text-muted mb-1.5">Custom role</label>
                <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.custom_role} onChange={(e) => setForm({ ...form, custom_role: e.target.value })}>
                  <option value="">— none —</option>
                  {customRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <Button type="submit"><i className="fa-solid fa-paper-plane"></i> Create account &amp; email credentials</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : employees.length === 0 ? (
        <EmptyState icon="fa-solid fa-users" title="No employees found" />
      ) : (
        <>
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Custom role</th>
                <th className="px-5 py-3 font-medium">Department</th>
                {canSeeAllDepartments && <th className="px-5 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors">
                  <td className="px-5 py-3 text-ink">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${emp.first_name} ${emp.last_name}`.trim() || emp.username} />
                      {emp.first_name} {emp.last_name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted font-mono">{emp.username}</td>
                  <td className="px-5 py-3 text-muted">{emp.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={emp.role} /></td>
                  <td className="px-5 py-3 text-muted">{emp.custom_role_name || "—"}</td>
                  <td className="px-5 py-3 text-muted">{emp.department_name || "—"}</td>
                  {canSeeAllDepartments && (
                    <td className="px-5 py-3 text-right">
                      {emp.id !== user?.id && (
                        <button
                          onClick={() => handleDelete(emp)}
                          title="Delete employee"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
        <Pagination page={page} count={count} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
