import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Home,
  MessageSquare,
  Trophy,
  CalendarClock,
  WashingMachine,
  CheckCircle2,
  Bell,
  Moon,
  Sun,
  Wallet,
  Upload,
  FileText,
  Download,
} from "lucide-react";
import { useSplitManager } from "../hooks/useSplitManager";
import { useAuth } from "../context/AuthContext";

const textField =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200";
const card = "rounded-3xl border border-gray-100 bg-white/90 shadow-lg p-6";

const formatCurrency = (value, currency = "USD") => {
  const amount = Number.isFinite(value) ? value : Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `$${amount.toFixed(2)}`;
  }
};

const Profile = () => {
  const { user: authUser } = useAuth();
  const {
    state,
    updateUser,
    addUser,
    linkBankAccount,
    getPaymentHistory,
    calculateBalances,
    setTheme,
    setNotificationPrefs,
    uploadProfileImage,
  } = useSplitManager();

  const [profileUserId, setProfileUserId] = useState("");
  const [info, setInfo] = useState({
    name: "",
    nickname: "",
    email: "",
    room: "",
    status: "",
    avatar: "",
    bio: "",
  });
  const [paymentContacts, setPaymentContacts] = useState({ zelle: "" });
  const [schedule, setSchedule] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const avatarInputRef = useRef(null);
  const scheduleInputRef = useRef(null);

  useEffect(() => {
    if (!authUser || !state.users) return;
    if (profileUserId) return;

    const existing = state.users.find((u) => u.email === authUser.email);
    if (existing) {
      setProfileUserId(existing.id);
      return;
    }

    const fallbackName = authUser.name || authUser.email?.split("@")[0] || "Resident";
    const createdId = addUser({ name: fallbackName, email: authUser.email });
    setProfileUserId(createdId);
  }, [authUser, state.users, profileUserId, addUser]);

  const profileUser = useMemo(
    () => state.users.find((u) => u.id === profileUserId) || null,
    [state.users, profileUserId]
  );

  useEffect(() => {
    if (!profileUser) return;
    setInfo({
      name: authUser?.name || profileUser.name || "",
      nickname: profileUser.nickname || "",
      email: authUser?.email || profileUser.email || "",
      room: profileUser.room || "",
      status: profileUser.status || "",
      avatar: profileUser.avatar || "",
      bio: profileUser.bio || "",
    });
    setPaymentContacts({
      zelle: state.bankAccounts[profileUser.id]?.zelle || "",
    });
    setSchedule(profileUser.schedule || null);
  }, [profileUser, state.bankAccounts, authUser]);

  const bookings = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("laundry_bookings") || "[]");
      if (!profileUser?.name) return [];
      return stored.filter((b) => b.user === profileUser.name);
    } catch {
      return [];
    }
  }, [profileUser?.name]);

  const tasks = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tasks") || "[]");
      if (!profileUser?.name) return [];
      return stored.filter((t) => t.assignedTo === profileUser.name);
    } catch {
      return [];
    }
  }, [profileUser?.name]);

  const completedTasks = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  const groupBalances = useMemo(() => {
    if (!profileUserId) return [];
    return state.groups.map((group) => ({
      group,
      value: calculateBalances(group.id)[profileUserId] || 0,
    }));
  }, [state.groups, profileUserId, calculateBalances]);

  const payments = useMemo(
    () => (profileUser ? getPaymentHistory(profileUser.id) : []),
    [profileUser, getPaymentHistory]
  );

  const findUser = (id) => state.users.find((u) => u.id === id) || {};

  const Avatar = ({ userId, fallbackName }) => {
    const user = findUser(userId);
    const avatar = user.avatar;
    const base =
      "w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold border border-gray-200";
    if (avatar && /^(https?:|data:)/.test(avatar)) {
      return <img src={avatar} alt={user.name || fallbackName || ""} className={base} />;
    }
    const content = avatar || (user.name || fallbackName || "?").charAt(0);
    return <span className={`${base} bg-gray-100 text-gray-600`}>{content}</span>;
  };

  const handleSaveInfo = () => {
    if (!profileUserId) return;
    updateUser(profileUserId, {
      nickname: info.nickname,
      room: info.room,
      status: info.status,
      avatar: info.avatar,
      bio: info.bio,
    });
  };

  const handleAvatarUpload = (file) => {
    if (!file || !profileUserId) return;
    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      updateUser(profileUserId, { avatar: dataUrl });
      setInfo((prev) => ({ ...prev, avatar: dataUrl }));
      uploadProfileImage(profileUserId, file);
      setIsUploadingAvatar(false);
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      alert("Failed to load image. Try a different file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentContacts = () => {
    if (!profileUserId) return;
    linkBankAccount(profileUserId, {
      zelle: paymentContacts.zelle,
    });
  };

  const handleScheduleUpload = (file) => {
    if (!file || !profileUserId) return;
    if (!/^image\//.test(file.type) && file.type !== "application/pdf") {
      alert("Upload a PDF or image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const scheduleRecord = { name: file.name, dataUrl: reader.result };
      setSchedule(scheduleRecord);
      updateUser(profileUserId, { schedule: scheduleRecord });
    };
    reader.onerror = () => alert("Failed to load schedule file.");
    reader.readAsDataURL(file);
  };

  const handleRemoveSchedule = () => {
    setSchedule(null);
    if (profileUserId) updateUser(profileUserId, { schedule: null });
  };

  if (!profileUser || !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <p className="text-gray-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 pb-24">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className={`relative w-20 h-20 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm transition ${
                isUploadingAvatar ? "opacity-60" : ""
              }`}
              title="Upload profile picture"
            >
              {info.avatar && /^(https?:|data:)/.test(info.avatar) ? (
                <img src={info.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : info.avatar ? (
                <span className="text-3xl">{info.avatar}</span>
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
              <span className="absolute inset-0 rounded-full border border-white/60 pointer-events-none"></span>
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
              <p className="text-sm text-gray-500">{info.name || authUser.name}</p>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={(event) => handleAvatarUpload(event.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
          <div className="rounded-full bg-white/80 border border-gray-200 px-4 py-2 text-xs text-gray-500 shadow-sm">
            Signed in as <span className="font-semibold text-gray-700">{authUser.email}</span>
          </div>
        </header>

        <section className={`${card} grid grid-cols-1 lg:grid-cols-[2fr_minmax(0,1fr)] gap-6`}>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-500" /> Basic Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> Full name
                </label>
                <input className={`${textField} bg-gray-50`} value={info.name} readOnly />
                <p className="text-[11px] mt-1 text-gray-400">Managed via your login account.</p>
              </div>

              <div>
                <label className="text-xs text-gray-500">Nickname</label>
                <input
                  className={textField}
                  value={info.nickname}
                  onChange={(e) => setInfo((prev) => ({ ...prev, nickname: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input className={`${textField} bg-gray-50`} value={info.email} readOnly />
              </div>

              <div>
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <Home className="w-3 h-3" /> Room / Dorm
                </label>
                <input
                  className={textField}
                  value={info.room}
                  onChange={(e) => setInfo((prev) => ({ ...prev, room: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Status message
                </label>
                <input
                  className={textField}
                  value={info.status}
                  onChange={(e) => setInfo((prev) => ({ ...prev, status: e.target.value }))}
                  placeholder="Available for chores today"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-500">Bio</label>
                <textarea
                  className={textField}
                  rows={3}
                  value={info.bio}
                  onChange={(e) => setInfo((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Share a quick intro or reminder for roommates."
                />
              </div>
            </div>
            <button
              className="mt-4 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
              onClick={handleSaveInfo}
            >
              Save info
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 p-5 text-sm text-blue-700">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Snapshot
              </h3>
              <p><span className="font-medium">Room:</span> {info.room || "—"}</p>
              <p><span className="font-medium">Status:</span> {info.status || "—"}</p>
              <p><span className="font-medium">Bio:</span> {info.bio || "Let your roommates know a bit about you."}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={card}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" /> Zelle contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500">Zelle (email or phone)</label>
                <input
                  className={textField}
                  placeholder="e.g., +1 555 123 4567"
                  value={paymentContacts.zelle}
                  onChange={(e) =>
                    setPaymentContacts((prev) => ({ ...prev, zelle: e.target.value }))
                  }
                />
                <p className="text-[11px] mt-1 text-gray-400">
                  Roommates will see this contact in the Split payment drawer.
                </p>
              </div>
              <button
                className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
                onClick={handleSavePaymentContacts}
              >
                Save
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent payments</h4>
              <div className="space-y-2 text-xs">
                {payments.length ? (
                  payments
                    .slice(-5)
                    .reverse()
                    .map((payment) => {
                      const payer = findUser(payment.payerId);
                      const payee = findUser(payment.payeeId);
                      return (
                        <div
                          key={payment.id}
                          className="rounded-xl border border-gray-200 px-3 py-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 text-gray-600">
                            <Avatar userId={payment.payerId} fallbackName={payment.payerId} />
                            <span>
                              {payer.name || payment.payerId} → {payee.name || payment.payeeId}
                            </span>
                          </div>
                          <div className="text-right text-gray-500">
                            <p className="font-medium text-gray-700">{formatCurrency(payment.amount)}</p>
                            <p>{payment.method} • {new Date(payment.createdAt).toLocaleDateString()}</p>
                            {payment.receipt ? (
                              <a
                                href={payment.receipt.dataUrl}
                                download={payment.receipt.name || "receipt"}
                                className="text-[11px] text-blue-600 hover:underline"
                              >
                                Download receipt
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-gray-400">No payments yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Personal schedule
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Upload your weekly schedule so roommates can see when you are free.</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => scheduleInputRef.current?.click()}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload PDF / image
                </button>
                {schedule && (
                  <button
                    type="button"
                    onClick={handleRemoveSchedule}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  ref={scheduleInputRef}
                  onChange={(event) => handleScheduleUpload(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              {schedule ? (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <Download className="w-4 h-4 text-gray-400" />
                  <a
                    href={schedule.dataUrl}
                    download={schedule.name || "schedule"}
                    className="hover:underline"
                  >
                    {schedule.name || "Download schedule"}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-400">No schedule uploaded yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className={card}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Activity overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs text-blue-700">Tasks completed</p>
              <p className="text-2xl font-semibold text-blue-800">{completedTasks}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-xs text-emerald-700">Payments made</p>
              <p className="text-2xl font-semibold text-emerald-800">{payments.length}</p>
            </div>
            <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4">
              <p className="text-xs text-purple-700">Upcoming laundry</p>
              <p className="text-2xl font-semibold text-purple-800">{bookings.length}</p>
            </div>
            <div className="rounded-2xl bg-pink-50 border border-pink-100 p-4">
              <p className="text-xs text-pink-700">Aura points</p>
              <p className="text-2xl font-semibold text-pink-800">{profileUser.aura ?? 0}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={card}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <WashingMachine className="w-5 h-5 text-indigo-500" /> My laundry schedule
            </h3>
            <div className="space-y-3 text-sm">
              {bookings.length ? (
                bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-gray-200 p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{b.machine}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.start).toLocaleString()} → {new Date(b.end).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">Reserved</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">You have no upcoming laundry bookings.</p>
              )}
            </div>
          </section>

          <section className={card}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-500" /> My tasks
            </h3>
            <div className="space-y-3 text-sm">
              {tasks.length ? (
                tasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-gray-200 p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{t.title}</p>
                      <p className="text-xs text-gray-500">Due {t.dueDate || "—"}</p>
                    </div>
                    {t.completed ? (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 text-amber-700 text-xs px-2 py-1">Pending</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No tasks assigned to you yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={card}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-500" /> Split summary
            </h3>
            <div className="space-y-2 text-sm">
              {groupBalances.map(({ group, value }) => (
                <div
                  key={group.id}
                  className="rounded-xl border border-gray-200 p-3 flex items-center justify-between"
                >
                  <span className="font-medium text-gray-700">{group.name}</span>
                  <span className={value >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {value >= 0 ? "+" : ""}
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={card}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Notifications & theme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-500">Task & laundry notifications</label>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl bg-gray-100 px-3 py-2 text-xs"
                    onClick={() => setNotificationPrefs(profileUserId, { tasks: true, laundry: true })}
                  >
                    Enable
                  </button>
                  <button
                    className="rounded-xl bg-gray-100 px-3 py-2 text-xs"
                    onClick={() => setNotificationPrefs(profileUserId, { tasks: false, laundry: false })}
                  >
                    Disable
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Theme preference</label>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl bg-gray-100 px-3 py-2 text-xs flex items-center gap-1"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-3 h-3" /> Light
                  </button>
                  <button
                    className="rounded-xl bg-gray-100 px-3 py-2 text-xs flex items-center gap-1"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-3 h-3" /> Dark
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              Preferences apply only to your account and will sync the next time you sign in.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
