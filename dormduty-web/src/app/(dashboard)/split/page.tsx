/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
"use client";

import React, { useState } from "react";
import { DollarSign, User, PlusCircle, CheckCircle2 } from "lucide-react";

const Split = () => {
  const [bills, setBills] = useState([
    { id: 1, title: "Electricity Bill", amount: 60, paidBy: "Salman", splitAmong: 4 },
    { id: 2, title: "Groceries", amount: 100, paidBy: "Ayman", splitAmong: 4 },
    { id: 3, title: "Internet", amount: 40, paidBy: "Anan", splitAmong: 4 },
  ]);

  const [newBill, setNewBill] = useState({ title: "", amount: "", paidBy: "" });
  const roommates = ["Ayman", "Salman", "Anan", "Yeaz"];

  const handleAddBill = () => {
    if (!newBill.title || !newBill.amount || !newBill.paidBy) return;
    setBills([
      ...bills,
      {
        id: Date.now(),
        title: newBill.title,
        amount: parseFloat(newBill.amount),
        paidBy: newBill.paidBy,
        splitAmong: 4,
      },
    ]);
    setNewBill({ title: "", amount: "", paidBy: "" });
  };

  const perPersonShare = (amount, splitAmong) => (amount / splitAmong).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6 pb-24 flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-emerald-500" />
          Split Expenses
        </h1>
        <p className="text-sm text-gray-500 mt-2 sm:mt-0">
          Manage shared bills easily with your roommates.
        </p>
      </header>

      {/* Add Bill Card */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl shadow-md hover:shadow-lg transition p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          Add a New Bill
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Bill title (e.g. Rent)"
            value={newBill.title}
            onChange={(e) =>
              setNewBill({ ...newBill, title: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Amount ($)"
            value={newBill.amount}
            onChange={(e) =>
              setNewBill({ ...newBill, amount: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none"
          />
          <select
            value={newBill.paidBy}
            onChange={(e) =>
              setNewBill({ ...newBill, paidBy: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">Paid by...</option>
            {roommates.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddBill}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-xl transition inline-flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Add Bill
        </button>
      </div>

      {/* Bills List */}
      <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl shadow-md hover:shadow-lg transition p-6 flex-grow">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Recent Expenses
        </h2>

        <ul className="space-y-3">
          {bills.map((bill) => (
            <li
              key={bill.id}
              className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-emerald-50 border border-gray-200 p-4 rounded-2xl hover:shadow-sm transition"
            >
              <div>
                <h3 className="font-semibold text-gray-800">{bill.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="w-4 h-4 text-blue-500" />
                  Paid by
                  <span className="text-blue-600 font-medium">
                    {bill.paidBy}
                  </span>
                  — split among {bill.splitAmong} people
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">
                  ${bill.amount}
                </p>
                <p className="text-sm text-gray-500">
                  Each: ${perPersonShare(bill.amount, bill.splitAmong)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-gray-700 font-medium">
            Total bills:{" "}
            <span className="text-emerald-600 font-semibold">
              ${bills.reduce((sum, b) => sum + b.amount, 0)}
            </span>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Split;
