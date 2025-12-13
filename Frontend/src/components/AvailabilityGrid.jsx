import React from "react";

export default function AvailabilityGrid({ availability, setAvailability }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periods = [1, 2, 3, 4, 5, 6];

  function toggle(day, period) {
    const dayAvail = availability[day] || [];
    let updated = [...dayAvail];

    if (updated.includes(period)) {
      updated = updated.filter((p) => p !== period);
    } else {
      updated.push(period);
    }

    setAvailability({
      ...availability,
      [day]: updated,
    });
  }

  return (
    <div className="border rounded p-4 overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th></th>
            {periods.map((p) => (
              <th key={p} className="border px-2 py-1 text-sm">
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d}>
              <td className="border px-2 py-1 font-medium">{d}</td>
              {periods.map((p) => {
                const active = availability[d]?.includes(p);
                return (
                  <td
                    key={p}
                    onClick={() => toggle(d, p)}
                    className={`border h-8 cursor-pointer ${
                      active ? "bg-green-400" : "bg-red-200"
                    }`}
                  ></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
