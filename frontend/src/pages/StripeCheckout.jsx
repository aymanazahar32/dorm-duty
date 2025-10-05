import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ExternalLink, ArrowLeft, Upload } from "lucide-react";
import { useSplitManager } from "../hooks/useSplitManager";

const card = "max-w-xl mx-auto bg-white/90 backdrop-blur border border-gray-100 rounded-3xl shadow-lg p-6";
const textField = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200";

const StripeCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, sendPayment } = useSplitManager();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const expenseId = params.get("expenseId");
  const payerId = params.get("payerId");
  const payeeId = params.get("payeeId");
  const groupId = params.get("groupId");
  const amount = Number(params.get("amount")) || 0;

  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const payee = useMemo(() => state.users.find((u) => u.id === payeeId) || {}, [state.users, payeeId]);
  const payer = useMemo(() => state.users.find((u) => u.id === payerId) || {}, [state.users, payerId]);
  const payeeContacts = state.bankAccounts[payeeId] || {};
  const stripeLink = payeeContacts.stripe || "";

  const handleUploadReceipt = (file) => {
    if (!file) {
      setReceiptFile(null);
      return;
    }
    if (!/^image\//.test(file.type) && file.type !== "application/pdf") {
      alert("Upload a PDF or image file.");
      return;
    }
    setReceiptFile(file);
  };

  const handleComplete = async () => {
    if (!expenseId || !payerId || !payeeId || !groupId) {
      alert("Missing payment details.");
      return;
    }

    let receiptData = null;
    if (receiptFile) {
      setIsUploading(true);
      receiptData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: receiptFile.name, dataUrl: reader.result });
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(receiptFile);
      });
      setIsUploading(false);
    }

    sendPayment(payerId, payeeId, amount, "Stripe / Google Pay", {
      expenseId,
      groupId,
      receipt: receiptData,
    });

    navigate("/split", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-emerald-100 p-6">
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-sm text-gray-500">Secure Stripe Checkout</span>
      </div>

      <section className={card}>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Pay {payee.name || payeeId}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Amount due <span className="font-semibold text-emerald-600">{`$${amount.toFixed(2)}`}</span>
          </p>
        </header>

        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h2 className="font-semibold text-gray-700">Payer</h2>
            <p>{payer.name || payerId}</p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Payment link</h2>
            {stripeLink ? (
              <button
                onClick={() => window.open(stripeLink, "_blank", "noopener")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-300 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                Open Stripe checkout <ExternalLink className="w-4 h-4" />
              </button>
            ) : (
              <p className="text-xs text-amber-600">Payee has not saved a Stripe link yet. Ask them to add it in their profile.</p>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Upload receipt (optional)</h2>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <Upload className="w-4 h-4" /> PDF or image
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleUploadReceipt(e.target.files?.[0] || null)}
              className={textField}
            />
            {receiptFile && <p className="text-xs text-gray-500 mt-1">Selected: {receiptFile.name}</p>}
          </div>
        </div>

        <footer className="mt-6 flex gap-3">
          <button
            onClick={handleComplete}
            disabled={isUploading || amount <= 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark payment complete
          </button>
        </footer>
      </section>
    </div>
  );
};

export default StripeCheckout;
