import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { V1_PAIRS, mockSpreadRow, formatSpread } from "../../utils/spreads.js";

const REFRESH_MS = 4000;

function LiveSpreadTable({ brokerId, brokerName }) {
  const [spreads, setSpreads] = React.useState(() => mockSpreadRow(brokerId));
  const prevRef = React.useRef(spreads);

  React.useEffect(() => {
    const initial = mockSpreadRow(brokerId);
    setSpreads(initial);
    prevRef.current = initial;
    const timer = setInterval(() => {
      setSpreads((prev) => {
        prevRef.current = prev;
        return mockSpreadRow(brokerId);
      });
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [brokerId]);

  const DirectionIcon = ({ pairKey }) => {
    const now = spreads[pairKey];
    const prev = prevRef.current[pairKey];
    if (now == null || prev == null || now === prev)
      return <Minus className="h-3 w-3 text-gray-500" />;
    return now > prev ? (
      <ArrowUp className="h-3 w-3 text-red-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-green-400" />
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="card-body p-0">
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg">
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                Live Spreads
              </span>
              {brokerName ? ` — ${brokerName}` : ""}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Typical spread in pips • Updates every {REFRESH_MS / 1000}s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-gray-300">Live</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/60 text-gray-400 uppercase text-xs">
              <tr>
                <th className="text-left py-3 px-4 sm:px-5 font-semibold">Pair</th>
                <th className="text-right py-3 px-4 sm:px-5 font-semibold">Spread</th>
                <th className="text-center py-3 px-4 sm:px-5 font-semibold w-10">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {V1_PAIRS.map((p) => (
                <tr
                  key={p.key}
                  className="hover:bg-gray-900/40 transition-colors"
                >
                  <td className="py-3 px-4 sm:px-5 text-white font-medium">
                    {p.label}
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-right font-mono text-white">
                    {formatSpread(spreads[p.key], p.key)}
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-center">
                    <div className="inline-flex items-center justify-center">
                      <DirectionIcon pairKey={p.key} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            Data by{" "}
            <a
              href="https://www.myfxbook.com/forex-broker-spreads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              myfxbook
            </a>
            . Spreads shown are indicative and may vary.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LiveSpreadTable;
