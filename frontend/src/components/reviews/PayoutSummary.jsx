import React from "react";
import { DollarSign, TrendingUp, Calendar, User } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function mockPayouts(firmId, count = 8) {
  let h = 0;
  const s = String(firmId || "unknown");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const now = new Date();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.abs(h + i * 977) % 1000;
    const amount = 1500 + (seed * 47) % 45000;
    const daysAgo = (i * 3) + (seed % 5);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const initials = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"][seed % 10];
    rows.push({
      id: `${firmId}-${i}`,
      traderName: `Trader ${initials}${String(seed % 100).padStart(2, "0")}`,
      amount,
      currency: "USD",
      payoutDate: date,
    });
  }
  return rows;
}

function formatMoney(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function PayoutSummary({ firmId, firmName }) {
  const payouts = React.useMemo(() => mockPayouts(firmId, 8), [firmId]);
  const total = payouts.reduce((sum, p) => sum + p.amount, 0);
  const avg = total / payouts.length;
  const last30 = payouts.filter((p) => (Date.now() - p.payoutDate.getTime()) / (24 * 60 * 60 * 1000) < 30).length;

  return (
    <div className="card overflow-hidden">
      <div className="card-body p-0">
        <div className="p-4 sm:p-5 border-b border-gray-800">
          <h3 className="font-display font-bold text-base sm:text-lg mb-1">
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Recent Payouts
            </span>
            {firmName ? ` — ${firmName}` : ""}
          </h3>
          <p className="text-xs text-gray-400">
            Reported by traders and firm partners
          </p>
        </div>

        <div className="grid grid-cols-3 border-b border-gray-800">
          <div className="p-4 sm:p-5 text-center border-r border-gray-800">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1 flex items-center justify-center gap-1">
              <DollarSign className="h-3 w-3" /> Total
            </div>
            <div className="text-white font-bold text-lg sm:text-xl">
              {formatMoney(total)}
            </div>
          </div>
          <div className="p-4 sm:p-5 text-center border-r border-gray-800">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Avg
            </div>
            <div className="text-white font-bold text-lg sm:text-xl">
              {formatMoney(avg)}
            </div>
          </div>
          <div className="p-4 sm:p-5 text-center">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-1 flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" /> 30d
            </div>
            <div className="text-white font-bold text-lg sm:text-xl">
              {last30}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-gray-400 uppercase text-xs">
              <tr>
                <th className="text-left py-3 px-4 sm:px-5 font-semibold">Trader</th>
                <th className="text-right py-3 px-4 sm:px-5 font-semibold">Amount</th>
                <th className="text-right py-3 px-4 sm:px-5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="py-3 px-4 sm:px-5 text-white flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300">
                      <User className="h-3 w-3" />
                    </div>
                    <span>{p.traderName}</span>
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-right font-mono font-semibold text-green-400">
                    {formatMoney(p.amount)}
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-right text-gray-400">
                    {formatDate(p.payoutDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            Sample data · Real payouts will appear here once the firm shares data with us.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PayoutSummary;
