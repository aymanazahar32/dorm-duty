"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  PlusCircle,
  Settings,
  Trash2,
  UploadCloud,
  Users,
  Wallet,
} from "lucide-react";
import { useSplitManager } from "../hooks/useSplitManager";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const splitTypes = ["Equal", "Specific Amount", "Percentage", "Shares", "Itemized"];
const groupTypes = ["Roommates", "Trip", "Event", "Family", "Friends"];
const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "BDT"];

const textFieldBase =
  "px-4 py-2 border border-gray-200 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400";
const sectionCard =
  "bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition";

const formatCurrency = (value, currency = "USD") => {
  const amount = Number.isFinite(value) ? value : 0;
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

const Split = () => {
  const {
    state,
    createGroup,
    addGroupMember,
    removeGroupMember,
    updateGroupSettings,
    deleteGroup,
    addExpense,
    deleteExpense,
    getGroupExpenses,
    getGroupMembers,
    calculateBalances,
    simplifyDebts,
    exportExpensesCSV,
    expenseSearch,
    sendPayment,
    getPaymentHistory,
    setDefaultSplit,
    autoCurrencyConversion,
    offlineModeAddExpense,
    syncOfflineExpenses,
  } = useSplitManager();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [selectedGroupId, setSelectedGroupId] = useState(() => state.groups[0]?.id || "");

  useEffect(() => {
    if (!state.groups.length) {
      setSelectedGroupId("");
      return;
    }
    if (!selectedGroupId || !state.groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(state.groups[0].id);
    }
  }, [selectedGroupId, state.groups]);

  const selectedGroup = useMemo(
    () => state.groups.find((group) => group.id === selectedGroupId) || null,
    [selectedGroupId, state.groups]
  );

  const loggedInUser = useMemo(() => {
    if (!authUser) return null;
    return state.users.find((u) => u.email === authUser.email) || null;
  }, [authUser, state.users]);

  const defaultUserId = loggedInUser?.id || state.users[0]?.id || "";

  const getDefaultPayerId = useCallback(() => {
    if (selectedGroup?.members?.length) {
      if (defaultUserId && selectedGroup.members.includes(defaultUserId)) return defaultUserId;
      return selectedGroup.members[0];
    }
    return defaultUserId;
  }, [selectedGroup, defaultUserId]);

  const findUserById = (id) => state.users.find((u) => u.id === id);
  const Avatar = ({ userId, name }) => {
    const user = findUserById(userId) || {};
    const avatar = user.avatar;
    const base = "w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-semibold border border-gray-200";
    if (avatar && /^(https?:|data:)/.test(avatar)) {
      return <img src={avatar} alt={name || user.name || ""} className={`${base}`} />;
    }
    const content = avatar || (name || user.name || "?").charAt(0);
    return <span className={`${base} bg-gray-100 text-gray-600`}>{content}</span>;
  };

  const groupMembers = useMemo(
    () => (selectedGroup ? getGroupMembers(selectedGroup.id) : []),
    [getGroupMembers, selectedGroup]
  );

  const groupExpenses = useMemo(
    () => (selectedGroup ? getGroupExpenses(selectedGroup.id) : []),
    [getGroupExpenses, selectedGroup]
  );

  const balances = useMemo(
    () => (selectedGroup ? calculateBalances(selectedGroup.id) : {}),
    [calculateBalances, selectedGroup]
  );

  const simplifiedDebts = useMemo(
    () => (selectedGroup ? simplifyDebts(selectedGroup.id) : []),
    [simplifyDebts, selectedGroup]
  );

  const [groupForm, setGroupForm] = useState({
    ownerId: state.users[0]?.id || "",
    name: "",
    type: groupTypes[0],
  });

  const [settingsForm, setSettingsForm] = useState({
    currency: selectedGroup?.settings?.currency || "USD",
    defaultSplitType: selectedGroup?.settings?.defaultSplitType || "Equal",
    privacy: selectedGroup?.settings?.privacy || "Members",
  });

  useEffect(() => {
    setSettingsForm({
      currency: selectedGroup?.settings?.currency || "USD",
      defaultSplitType: selectedGroup?.settings?.defaultSplitType || "Equal",
      privacy: selectedGroup?.settings?.privacy || "Members",
    });
  }, [selectedGroup]);

  const createDetailMaps = (members, fillValue) => {
    const map = {};
    members.forEach((memberId) => {
      map[memberId] = fillValue;
    });
    return map;
  };

  const buildExpenseDetails = (group) => {
    const members = group?.members || [];
    return {
      participants: members,
      amounts: createDetailMaps(members, "0"),
      percentages: createDetailMaps(members, "0"),
      shares: createDetailMaps(members, "0"),
      items: [],
      category: "",
      currency: group?.settings?.currency || "USD",
    };
  };

  const [expenseForm, setExpenseForm] = useState(() => ({
    payerId: selectedGroup?.members?.[0] || state.users[0]?.id || "",
    totalAmount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    splitType: selectedGroup?.settings?.defaultSplitType || "Equal",
    details: buildExpenseDetails(selectedGroup),
  }));

  useEffect(() => {
    setExpenseForm({
      payerId: selectedGroup?.members?.[0] || state.users[0]?.id || "",
      totalAmount: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      splitType: selectedGroup?.settings?.defaultSplitType || "Equal",
      details: buildExpenseDetails(selectedGroup),
    });
  }, [selectedGroup, state.users]);

  const [memberInput, setMemberInput] = useState("");

  useEffect(() => {
    const available = selectedGroup
      ? state.users.filter((user) => !selectedGroup.members.includes(user.id))
      : state.users;
    if (available.length) {
      setMemberInput((prev) => (available.some((user) => user.id === prev) ? prev : available[0].id));
    } else {
      setMemberInput("");
    }
  }, [selectedGroup, state.users]);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [csvPreview, setCsvPreview] = useState("");
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  const handleAddExpense = () => {
    if (!selectedGroup) return;
    if (!expenseForm.payerId || !expenseForm.totalAmount || !expenseForm.description) return;
    const payloadDetails = {
      ...expenseForm.details,
      participants: expenseForm.details.participants.length
        ? expenseForm.details.participants
        : selectedGroup.members,
    };
    addExpense(
      selectedGroup.id,
      expenseForm.payerId,
      parseFloat(expenseForm.totalAmount),
      expenseForm.description,
      expenseForm.date,
      expenseForm.splitType,
      payloadDetails
    );
    setExpenseForm((prev) => ({
      ...prev,
      totalAmount: "",
      description: "",
      details: buildExpenseDetails(selectedGroup),
    }));
  };

  const handleOfflineQueue = () => {
    if (!selectedGroup || !expenseForm.totalAmount || !expenseForm.description) return;
    offlineModeAddExpense({
      groupId: selectedGroup.id,
      payerId: expenseForm.payerId,
      totalAmount: parseFloat(expenseForm.totalAmount),
      description: expenseForm.description,
      date: expenseForm.date,
      splitType: expenseForm.splitType,
      details: expenseForm.details,
    });
    setIsOfflineQueued(true);
  };

  const handleSyncOffline = async () => {
    setIsSyncingOffline(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    syncOfflineExpenses();
    setIsSyncingOffline(false);
    setIsOfflineQueued(false);
  };

  const expensePayments = useMemo(() => {
    const map = new Map();
    (state.payments || []).forEach((payment) => {
      if (!payment.expenseId) return;
      if (!map.has(payment.expenseId)) map.set(payment.expenseId, []);
      map.get(payment.expenseId).push(payment);
    });
    return map;
  }, [state.payments]);


  const amountOwedForMember = useCallback((expense, memberId) => {
    const base = Number(expense.splits?.[memberId] || 0);
    const payments = expensePayments.get(expense.id) || [];
    const paid = payments
      .filter((p) => p.payerId === memberId && p.payeeId === expense.payerId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return Math.max(0, base - paid);
  }, [expensePayments]);

  const [paymentForms, setPaymentForms] = useState({});

  const handleReceiptUpload = useCallback((expenseId, file) => {
    if (!file) {
      setPaymentForms((prev) => ({
        ...prev,
        [expenseId]: { ...(prev[expenseId] || {}), receipt: null },
      }));
      return;
    }
    if (!/^image\//.test(file.type) && file.type !== "application/pdf") {
      alert("Upload a PDF or image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentForms((prev) => ({
        ...prev,
        [expenseId]: { ...(prev[expenseId] || {}), receipt: { name: file.name, dataUrl: reader.result } },
      }));
    };
    reader.onerror = () => alert("Failed to read receipt file.");
    reader.readAsDataURL(file);
  }, [setPaymentForms]);

  const paymentMethods = ["Zelle", "Stripe / Google Pay"];
  const togglePayment = useCallback((expenseId) => {
    setPaymentForms((prev) => ({
      ...prev,
      [expenseId]: prev[expenseId]
        ? { ...prev[expenseId], open: !prev[expenseId].open }
        : {
            open: true,
            payerId: getDefaultPayerId(),
            method: "Zelle",
            receipt: null,
          },
    }));
  }, [getDefaultPayerId]);

  const handleGenerateCsv = () => {
    if (!selectedGroup) return;
    const csv = exportExpensesCSV(null, selectedGroup.id);
    setCsvPreview(csv);
  };

  const searchedExpenses = useMemo(() => {
    if (!searchKeyword) return [];
    return expenseSearch(null, searchKeyword);
  }, [expenseSearch, searchKeyword]);

  const totalGroupSpend = useMemo(() => {
    if (!selectedGroup) return 0;
    return groupExpenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);
  }, [groupExpenses, selectedGroup]);

  const userBalances = useMemo(
    () => Object.entries(balances).map(([userId, value]) => ({ userId, value })),
    [balances]
  );

  const outstandingAmount = useMemo(
    () =>
      userBalances
        .filter(({ value }) => value < 0)
        .reduce((sum, { value }) => sum + Math.abs(value), 0),
    [userBalances]
  );

  const participantsCount = expenseForm.details.participants.length
    ? expenseForm.details.participants.length
    : selectedGroup?.members?.length || 0;

  const equalShare = useMemo(() => {
    if (!expenseForm.totalAmount || expenseForm.splitType !== "Equal" || !participantsCount) return null;
    const amount = Number(expenseForm.totalAmount);
    if (!Number.isFinite(amount)) return null;
    return amount / participantsCount;
  }, [expenseForm.totalAmount, expenseForm.splitType, participantsCount]);

  const percentageTotal = useMemo(() => {
    if (expenseForm.splitType !== "Percentage") return null;
    return Object.values(expenseForm.details.percentages || {}).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
  }, [expenseForm.details.percentages, expenseForm.splitType]);

  const totalShares = useMemo(() => {
    if (expenseForm.splitType !== "Shares") return null;
    return Object.values(expenseForm.details.shares || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [expenseForm.details.shares, expenseForm.splitType]);

  const handleUpdateDetail = (updater) => {
    setExpenseForm((prev) => ({
      ...prev,
      details: updater(prev.details),
    }));
  };

  const canSaveExpense = Boolean(
    selectedGroup && expenseForm.payerId && expenseForm.totalAmount && expenseForm.description
  );

  const canQueueOffline = Boolean(
    selectedGroup && expenseForm.payerId && expenseForm.totalAmount && expenseForm.description
  );

  const totalExpenses = state.expenses.reduce((sum, expense) => sum + Number(expense.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-24 flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-10 h-10 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Splitwise Companion</h1>
            <p className="text-sm text-gray-500">Keep shared costs organised with simple tools and clear balances.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-500" />
            {state.groups.length} groups
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            {state.users.length} members
          </div>
          <div className="flex items-center gap-1">
            <ListChecks className="w-4 h-4 text-blue-500" />
            {state.expenses.length} expenses
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className={`${sectionCard} p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Wallet className="w-5 h-5 text-emerald-500" />
                Groups
              </h2>
              <span className="text-xs text-gray-500">{state.groups.length}</span>
            </div>
            {state.groups.length ? (
              <div className="flex flex-col gap-2">
                {state.groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedGroupId === group.id
                        ? "border-blue-400 bg-blue-50/80"
                        : "border-transparent bg-white/60 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.type}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">{group.members.length} members</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No groups yet. Create one below.</p>
            )}
          </div>

          <div className={`${sectionCard} p-5 space-y-3`}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <PlusCircle className="w-4 h-4" />
              Create Group
            </h3>
            <select
              className={textFieldBase}
              value={groupForm.ownerId}
              onChange={(event) => setGroupForm((prev) => ({ ...prev, ownerId: event.target.value }))}
            >
              <option value="">Select owner</option>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <input
              className={textFieldBase}
              placeholder="Group name"
              value={groupForm.name}
              onChange={(event) => setGroupForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <select
              className={textFieldBase}
              value={groupForm.type}
              onChange={(event) => setGroupForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              {groupTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!groupForm.name || !groupForm.ownerId) return;
                const group = createGroup(groupForm.ownerId, groupForm.name, groupForm.type);
                if (group) {
                  setGroupForm({ ownerId: groupForm.ownerId, name: "", type: groupTypes[0] });
                  setSelectedGroupId(group.id);
                }
              }}
              className="w-full rounded-xl bg-blue-500 px-4 py-2 text-white font-medium hover:bg-blue-600 transition"
            >
              Create
            </button>
          </div>
        </aside>

        <main className="space-y-6">
          {selectedGroup ? (
            <>
              <div className={`${sectionCard} p-6 space-y-4`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedGroup.type} • Default split {selectedGroup.settings.defaultSplitType}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                      <Users className="w-3 h-3" /> {selectedGroup.members.length} members
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                      <ListChecks className="w-3 h-3" /> {groupExpenses.length} expenses
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-purple-600">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(totalGroupSpend, selectedGroup.settings.currency)} total
                    </span>
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2`}>
                <div className={`${sectionCard} p-5 space-y-3`}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="w-4 h-4 text-blue-500" /> Members
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {groupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                      >
                        <Avatar userId={member.id} name={member.name} />
                        <span>{member.name}</span>
                        <button
                          className="text-red-500"
                          onClick={() => removeGroupMember(selectedGroup.id, member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!groupMembers.length && <p className="text-xs text-gray-500">No members yet.</p>}
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <select
                      className={textFieldBase}
                      value={memberInput}
                      onChange={(event) => setMemberInput(event.target.value)}
                    >
                      {state.users
                        .filter((user) => !selectedGroup.members.includes(user.id))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      {!state.users.filter((user) => !selectedGroup.members.includes(user.id)).length && (
                        <option value="">Everyone is already added</option>
                      )}
                    </select>
                    <button
                      disabled={!memberInput}
                      onClick={() => memberInput && addGroupMember(selectedGroup.id, memberInput)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        memberInput
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className={`${sectionCard} p-5 space-y-3`}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Settings className="w-4 h-4 text-blue-500" /> Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      className={textFieldBase}
                      value={settingsForm.currency}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, currency: event.target.value }))}
                    >
                      {currencyOptions.map((currency) => (
                        <option key={currency}>{currency}</option>
                      ))}
                    </select>
                    <select
                      className={textFieldBase}
                      value={settingsForm.defaultSplitType}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, defaultSplitType: event.target.value }))}
                    >
                      {splitTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                    <select
                      className={textFieldBase}
                      value={settingsForm.privacy}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, privacy: event.target.value }))}
                    >
                      {['Members', 'Friends', 'Private'].map((privacy) => (
                        <option key={privacy}>{privacy}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition"
                      onClick={() => {
                        updateGroupSettings(selectedGroup.id, settingsForm);
                        setDefaultSplit(selectedGroup.id, settingsForm.defaultSplitType);
                      }}
                    >
                      Save settings
                    </button>
                    <button
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                      onClick={() => deleteGroup(selectedGroup.id)}
                    >
                      Delete group
                    </button>
                  </div>
                </div>
              </div>

              <div className={`${sectionCard} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <PlusCircle className="w-5 h-5 text-blue-500" /> Add expense
                  </h3>
                  <span className="text-xs text-gray-500">Split by {expenseForm.splitType}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    className={textFieldBase}
                    value={expenseForm.payerId}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({ ...prev, payerId: event.target.value }))
                    }
                  >
                    {selectedGroup.members.map((memberId) => (
                      <option key={memberId} value={memberId}>
                        {groupMembers.find((member) => member.id === memberId)?.name || memberId}
                      </option>
                    ))}
                  </select>
                  <input
                    className={textFieldBase}
                    type="number"
                    min="0"
                    placeholder="Amount"
                    value={expenseForm.totalAmount}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({ ...prev, totalAmount: event.target.value }))
                    }
                  />
                  <input
                    className={textFieldBase}
                    placeholder="Description"
                    value={expenseForm.description}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                  <input
                    className={textFieldBase}
                    type="date"
                    value={expenseForm.date}
                    onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
                  />
                  <input
                    className={textFieldBase}
                    placeholder="Category"
                    value={expenseForm.details.category || ""}
                    onChange={(event) =>
                      handleUpdateDetail((details) => ({ ...details, category: event.target.value }))
                    }
                  />
                  <select
                    className={textFieldBase}
                    value={expenseForm.splitType}
                    onChange={(event) =>
                      setExpenseForm((prev) => ({
                        ...prev,
                        splitType: event.target.value,
                        details: {
                          ...prev.details,
                          amounts: createDetailMaps(prev.details.participants, "0"),
                          percentages: createDetailMaps(prev.details.participants, "0"),
                          shares: createDetailMaps(prev.details.participants, "0"),
                        },
                      }))
                    }
                  >
                    {splitTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    className={textFieldBase}
                    value={expenseForm.details.currency}
                    onChange={(event) =>
                      handleUpdateDetail((details) => ({ ...details, currency: event.target.value }))
                    }
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                {expenseForm.splitType === "Equal" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    Split evenly across {participantsCount} participant{participantsCount === 1 ? "" : "s"}
                    {equalShare
                      ? ` • Each owes ${formatCurrency(equalShare, expenseForm.details.currency)}`
                      : ""}
                  </div>
                )}

                {expenseForm.splitType === "Specific Amount" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Enter specific amounts</p>
                    {selectedGroup.members.map((memberId) => (
                      <label
                        key={memberId}
                        className="flex items-center justify-between gap-2 text-sm text-gray-600"
                      >
                        <span>{groupMembers.find((member) => member.id === memberId)?.name || memberId}</span>
                        <input
                          className={`${textFieldBase} w-28 text-right`}
                          type="number"
                          min="0"
                          value={expenseForm.details.amounts?.[memberId] ?? "0"}
                          onChange={(event) =>
                            handleUpdateDetail((details) => ({
                              ...details,
                              amounts: {
                                ...details.amounts,
                                [memberId]: event.target.value || "0",
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}

                {expenseForm.splitType === "Percentage" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <p className="font-semibold">Percent allocations</p>
                      <span className={percentageTotal === 100 ? "text-emerald-600" : "text-amber-600"}>
                        Total {Number(percentageTotal || 0).toFixed(1)}%
                      </span>
                    </div>
                    {selectedGroup.members.map((memberId) => (
                      <label
                        key={memberId}
                        className="flex items-center justify-between gap-2 text-sm text-gray-600"
                      >
                        <span>{groupMembers.find((member) => member.id === memberId)?.name || memberId}</span>
                        <input
                          className={`${textFieldBase} w-28 text-right`}
                          type="number"
                          min="0"
                          max="100"
                          value={expenseForm.details.percentages?.[memberId] ?? "0"}
                          onChange={(event) =>
                            handleUpdateDetail((details) => ({
                              ...details,
                              percentages: {
                                ...details.percentages,
                                [memberId]: event.target.value || "0",
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}

                {expenseForm.splitType === "Shares" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <p className="font-semibold">Share weights</p>
                      <span className="text-blue-600">Total {Number(totalShares || 0)}</span>
                    </div>
                    {selectedGroup.members.map((memberId) => (
                      <label
                        key={memberId}
                        className="flex items-center justify-between gap-2 text-sm text-gray-600"
                      >
                        <span>{groupMembers.find((member) => member.id === memberId)?.name || memberId}</span>
                        <input
                          className={`${textFieldBase} w-28 text-right`}
                          type="number"
                          min="0"
                          value={expenseForm.details.shares?.[memberId] ?? "0"}
                          onChange={(event) =>
                            handleUpdateDetail((details) => ({
                              ...details,
                              shares: {
                                ...details.shares,
                                [memberId]: event.target.value || "0",
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                )}

                {expenseForm.splitType === "Itemized" && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500">Itemised entries</p>
                    <div className="space-y-2">
                      {(expenseForm.details.items || []).map((item, index) => (
                        <div
                          key={item.id || index}
                          className="rounded-xl border border-gray-200 p-3 space-y-2 text-sm text-gray-600"
                        >
                          <div className="flex gap-2">
                            <input
                              className={`${textFieldBase} flex-1`}
                              placeholder="Item name"
                              value={item.name}
                              onChange={(event) =>
                                handleUpdateDetail((details) => {
                                  const nextItems = details.items.map((entry, idx) =>
                                    idx === index ? { ...entry, name: event.target.value } : entry
                                  );
                                  return { ...details, items: nextItems };
                                })
                              }
                            />
                            <input
                              className={`${textFieldBase} w-24`}
                              type="number"
                              placeholder="Amount"
                              value={item.amount}
                              onChange={(event) =>
                                handleUpdateDetail((details) => {
                                  const nextItems = details.items.map((entry, idx) =>
                                    idx === index ? { ...entry, amount: event.target.value } : entry
                                  );
                                  return { ...details, items: nextItems };
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedGroup.members.map((memberId) => {
                              const selected = item.participants?.includes(memberId);
                              return (
                                <button
                                  key={memberId}
                                  onClick={() =>
                                    handleUpdateDetail((details) => {
                                      const nextItems = details.items.map((entry, idx) => {
                                        if (idx !== index) return entry;
                                        const participants = new Set(entry.participants || []);
                                        if (participants.has(memberId)) {
                                          participants.delete(memberId);
                                        } else {
                                          participants.add(memberId);
                                        }
                                        return { ...entry, participants: Array.from(participants) };
                                      });
                                      return { ...details, items: nextItems };
                                    })
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs transition ${
                                    selected
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                                      : "border-gray-200 bg-white text-gray-500"
                                  }`}
                                >
                                  {groupMembers.find((member) => member.id === memberId)?.name || memberId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateDetail((details) => ({
                          ...details,
                          items: [
                            ...(details.items || []),
                            {
                              id: `item-${Date.now()}`,
                              name: "",
                              amount: "",
                              participants: [...selectedGroup.members],
                            },
                          ],
                        }))
                      }
                      className="rounded-xl border border-dashed border-blue-300 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Add item
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={!canSaveExpense}
                    onClick={handleAddExpense}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition ${
                      canSaveExpense
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Save expense
                  </button>
                  <button
                    disabled={!canQueueOffline}
                    onClick={handleOfflineQueue}
                    className={`flex items-center gap-2 rounded-xl border px-5 py-2 text-sm transition ${
                      canQueueOffline
                        ? "border-gray-200 text-gray-600 hover:bg-gray-100"
                        : "border-gray-100 text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" /> Queue offline
                  </button>
                  {isOfflineQueued && (
                    <button
                      onClick={handleSyncOffline}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-white text-sm font-medium hover:bg-emerald-600"
                    >
                      {isSyncingOffline ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      Sync queued
                    </button>
                  )}
                </div>
              </div>

              <div className={`${sectionCard} p-5 space-y-4`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <FileText className="w-5 h-5 text-blue-500" /> Expense history
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <input
                      className={textFieldBase}
                      placeholder="Search expenses"
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                    <button
                      onClick={handleGenerateCsv}
                      className="rounded-xl border border-blue-300 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {groupExpenses.length ? (
                    groupExpenses.map((expense) => {
                      const paymentsForExpense = expensePayments.get(expense.id) || [];
                      const selectedPayerId = paymentForms[expense.id]?.payerId || getDefaultPayerId();
                      const currentMethod = paymentForms[expense.id]?.method || "Zelle";
                      const isStripe = currentMethod === "Stripe / Google Pay";
                      const payeeContacts = state.bankAccounts?.[expense.payerId] || {};
                      const stripeLink = payeeContacts.stripe;
                      const zelleContact = payeeContacts.zelle;
                      return (
                        <div key={expense.id} className="rounded-2xl border border-gray-200 bg-white/70 p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-sm text-gray-500">
                                {new Date(expense.date).toLocaleDateString()}
                              </p>
                            <h4 className="text-lg font-semibold text-gray-800">{expense.description}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <Avatar userId={expense.payerId} />
                              <span>
                                {groupMembers.find((member) => member.id === expense.payerId)?.name || expense.payerId}
                                {" "}paid {formatCurrency(expense.totalAmount, expense.currency)} • {expense.splitType}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => autoCurrencyConversion(expense.id, selectedGroup.settings.currency || "USD")}
                              className="rounded-xl border border-blue-200 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
                            >
                              Convert
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="rounded-xl border border-red-200 px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => togglePayment(expense.id)}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                paymentForms[expense.id]?.open
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {paymentForms[expense.id]?.open ? 'Close' : 'Pay'}
                            </button>
                          </div>
                        </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          {Object.entries(expense.splits || {}).map(([memberId, amount]) => {
                            const displayName = groupMembers.find((member) => member.id === memberId)?.name || memberId;
                            const owed = amountOwedForMember(expense, memberId);
                            const settled = owed <= 0.001;
                            return (
                              <div
                                key={memberId}
                                className={`flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 ${settled ? 'opacity-60' : ''}`}
                              >
                                <span className={`flex items-center gap-2 ${settled ? 'line-through text-gray-400' : ''}`}>
                                  <Avatar userId={memberId} name={displayName} />
                                  {displayName}
                                </span>
                                <span className={settled ? 'line-through text-gray-400' : ''}>
                                  {formatCurrency(amount, expense.currency)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Payment actions */}
                          <div className="pt-2 border-t border-gray-100">
                          {/* Completed payments badge */}
                          {paymentsForExpense.length > 0 && (
                            <div className="mt-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs px-3 py-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Last payment {new Date(paymentsForExpense[paymentsForExpense.length - 1].createdAt).toLocaleString()}
                            </div>
                          )}

                          {paymentForms[expense.id]?.open && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                              <select
                                className={textFieldBase}
                                value={selectedPayerId}
                                onChange={(e) =>
                                  setPaymentForms((prev) => ({
                                    ...prev,
                                    [expense.id]: {
                                      ...(prev[expense.id] || {}),
                                      open: true,
                                      payerId: e.target.value,
                                      method: prev[expense.id]?.method || "Zelle",
                                    },
                                  }))
                                }
                              >
                                {groupMembers.map((member) => (
                                  <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                              </select>
                              <select
                                className={textFieldBase}
                                value={currentMethod}
                                onChange={(e) =>
                                  setPaymentForms((prev) => ({
                                    ...prev,
                                    [expense.id]: {
                                      ...(prev[expense.id] || {}),
                                      open: true,
                                      payerId: prev[expense.id]?.payerId || getDefaultPayerId(),
                                      method: e.target.value,
                                    },
                                  }))
                                }
                              >
                                {paymentMethods.map((m) => (
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                              <div className="sm:col-span-2 flex items-center text-gray-600">
                                {(() => {
                                  const payerId = selectedPayerId || getDefaultPayerId();
                                  const amt = (() => {
                                    const base = Number(expense.splits?.[payerId] || 0);
                                    const paid = paymentsForExpense
                                      .filter((p) => p.payerId === payerId && p.payeeId === expense.payerId)
                                      .reduce((s, p) => s + Number(p.amount || 0), 0);
                                    return Math.max(0, base - paid);
                                  })();
                                  return <span>Owes <strong>{formatCurrency(amt, expense.currency)}</strong></span>;
                                })()}
                              </div>
                              <div className="sm:col-span-5">
                                <label className="text-[11px] text-gray-500 flex items-center gap-2">Receipt (optional)</label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(event) => handleReceiptUpload(expense.id, event.target.files?.[0] || null)}
                                  className="text-xs"
                                />
                                {paymentForms[expense.id]?.receipt ? (
                                  <p className="text-[11px] text-gray-400 mt-1">Attached: {paymentForms[expense.id]?.receipt?.name}</p>
                                ) : null}
                              </div>
                              {currentMethod === "Zelle" ? (
                                <p className="sm:col-span-5 text-[11px] text-gray-500 mt-1">
                                  {zelleContact ? `Pay via Zelle: ${zelleContact}` : 'No Zelle contact saved yet. Ask them to add it in Profile.'}
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2">
                                {isStripe ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        const payer = selectedPayerId || getDefaultPayerId();
                                        if (!payer) {
                                          alert('Select who is paying.');
                                          return;
                                        }
                                        if (!stripeLink) {
                                          alert('No Stripe / Google Pay link saved yet. Ask them to add it in Profile.');
                                          return;
                                        }
                                        const paidAlready = paymentsForExpense
                                          .filter((p) => p.payerId === payer && p.payeeId === expense.payerId)
                                          .reduce((s, p) => s + Number(p.amount || 0), 0);
                                        const base = Number(expense.splits?.[payer] || 0);
                                        const amount = Math.max(0, base - paidAlready);
                                        if (!amount) {
                                          alert('Nothing owed for this person.');
                                          return;
                                        }
                                        const params = new URLSearchParams({
                                          expenseId: expense.id,
                                          payerId: payer,
                                          payeeId: expense.payerId,
                                          groupId: selectedGroup.id,
                                          amount: amount.toString(),
                                        }).toString();
                                        setPaymentForms((prev) => ({
                                          ...prev,
                                          [expense.id]: { ...(prev[expense.id] || {}), open: false, receipt: null },
                                        }));
                                        navigate(`/stripe-checkout?${params}`);
                                      }}
                                      className="rounded-xl bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
                                    >
                                      Proceed to Stripe checkout
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        const payer = selectedPayerId || getDefaultPayerId();
                                        if (!payer) {
                                          alert('Select who is paying.');
                                          return;
                                        }
                                        const paidAlready = paymentsForExpense
                                          .filter((p) => p.payerId === payer && p.payeeId === expense.payerId)
                                          .reduce((s, p) => s + Number(p.amount || 0), 0);
                                        const base = Number(expense.splits?.[payer] || 0);
                                        const amount = Math.max(0, base - paidAlready);
                                        if (!amount) {
                                          alert('Nothing owed for this person.');
                                          return;
                                        }
                                        sendPayment(payer, expense.payerId, amount, currentMethod, {
                                          expenseId: expense.id,
                                          groupId: selectedGroup.id,
                                          receipt: paymentForms[expense.id]?.receipt || null,
                                        });
                                        setPaymentForms((prev) => ({
                                          ...prev,
                                          [expense.id]: { ...(prev[expense.id] || {}), open: false, receipt: null },
                                        }));
                                      }}
                                      className="rounded-xl bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
                                    >
                                      Mark as paid
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!zelleContact) {
                                          alert('No Zelle contact saved yet. Ask them to add it in Profile.');
                                          return;
                                        }
                                        alert(`Pay them via Zelle: ${zelleContact}`);
                                      }}
                                      className="rounded-xl border border-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-100"
                                    >
                                      View Zelle contact
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {paymentsForExpense.length > 0 && (
                            <div className="mt-3 space-y-2 text-xs text-gray-600">
                              {paymentsForExpense.slice(-3).reverse().map((payment) => {
                                const payerName = groupMembers.find((member) => member.id === payment.payerId)?.name || payment.payerId;
                                const payeeName = groupMembers.find((member) => member.id === payment.payeeId)?.name || payment.payeeId;
                                return (
                                  <div key={payment.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <Avatar userId={payment.payerId} name={payerName} />
                                      <span>{payerName} → {payeeName}</span>
                                    </div>
                                    <div className="text-right text-gray-500">
                                      <p className="font-medium text-gray-700">{formatCurrency(payment.amount, expense.currency)}</p>
                                      <p>{payment.method} • {new Date(payment.createdAt).toLocaleDateString()}</p>
                                      {payment.receipt ? (
                                        <a
                                          href={payment.receipt.dataUrl}
                                          download={payment.receipt.name || 'receipt'}
                                          className="text-xs text-blue-600 hover:underline"
                                        >
                                          Receipt
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No expenses tracked for this group yet.</p>
                  )}
                </div>

                {searchKeyword && (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-4">
                    <h4 className="text-sm font-semibold text-blue-700 mb-2">Search results</h4>
                    {searchedExpenses.length ? (
                      <ul className="space-y-2 text-xs text-gray-600">
                        {searchedExpenses.map((expense) => (
                          <li key={expense.id}>
                            {expense.description} — {formatCurrency(expense.totalAmount, expense.currency)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">No expenses match that keyword.</p>
                    )}
                  </div>
                )}

                {csvPreview && (
                  <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">CSV preview</h4>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-500">
                      {csvPreview}
                    </pre>
                  </div>
                )}
              </div>

              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6`}>
                <div className={`${sectionCard} p-5 space-y-3`}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="w-4 h-4 text-purple-500" /> Balances
                  </h3>
                  <div className="space-y-2 text-sm">
                    {userBalances.length ? (
                      userBalances.map(({ userId, value }) => (
                        <div
                          key={userId}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                        >
                          <span className="font-medium text-gray-600">
                            {groupMembers.find((member) => member.id === userId)?.name || userId}
                          </span>
                          <span className={value >= 0 ? "text-emerald-600" : "text-red-500"}>
                            {formatCurrency(value, selectedGroup.settings.currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No balances available.</p>
                    )}
                  </div>
                </div>

                <div className={`${sectionCard} p-5 space-y-3`}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Layers className="w-4 h-4 text-purple-500" /> Simplified debts
                  </h3>
                  {simplifiedDebts.length ? (
                    <div className="space-y-2 text-sm">
                      {simplifiedDebts.map((item, index) => (
                        <div
                          key={`${item.from}-${item.to}-${index}`}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                        >
                          <span>
                            {groupMembers.find((member) => member.id === item.from)?.name || item.from} →
                            {" "}
                            {groupMembers.find((member) => member.id === item.to)?.name || item.to}
                          </span>
                          <span className="text-emerald-600">
                            {formatCurrency(item.amount, selectedGroup.settings.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Balances are already settled.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={`${sectionCard} p-10 flex flex-col items-center justify-center gap-3 text-gray-500`}>
              <Wallet className="w-10 h-10 text-blue-300" />
              <p>Select a group or create a new one to begin tracking expenses.</p>
            </div>
          )}
        </main>
      </div>

      <div className={`${sectionCard} p-6`}>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
          <ListChecks className="w-5 h-5 text-blue-500" /> Quick summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total tracked spending</p>
            <p className="text-2xl font-semibold text-gray-800">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Offline queue</p>
            <p className="text-2xl font-semibold text-gray-800">{state.offlineQueue.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Outstanding owed</p>
            <p className="text-2xl font-semibold text-gray-800">
              {formatCurrency(outstandingAmount, selectedGroup?.settings?.currency || "USD")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Split;
