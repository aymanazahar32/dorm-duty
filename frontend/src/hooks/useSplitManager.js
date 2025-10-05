import { useCallback, useMemo, useState } from "react";

const makeId = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const defaultUsers = [
  {
    id: "u-salman",
    name: "Md Salman Farse",
    email: "salmanfarse2021@gmail.com",
    nickname: "Salman",
    room: "Timber Brook 110",
    status: "Available for chores today",
    avatar: "🧑\u200d💻",
    bio: "CS student, loves clean code and clean kitchens.",
    aura: 25,
    schedule: null,
  },
  {
    id: "u-ayman",
    name: "Ayman",
    email: "ayman@example.com",
    nickname: "Ay",
    room: "101A",
    status: "Busy until 6pm",
    avatar: "⚽",
    bio: "Into soccer and weekend hikes.",
    aura: 20,
    schedule: null,
  },
  {
    id: "u-anan",
    name: "Anan",
    email: "anan@example.com",
    nickname: "Ann",
    room: "102B",
    status: "Free this evening",
    avatar: "🎧",
    bio: "Music enthusiast and night owl.",
    aura: 15,
    schedule: null,
  },
  {
    id: "u-yeaz",
    name: "Yeaz",
    email: "yeaz@example.com",
    nickname: "YZ",
    room: "102B",
    status: "Laundry day",
    avatar: "📚",
    bio: "Book lover, coffee powered.",
    aura: 18,
    schedule: null,
  },
];

const baseGroup = {
  id: "g-roommates",
  name: "Roommates",
  type: "Roommates",
  ownerId: "u-salman",
  members: ["u-salman", "u-ayman", "u-anan", "u-yeaz"],
  settings: {
    defaultSplitType: "Equal",
    currency: "USD",
    privacy: "Members",
  },
  coverPhoto: null,
};

const initialExpenses = [
  {
    id: "exp-1",
    groupId: baseGroup.id,
    payerId: "u-ayman",
    totalAmount: 120,
    description: "Weekly groceries",
    date: new Date().toISOString(),
    splitType: "Equal",
    currency: "USD",
    details: {
      participants: baseGroup.members,
      category: "Groceries",
    },
    splits: {
      "u-salman": 30,
      "u-ayman": 30,
      "u-anan": 30,
      "u-yeaz": 30,
    },
    receipts: [],
  },
];

const initialRecurring = [
  {
    id: "rec-1",
    groupId: baseGroup.id,
    payerId: "u-salman",
    amount: 800,
    frequency: "Monthly",
    splitType: "Equal",
    details: {
      participants: baseGroup.members,
      category: "Rent",
    },
    active: true,
    createdAt: new Date().toISOString(),
  },
];

const initialPayments = [
  {
    id: "pay-1",
    groupId: baseGroup.id,
    payerId: "u-anan",
    payeeId: "u-ayman",
    amount: 30,
    method: "Zelle",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
];

const initialState = {
  users: defaultUsers,
  groups: [baseGroup],
  expenses: initialExpenses,
  recurringExpenses: initialRecurring,
  payments: initialPayments,
  notifications: [],
  activityLog: [],
  preferences: {
    adFreeUsers: new Set(),
    languages: {},
    notifications: {}, // { [userId]: { tasks: true, laundry: true } }
    theme: "light",
  },
  bankAccounts: {
    // Pre-fill Salman payment contact
    "u-salman": {
      zelle: "+1 682 121 1112",
      stripe: "https://dashboard.stripe.com/pay/test-checkout",
    },
  },
  offlineQueue: [],
  uploads: {
    profileImages: {},
    groupCovers: {},
  },
};

const currencyRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  AUD: 1.5,
  INR: 83,
  BDT: 109,
};

const clonePreferences = (prefs) => ({
  adFreeUsers: new Set(prefs.adFreeUsers),
  languages: { ...prefs.languages },
});

export const useSplitManager = () => {
  const [state, setState] = useState(() => ({
    ...initialState,
    activityLog: [
      {
        id: makeId("log"),
        type: "init",
        message: "Split manager initialized",
        timestamp: new Date().toISOString(),
      },
    ],
  }));

  const updateState = useCallback((updater) => {
    setState((prev) => {
      const next = updater(prev);
      return next ?? prev;
    });
  }, []);

  const appendActivity = useCallback((prevLog, entry) => [entry, ...prevLog].slice(0, 200), []);

  const ensureUser = useCallback((users, userId) => {
    const existing = users.find((u) => u.id === userId);
    if (existing) return { users, user: existing };
    const fallbackUser = { id: userId, name: userId, email: "" };
    return { users: [...users, fallbackUser], user: fallbackUser };
  }, []);

  const addUser = useCallback((user) => {
    const id = user.id || makeId("u");
    const created = {
      id,
      name: user.name || id,
      email: user.email || "",
      nickname: user.nickname || "",
      room: user.room || "",
      status: user.status || "",
      avatar: user.avatar || "",
      bio: user.bio || "",
      aura: Number.isFinite(user.aura) ? user.aura : 0,
      schedule: user.schedule || null,
    };
    updateState((prev) => ({ ...prev, users: [...prev.users, created] }));
    return id;
  }, [updateState]);

  const updateUser = useCallback((userId, patch) => {
    updateState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    }));
  }, [updateState]);

  const calculateSplits = useCallback((group, totalAmount, splitType, details = {}) => {
    const participants = (details.participants && details.participants.length ? details.participants : group.members) || [];
    if (!participants.length) return {};
    const amount = Number(totalAmount) || 0;
    const splits = {};

    const assignRemainder = (values, target) => {
      const diff = roundMoney(target - values.reduce((sum, val) => roundMoney(sum + val), 0));
      if (!diff) return values;
      const adjusted = [...values];
      adjusted[adjusted.length - 1] = roundMoney(adjusted[adjusted.length - 1] + diff);
      return adjusted;
    };

    switch (splitType) {
      case "Specific Amount": {
        const specific = details.amounts || details.specificAmounts || {};
        let runningTotal = 0;
        participants.forEach((pid) => {
          const value = Number(specific[pid] ?? 0);
          splits[pid] = roundMoney(value);
          runningTotal += splits[pid];
        });
        if (roundMoney(runningTotal) !== roundMoney(amount)) {
          const diff = roundMoney(amount - runningTotal);
          const last = participants[participants.length - 1];
          splits[last] = roundMoney((splits[last] || 0) + diff);
        }
        break;
      }
      case "Percentage": {
        const percentages = details.percentages || {};
        let runningTotal = 0;
        participants.forEach((pid) => {
          const pct = Number(percentages[pid] ?? 0) / 100;
          const value = roundMoney(amount * pct);
          splits[pid] = value;
          runningTotal += value;
        });
        if (roundMoney(runningTotal) !== roundMoney(amount)) {
          const diff = roundMoney(amount - runningTotal);
          const last = participants[participants.length - 1];
          splits[last] = roundMoney((splits[last] || 0) + diff);
        }
        break;
      }
      case "Shares": {
        const shares = details.shares || {};
        const totalShares = participants.reduce((sum, pid) => sum + Number(shares[pid] ?? 1), 0) || participants.length;
        let runningTotal = 0;
        participants.forEach((pid) => {
          const shareCount = Number(shares[pid] ?? 1);
          const value = roundMoney((amount * shareCount) / totalShares);
          splits[pid] = value;
          runningTotal += value;
        });
        if (roundMoney(runningTotal) !== roundMoney(amount)) {
          const diff = roundMoney(amount - runningTotal);
          const last = participants[participants.length - 1];
          splits[last] = roundMoney((splits[last] || 0) + diff);
        }
        break;
      }
      case "Itemized": {
        const items = details.items || [];
        participants.forEach((pid) => {
          splits[pid] = 0;
        });
        items.forEach((item) => {
          const itemAmount = Number(item.amount || 0);
          const itemParticipants = item.participants && item.participants.length ? item.participants : participants;
          if (!itemParticipants.length) return;
          const baseShares = itemParticipants.map(() =>
            itemParticipants.length ? roundMoney(itemAmount / itemParticipants.length) : 0
          );
          const adjustedShares = assignRemainder(baseShares, itemAmount);
          itemParticipants.forEach((pid, index) => {
            splits[pid] = roundMoney((splits[pid] || 0) + adjustedShares[index]);
          });
        });
        break;
      }
      case "Equal":
      default: {
        const baseShare = participants.length ? amount / participants.length : 0;
        const shares = participants.map(() => roundMoney(baseShare));
        const adjustedShares = assignRemainder(shares, amount);
        participants.forEach((pid, index) => {
          splits[pid] = adjustedShares[index];
        });
        break;
      }
    }

    return splits;
  }, []);

  const createGroup = useCallback((userId, groupName, groupType) => {
    const groupId = makeId("grp");
    const timestamp = new Date().toISOString();
    let createdGroup = null;

    updateState((prev) => {
      const { users: updatedUsers } = ensureUser(prev.users, userId);
      const newGroup = {
        id: groupId,
        name: groupName,
        type: groupType,
        ownerId: userId,
        members: Array.from(new Set([userId])),
        settings: {
          defaultSplitType: "Equal",
          currency: "USD",
          privacy: "Members",
        },
        coverPhoto: null,
      };
      createdGroup = newGroup;
      return {
        ...prev,
        users: updatedUsers,
        groups: [...prev.groups, newGroup],
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "group_created",
          message: `${groupName} group created`,
          timestamp,
          groupId,
          userId,
        }),
      };
    });

    return createdGroup;
  }, [appendActivity, ensureUser, updateState]);

  const addGroupMember = useCallback((groupId, memberId) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const { users: usersWithMember, user } = ensureUser(prev.users, memberId);
      if (group.members.includes(memberId)) return { ...prev, users: usersWithMember };
      const updatedGroups = prev.groups.map((g) =>
        g.id === groupId ? { ...g, members: [...g.members, memberId] } : g
      );
      return {
        ...prev,
        users: usersWithMember,
        groups: updatedGroups,
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "member_added",
          message: `${user.name || memberId} joined ${group.name}`,
          timestamp,
          groupId,
          userId: memberId,
        }),
      };
    });
  }, [appendActivity, ensureUser, updateState]);

  const removeGroupMember = useCallback((groupId, memberId) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      if (!group.members.includes(memberId)) return prev;
      const updatedGroups = prev.groups.map((g) =>
        g.id === groupId ? { ...g, members: g.members.filter((mid) => mid !== memberId) } : g
      );
      const updatedExpenses = prev.expenses.map((expense) => {
        if (expense.groupId !== groupId) return expense;
        if (!expense.splits || !(memberId in expense.splits)) return expense;
        const { [memberId]: _removed, ...restSplits } = expense.splits;
        return { ...expense, splits: restSplits };
      });
      return {
        ...prev,
        groups: updatedGroups,
        expenses: updatedExpenses,
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "member_removed",
          message: `${memberId} removed from ${group.name}`,
          timestamp,
          groupId,
          userId: memberId,
        }),
      };
    });
  }, [appendActivity, updateState]);

  const updateGroupSettings = useCallback((groupId, settings) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const updatedGroups = prev.groups.map((g) =>
        g.id === groupId ? { ...g, settings: { ...g.settings, ...settings } } : g
      );
      return {
        ...prev,
        groups: updatedGroups,
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "group_settings",
          message: `${group.name} settings updated`,
          timestamp,
          groupId,
        }),
      };
    });
  }, [appendActivity, updateState]);

  const getGroupMembers = useCallback((groupId) => {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return [];
    return group.members
      .map((memberId) => state.users.find((u) => u.id === memberId) || { id: memberId, name: memberId })
      .filter(Boolean);
  }, [state.groups, state.users]);

  const deleteGroup = useCallback((groupId) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const remainingGroups = prev.groups.filter((g) => g.id !== groupId);
      const remainingExpenses = prev.expenses.filter((expense) => expense.groupId !== groupId);
      const remainingRecurring = prev.recurringExpenses.filter((rec) => rec.groupId !== groupId);
      const remainingPayments = prev.payments.filter((pay) => pay.groupId !== groupId);
      return {
        ...prev,
        groups: remainingGroups,
        expenses: remainingExpenses,
        recurringExpenses: remainingRecurring,
        payments: remainingPayments,
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "group_deleted",
          message: `${group.name} deleted`,
          timestamp,
          groupId,
        }),
      };
    });
  }, [appendActivity, updateState]);

  const getUserGroups = useCallback((userId) => state.groups.filter((group) => group.members.includes(userId)), [state.groups]);

  const addExpense = useCallback((groupId, payerId, totalAmount, description, date, splitType, details = {}) => {
    const expenseId = makeId("exp");
    const timestamp = date || new Date().toISOString();
    let createdExpense = null;

    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const { users: usersWithPayer } = ensureUser(prev.users, payerId);
      const splits = calculateSplits(group, totalAmount, splitType, details);
      const expense = {
        id: expenseId,
        groupId,
        payerId,
        totalAmount: roundMoney(totalAmount),
        description,
        date: timestamp,
        splitType,
        details,
        currency: details.currency || group.settings.currency || "USD",
        splits,
        receipts: [],
      };
      createdExpense = expense;
      return {
        ...prev,
        users: usersWithPayer,
        expenses: [...prev.expenses, expense],
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "expense_added",
          message: `${description} added to ${group.name}`,
          timestamp: new Date().toISOString(),
          groupId,
          userId: payerId,
        }),
      };
    });

    return createdExpense;
  }, [appendActivity, calculateSplits, ensureUser, updateState]);

  const updateExpense = useCallback((expenseId, updatedData) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const expense = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expense) return prev;
      const group = prev.groups.find((g) => g.id === expense.groupId);
      if (!group) return prev;
      const merged = { ...expense, ...updatedData };
      const splits = calculateSplits(group, merged.totalAmount, merged.splitType, merged.details);
      const updatedExpenses = prev.expenses.map((exp) =>
        exp.id === expenseId ? { ...merged, totalAmount: roundMoney(merged.totalAmount), splits } : exp
      );
      return {
        ...prev,
        expenses: updatedExpenses,
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "expense_updated",
          message: `${merged.description} updated`,
          timestamp,
          groupId: group.id,
        }),
      };
    });
  }, [appendActivity, calculateSplits, updateState]);

  const deleteExpense = useCallback((expenseId) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const expense = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expense) return prev;
      return {
        ...prev,
        expenses: prev.expenses.filter((exp) => exp.id !== expenseId),
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "expense_deleted",
          message: `${expense.description} removed`,
          timestamp,
          groupId: expense.groupId,
        }),
      };
    });
  }, [appendActivity, updateState]);

  const getGroupExpenses = useCallback((groupId) => state.expenses.filter((expense) => expense.groupId === groupId), [state.expenses]);

  const getUserExpenses = useCallback((userId) =>
    state.expenses.filter((expense) => expense.payerId === userId || (expense.splits && expense.splits[userId])), [state.expenses]);

  const attachReceipt = useCallback((expenseId, file) => {
    updateState((prev) => {
      const expense = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expense) return prev;
      const receiptEntry = {
        id: makeId("receipt"),
        name: file?.name || "receipt",
        uploadedAt: new Date().toISOString(),
        meta: {
          size: file?.size || null,
          type: file?.type || null,
        },
      };
      const updatedExpenses = prev.expenses.map((exp) =>
        exp.id === expenseId ? { ...exp, receipts: [...(exp.receipts || []), receiptEntry] } : exp
      );
      return {
        ...prev,
        expenses: updatedExpenses,
      };
    });
  }, [updateState]);

  const currencyConversion = useCallback((amount, fromCurrency, toCurrency) => {
    const fromRate = currencyRates[fromCurrency] ?? 1;
    const toRate = currencyRates[toCurrency] ?? 1;
    return roundMoney((Number(amount) / fromRate) * toRate);
  }, []);

  const calculateBalances = useCallback((groupId) => {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return {};
    const balances = {};
    group.members.forEach((memberId) => {
      balances[memberId] = 0;
    });

    state.expenses
      .filter((expense) => expense.groupId === groupId)
      .forEach((expense) => {
        balances[expense.payerId] = roundMoney((balances[expense.payerId] || 0) + Number(expense.totalAmount || 0));
        Object.entries(expense.splits || {}).forEach(([memberId, value]) => {
          balances[memberId] = roundMoney((balances[memberId] || 0) - Number(value || 0));
        });
      });

    state.payments
      .filter((payment) => payment.groupId === groupId)
      .forEach((payment) => {
        balances[payment.payerId] = roundMoney((balances[payment.payerId] || 0) - Number(payment.amount || 0));
        balances[payment.payeeId] = roundMoney((balances[payment.payeeId] || 0) + Number(payment.amount || 0));
      });

    return balances;
  }, [state.expenses, state.groups, state.payments]);

  const simplifyDebts = useCallback((groupId) => {
    const balances = calculateBalances(groupId);
    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance < -0.01) {
        debtors.push({ userId, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ userId, amount: balance });
      }
    });

    const settlements = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const paid = Math.min(debtor.amount, creditor.amount);
      settlements.push({ from: debtor.userId, to: creditor.userId, amount: roundMoney(paid) });
      debtor.amount = roundMoney(debtor.amount - paid);
      creditor.amount = roundMoney(creditor.amount - paid);
      if (debtor.amount <= 0.01) i += 1;
      if (creditor.amount <= 0.01) j += 1;
    }

    return settlements;
  }, [calculateBalances]);

  const recordPayment = useCallback((payerId, payeeId, amount, method, groupId = null) => {
    const paymentId = makeId("pay");
    const createdAt = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { id: paymentId, payerId, payeeId, amount: roundMoney(amount), method, groupId, status: "completed", createdAt },
      ],
      activityLog: appendActivity(prev.activityLog, {
        id: makeId("log"),
        type: "payment_recorded",
        message: `${payerId} paid ${payeeId}`,
        timestamp: createdAt,
        groupId,
      }),
    }));
    return paymentId;
  }, [appendActivity, updateState]);

  const getUserBalance = useCallback((userId) => {
    return state.groups.reduce((total, group) => {
      if (!group.members.includes(userId)) return total;
      const balances = calculateBalances(group.id);
      return roundMoney(total + (balances[userId] || 0));
    }, 0);
  }, [calculateBalances, state.groups]);

  const getGroupBalance = useCallback((groupId) => calculateBalances(groupId), [calculateBalances]);

  const sendReminder = useCallback((userId, message) => {
    updateState((prev) => ({
      ...prev,
      notifications: [
        ...prev.notifications,
        {
          id: makeId("notify"),
          userId,
          message,
          createdAt: new Date().toISOString(),
          type: "reminder",
        },
      ],
    }));
  }, [updateState]);

  const notifyGroup = useCallback((groupId, message) => {
    const timestamp = new Date().toISOString();
    updateState((prev) => {
      const group = prev.groups.find((g) => g.id === groupId);
      if (!group) return prev;
      const notifications = group.members.map((memberId) => ({
        id: makeId("notify"),
        userId: memberId,
        message,
        createdAt: timestamp,
        type: "group",
        groupId,
      }));
      return {
        ...prev,
        notifications: [...prev.notifications, ...notifications],
        activityLog: appendActivity(prev.activityLog, {
          id: makeId("log"),
          type: "group_notification",
          message: `${group.name} notified`,
          timestamp,
          groupId,
        }),
      };
    });
  }, [appendActivity, updateState]);

  const getActivityFeed = useCallback((userId = null) => {
    if (!userId) return state.activityLog;
    return state.activityLog.filter((entry) => entry.userId === userId || !entry.userId);
  }, [state.activityLog]);

  const createRecurringExpense = useCallback((groupId, payerId, amount, frequency, splitType, details = {}) => {
    const recurringId = makeId("rec");
    const createdAt = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      recurringExpenses: [
        ...prev.recurringExpenses,
        {
          id: recurringId,
          groupId,
          payerId,
          amount: roundMoney(amount),
          frequency,
          splitType,
          details,
          active: true,
          createdAt,
        },
      ],
      activityLog: appendActivity(prev.activityLog, {
        id: makeId("log"),
        type: "recurring_added",
        message: `Recurring ${details.category || "expense"} added`,
        timestamp: createdAt,
        groupId,
      }),
    }));
    return recurringId;
  }, [appendActivity, updateState]);

  const updateRecurringExpense = useCallback((expenseId, data) => {
    const updatedAt = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((rec) =>
        rec.id === expenseId ? { ...rec, ...data } : rec
      ),
      activityLog: appendActivity(prev.activityLog, {
        id: makeId("log"),
        type: "recurring_updated",
        message: `Recurring expense updated`,
        timestamp: updatedAt,
      }),
    }));
  }, [appendActivity, updateState]);

  const deleteRecurringExpense = useCallback((expenseId) => {
    updateState((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter((rec) => rec.id !== expenseId),
      activityLog: appendActivity(prev.activityLog, {
        id: makeId("log"),
        type: "recurring_deleted",
        message: `Recurring expense removed`,
        timestamp: new Date().toISOString(),
      }),
    }));
  }, [appendActivity, updateState]);

  const getRecurringExpenses = useCallback((groupId) =>
    state.recurringExpenses.filter((rec) => rec.groupId === groupId), [state.recurringExpenses]);

  const generateSpendingReport = useCallback((userId, groupId, startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const entries = state.expenses.filter((expense) => {
      if (groupId && expense.groupId !== groupId) return false;
      if (userId && expense.payerId !== userId && !(expense.splits && expense.splits[userId])) return false;
      const expenseDate = new Date(expense.date);
      if (start && expenseDate < start) return false;
      if (end && expenseDate > end) return false;
      return true;
    });
    const total = entries.reduce((sum, exp) => sum + Number(exp.totalAmount || 0), 0);
    const byCategory = entries.reduce((acc, exp) => {
      const key = exp.details?.category || "Uncategorized";
      acc[key] = roundMoney((acc[key] || 0) + Number(exp.totalAmount || 0));
      return acc;
    }, {});
    const byPayer = entries.reduce((acc, exp) => {
      acc[exp.payerId] = roundMoney((acc[exp.payerId] || 0) + Number(exp.totalAmount || 0));
      return acc;
    }, {});
    return {
      total: roundMoney(total),
      count: entries.length,
      byCategory,
      byPayer,
      entries,
    };
  }, [state.expenses]);

  const getCategoryWiseExpense = useCallback((userId, groupId) => {
    const report = generateSpendingReport(userId, groupId);
    return report.byCategory;
  }, [generateSpendingReport]);

  const exportExpensesCSV = useCallback((userId, groupId) => {
    const report = generateSpendingReport(userId, groupId);
    const headers = ["Expense ID", "Group", "Payer", "Amount", "Description", "Date", "Category"];
    const rows = report.entries.map((exp) => [
      exp.id,
      exp.groupId,
      exp.payerId,
      exp.totalAmount,
      exp.description,
      exp.date,
      exp.details?.category || "Uncategorized",
    ]);
    return [headers, ...rows]
      .map((row) => row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","))
      .join("\n");
  }, [generateSpendingReport]);

  const scanReceipt = useCallback(async (file) => {
    let text = "";
    if (file?.text) {
      text = await file.text();
    } else if (file?.content) {
      text = String(file.content);
    }
    const lines = text.split(/\n|\r/).map((line) => line.trim()).filter(Boolean);
    const items = [];
    const itemPattern = /(.*?)(\d+[.,]?\d*)$/;
    lines.forEach((line) => {
      const match = line.match(itemPattern);
      if (match) {
        const name = match[1].trim();
        const amount = parseFloat(match[2].replace(/,/g, ""));
        if (name && !Number.isNaN(amount)) {
          items.push({ id: makeId("item"), name, amount });
        }
      }
    });
    return items;
  }, []);

  const setDefaultSplit = useCallback((groupId, splitType) => {
    updateState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              settings: { ...group.settings, defaultSplitType: splitType },
            }
          : group
      ),
    }));
  }, [updateState]);

  const adFreeExperience = useCallback((userId) => {
    updateState((prev) => {
      const preferences = clonePreferences(prev.preferences);
      preferences.adFreeUsers.add(userId);
      return {
        ...prev,
        preferences,
      };
    });
  }, [updateState]);

  const autoCurrencyConversion = useCallback((expenseId, preferredCurrency) => {
    updateState((prev) => {
      const expense = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expense) return prev;
      const convertedTotal = currencyConversion(expense.totalAmount, expense.currency, preferredCurrency);
      const convertedSplits = Object.fromEntries(
        Object.entries(expense.splits || {}).map(([memberId, value]) => [
          memberId,
          currencyConversion(value, expense.currency, preferredCurrency),
        ])
      );
      return {
        ...prev,
        expenses: prev.expenses.map((exp) =>
          exp.id === expenseId
            ? {
                ...exp,
                totalAmount: convertedTotal,
                currency: preferredCurrency,
                splits: convertedSplits,
              }
            : exp
        ),
      };
    });
  }, [currencyConversion, updateState]);

  const expenseSearch = useCallback((userId, keyword) => {
    if (!keyword) return [];
    const query = keyword.toLowerCase();
    return state.expenses.filter((expense) => {
      const matchesKeyword = expense.description.toLowerCase().includes(query);
      const isUserRelated = !userId || expense.payerId === userId || (expense.splits && expense.splits[userId]);
      return matchesKeyword && isUserRelated;
    });
  }, [state.expenses]);

  const linkBankAccount = useCallback((userId, bankInfo = {}) => {
    updateState((prev) => ({
      ...prev,
      bankAccounts: {
        ...prev.bankAccounts,
        [userId]: {
          ...(prev.bankAccounts[userId] || {}),
          zelle: bankInfo?.zelle || "",
          stripe: bankInfo?.stripe || "",
        },
      },
    }));
  }, [updateState]);

  const sendPayment = useCallback((senderId, receiverId, amount, method, metadata = {}) => {
    const paymentId = makeId("pay");
    const createdAt = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          id: paymentId,
          payerId: senderId,
          payeeId: receiverId,
          amount: roundMoney(amount),
          method,
          status: "completed",
          createdAt,
          expenseId: metadata.expenseId || null,
          groupId: metadata.groupId || null,
          receipt: metadata.receipt || null,
        },
      ],
      activityLog: appendActivity(prev.activityLog, {
        id: makeId("log"),
        type: "payment_sent",
        message: `${senderId} paid ${receiverId}`,
        timestamp: createdAt,
      }),
    }));
    return paymentId;
  }, [appendActivity, updateState]);

  const receivePayment = useCallback((receiverId, amount, method) => {
    const paymentId = makeId("pay");
    const createdAt = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      payments: [
        ...prev.payments,
        { id: paymentId, payerId: null, payeeId: receiverId, amount: roundMoney(amount), method, status: "received", createdAt },
      ],
    }));
    return paymentId;
  }, [updateState]);

  const getPaymentHistory = useCallback((userId) => state.payments.filter((payment) => payment.payerId === userId || payment.payeeId === userId), [state.payments]);

  const setTheme = useCallback((theme) => {
    updateState((prev) => ({ ...prev, preferences: { ...prev.preferences, theme } }));
  }, [updateState]);

  const setNotificationPrefs = useCallback((userId, prefs) => {
    updateState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: { ...prev.preferences.notifications, [userId]: { ...(prev.preferences.notifications?.[userId] || {}), ...prefs } },
      },
    }));
  }, [updateState]);

  const uploadProfileImage = useCallback((userId, file) => {
    updateState((prev) => ({
      ...prev,
      uploads: {
        ...prev.uploads,
        profileImages: {
          ...prev.uploads.profileImages,
          [userId]: {
            id: makeId("upload"),
            name: file?.name || "profile",
            uploadedAt: new Date().toISOString(),
          },
        },
      },
    }));
  }, [updateState]);

  const setGroupCoverPhoto = useCallback((groupId, file) => {
    updateState((prev) => ({
      ...prev,
      groups: prev.groups.map((group) =>
        group.id === groupId ? { ...group, coverPhoto: file?.name || null } : group
      ),
      uploads: {
        ...prev.uploads,
        groupCovers: {
          ...prev.uploads.groupCovers,
          [groupId]: {
            id: makeId("upload"),
            name: file?.name || "cover",
            uploadedAt: new Date().toISOString(),
          },
        },
      },
    }));
  }, [updateState]);

  const multiLanguageSupport = useCallback((userId, language) => {
    updateState((prev) => {
      const preferences = clonePreferences(prev.preferences);
      preferences.languages[userId] = language;
      return {
        ...prev,
        preferences,
      };
    });
  }, [updateState]);

  const offlineModeAddExpense = useCallback((expenseData) => {
    updateState((prev) => ({
      ...prev,
      offlineQueue: [
        ...prev.offlineQueue,
        {
          id: makeId("offline"),
          createdAt: new Date().toISOString(),
          data: expenseData,
        },
      ],
    }));
  }, [updateState]);

  const syncOfflineExpenses = useCallback(() => {
    const queued = state.offlineQueue;
    queued.forEach((entry) => {
      const payload = entry.data;
      if (!payload || !payload.groupId) return;
      addExpense(
        payload.groupId,
        payload.payerId,
        payload.totalAmount,
        payload.description,
        payload.date,
        payload.splitType,
        payload.details
      );
    });
    updateState((prev) => ({
      ...prev,
      offlineQueue: [],
    }));
  }, [addExpense, state.offlineQueue, updateState]);

  return useMemo(() => ({
    state,
    addUser,
    updateUser,
    createGroup,
    addGroupMember,
    removeGroupMember,
    updateGroupSettings,
    getGroupMembers,
    deleteGroup,
    getUserGroups,
    addExpense,
    updateExpense,
    deleteExpense,
    getGroupExpenses,
    getUserExpenses,
    attachReceipt,
    currencyConversion,
    calculateBalances,
    simplifyDebts,
    recordPayment,
    getUserBalance,
    getGroupBalance,
    sendReminder,
    notifyGroup,
    getActivityFeed,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    getRecurringExpenses,
    generateSpendingReport,
    getCategoryWiseExpense,
    exportExpensesCSV,
    scanReceipt,
    setDefaultSplit,
    adFreeExperience,
    autoCurrencyConversion,
    expenseSearch,
    linkBankAccount,
    sendPayment,
    receivePayment,
    getPaymentHistory,
    setTheme,
    setNotificationPrefs,
    uploadProfileImage,
    setGroupCoverPhoto,
    multiLanguageSupport,
    offlineModeAddExpense,
    syncOfflineExpenses,
  }), [
    state,
    addUser,
    updateUser,
    createGroup,
    addGroupMember,
    removeGroupMember,
    updateGroupSettings,
    getGroupMembers,
    deleteGroup,
    getUserGroups,
    addExpense,
    updateExpense,
    deleteExpense,
    getGroupExpenses,
    getUserExpenses,
    attachReceipt,
    currencyConversion,
    calculateBalances,
    simplifyDebts,
    recordPayment,
    getUserBalance,
    getGroupBalance,
    sendReminder,
    notifyGroup,
    getActivityFeed,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    getRecurringExpenses,
    generateSpendingReport,
    getCategoryWiseExpense,
    exportExpensesCSV,
    scanReceipt,
    setDefaultSplit,
    adFreeExperience,
    autoCurrencyConversion,
    expenseSearch,
    linkBankAccount,
    sendPayment,
    receivePayment,
    getPaymentHistory,
    setTheme,
    setNotificationPrefs,
    uploadProfileImage,
    setGroupCoverPhoto,
    multiLanguageSupport,
    offlineModeAddExpense,
    syncOfflineExpenses,
  ]);
};
