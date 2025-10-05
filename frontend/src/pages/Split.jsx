"use client";

import React, { useState } from "react";
import { 
  DollarSign, User, PlusCircle, FileText, Search, Download, 
  Trash2, Users, Settings, X 
} from "lucide-react";

const Split = () => {
  const [view, setView] = useState("expenses"); // "expenses" or "groups"
  const [expenses, setExpenses] = useState([
    { 
      id: 1, 
      date: "10/5/2025",
      title: "Weekly groceries", 
      amount: 120.00, 
      paidBy: "Ayman",
      paidById: "ayman",
      splitType: "Equal",
      splits: [
        { userId: "md-salman", name: "Md Salman Farse", amount: 30.00 },
        { userId: "anan", name: "Anan", amount: 30.00 },
        { userId: "ayman", name: "Ayman", amount: 30.00 },
        { userId: "yeaz", name: "Yeaz", amount: 30.00 }
      ]
    }
  ]);

  const roommates = [
    { id: "md-salman", name: "Md Salman Farse", avatar: "🏠" },
    { id: "ayman", name: "Ayman", avatar: "👤" },
    { id: "anan", name: "Anan", avatar: "👨" },
    { id: "yeaz", name: "Yeaz", avatar: "☕" }
  ];

  const [newExpense, setNewExpense] = useState({
    paidBy: "",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    currency: "USD",
    splitType: "Equal"
  });

  // Calculate balances
  const calculateBalances = () => {
    const balances = {};
    roommates.forEach(rm => {
      balances[rm.id] = 0;
    });

    expenses.forEach(expense => {
      // Person who paid gets credited
      balances[expense.paidById] += expense.amount;
      
      // Everyone who owes gets debited
      expense.splits.forEach(split => {
        balances[split.userId] -= split.amount;
      });
    });

    return balances;
  };

  // Calculate simplified debts
  const calculateSimplifiedDebts = () => {
    const balances = calculateBalances();
    const debts = [];

    // Find who owes and who is owed
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance > 0.01) {
        creditors.push({ userId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ userId, amount: Math.abs(balance) });
      }
    });

    // Simplify debts
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.amount, debtor.amount);

      debts.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: amount
      });

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount === 0) i++;
      if (debtor.amount === 0) j++;
    }

    return debts;
  };

  const balances = calculateBalances();
  const simplifiedDebts = calculateSimplifiedDebts();
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalOwed = Object.values(balances).reduce((sum, bal) => sum + (bal < 0 ? Math.abs(bal) : 0), 0);

  const handleAddExpense = () => {
    if (!newExpense.paidBy || !newExpense.amount || !newExpense.description) return;

    const amount = parseFloat(newExpense.amount);
    const perPersonAmount = amount / roommates.length;

    const expense = {
      id: Date.now(),
      date: new Date(newExpense.date).toLocaleDateString('en-US'),
      title: newExpense.description,
      amount: amount,
      paidBy: roommates.find(r => r.id === newExpense.paidBy)?.name || "",
      paidById: newExpense.paidBy,
      splitType: newExpense.splitType,
      splits: roommates.map(rm => ({
        userId: rm.id,
        name: rm.name,
        amount: perPersonAmount
      }))
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({
      paidBy: "",
      amount: "",
      description: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
      currency: "USD",
      splitType: "Equal"
    });
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const getRoommateName = (userId) => {
    return roommates.find(r => r.id === userId)?.name || userId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 p-6 pb-24">
      {/* Header */}
      <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Splitwise Companion</h1>
              <p className="text-sm text-gray-600 mt-0.5">Keep shared costs organised with simple tools and clear balances.</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-gray-700 font-medium">1 groups</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 font-medium">{roommates.length} members</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700 font-medium">{expenses.length} expenses</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
              <DollarSign className="w-4 h-4 text-pink-600" />
              <span className="text-gray-900 font-bold">${totalSpending.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Groups */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span>Groups</span>
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Roommates</p>
                  <p className="text-xs text-gray-600 mt-0.5">Default split Equal</p>
                </div>
                <div className="px-2.5 py-1 bg-white/70 rounded-lg">
                  <span className="text-xs font-semibold text-blue-600">{roommates.length} members</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <span>Create Group</span>
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Group name"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />
              <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all">
                <option>Roommates</option>
              </select>
              <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200">
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Group Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Roommates</h2>
                <p className="text-sm text-gray-500">Roommates • Default split Equal</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <User className="w-4 h-4" />
                  {roommates.length} members
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  <FileText className="w-4 h-4" />
                  {expenses.length} expenses
                </span>
                <span className="flex items-center gap-1 text-purple-600 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  ${totalSpending.toFixed(2)} total
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Members */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Members
                </h3>
                <div className="space-y-2">
                  {roommates.map(rm => (
                    <div key={rm.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/30 p-3 rounded-xl hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rm.avatar}</span>
                        <span className="text-sm font-medium">{rm.name}</span>
                      </div>
                      <button className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Everyone is already added</p>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </h3>
                <div className="space-y-3">
                  <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white">
                    <option>USD</option>
                  </select>
                  <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white">
                    <option>Equal</option>
                  </select>
                  <select className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white">
                    <option>Members</option>
                  </select>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200">
                      Save settings
                    </button>
                    <button className="px-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold text-sm transition-all">
                      Delete group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              Add expense
              <span className="ml-auto text-xs font-normal text-gray-500">Split by Equal</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <select
                value={newExpense.paidBy}
                onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white"
              >
                <option value="">Paid by...</option>
                {roommates.map(rm => (
                  <option key={rm.id} value={rm.id}>{rm.name}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />

              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                placeholder="Category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />

              <select
                value={newExpense.splitType}
                onChange={(e) => setNewExpense({ ...newExpense, splitType: e.target.value })}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              >
                <option>Equal</option>
              </select>
            </div>

            <div className="mb-3">
              <select
                value={newExpense.currency}
                onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-white"
              >
                <option>USD</option>
              </select>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-emerald-700 font-medium">✨ Split evenly across {roommates.length} participants</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddExpense}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200"
              >
                Save expense
              </button>
              <button className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all">
                Queue offline
              </button>
            </div>
          </div>

          {/* Expense History */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Expense history
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses"
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <button className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {expenses.map(expense => (
                <div key={expense.id} className="bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">{expense.date}</p>
                      <h4 className="text-base font-semibold text-gray-900">{expense.title}</h4>
                      <p className="text-xs text-gray-600">
                        {expense.paidBy} paid ${expense.amount.toFixed(2)} • {expense.splitType}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 border-2 border-blue-500 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-all">
                        Convert
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="px-4 py-1.5 border-2 border-red-500 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-all"
                      >
                        Delete
                      </button>
                      <button className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/30 transition-all">
                        Pay
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {expense.splits.map(split => (
                      <div key={split.userId} className="flex items-center justify-between py-1">
                        <span className="flex items-center gap-2 text-gray-700">
                          <span>{roommates.find(r => r.id === split.userId)?.avatar}</span>
                          <span>{split.name}</span>
                        </span>
                        <span className="font-medium text-gray-900">${split.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balances and Simplified Debts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Balances */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                Balances
              </h3>
              <div className="space-y-2">
                {roommates.map(rm => {
                  const balance = balances[rm.id] || 0;
                  return (
                    <div key={rm.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700">{rm.name}</span>
                      <span className={`text-sm font-semibold ${balance < 0 ? 'text-red-600' : balance > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {balance < 0 ? '-' : balance > 0 ? '+' : ''}${Math.abs(balance).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simplified Debts */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-600" />
                Simplified debts
              </h3>
              <div className="space-y-2">
                {simplifiedDebts.map((debt, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">
                      {getRoommateName(debt.from)} → {getRoommateName(debt.to)}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ${debt.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {simplifiedDebts.length === 0 && (
                  <p className="text-sm text-gray-500 italic">All settled up!</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quick summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total tracked spending</p>
                <p className="text-2xl font-bold text-gray-900">${totalSpending.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Offline queue</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Outstanding owed</p>
                <p className="text-2xl font-bold text-gray-900">${totalOwed.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Split;
