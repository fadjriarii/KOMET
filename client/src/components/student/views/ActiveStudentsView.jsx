import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = {
  primary: '#006192',
  pieColors: ['#006192', '#0d9488', '#d97706', '#6b5778', '#e11d48', '#4f46e5'],
  jenjangColors: ['#006192', '#d97706'],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = label || item.name;
  const value = item.value;
  const percentage = item.payload?.percentage;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Jumlah:{' '}
        <span className="font-bold text-primary">
          {Number(value).toLocaleString('en-US')}
        </span>{' '}
        Mahasiswa
        {percentage && (
          <span className="ml-1 text-[11px] font-medium text-outline">
            ({percentage})
          </span>
        )}
      </p>
    </div>
  );
};

export const ActiveStudentsView = ({
  activeStudents,
  prodiData,
  facultyData,
  jenjangData,
}) => {
  return (
    <div className="space-y-6">
      {/* Ringkasan Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Populasi Mahasiswa Aktif
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Distribusi seluruh mahasiswa dengan status keaktifan "Aktif" di lingkungan akademik
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Data disinkronkan secara ketat memfilter hanya record mahasiswa berstatus aktif.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">
            Total Mahasiswa Aktif
          </div>
          <div className="font-metric-display text-2xl font-extrabold text-primary">
            {activeStudents.length.toLocaleString('en-US')}
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-0.5">100% Terverifikasi</div>
        </div>
      </div>

      {/* Visualisasi 1: Bar Chart Mahasiswa Aktif per Program Studi */}
      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Distribusi per Program Studi
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Jumlah mahasiswa aktif pada masing-masing Program Studi
            </p>
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">
            {prodiData.length} Program Studi
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prodiData}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 130 }}
            >
              <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#6f7882' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill={COLORS.primary}
                radius={[0, 4, 4, 0]}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Baris 2 Kolom untuk Visualisasi Fakultas dan Jenjang */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visualisasi 2: Bar Chart Mahasiswa Aktif per Fakultas */}
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              Distribusi per Fakultas
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Komparasi jumlah mahasiswa aktif antar Fakultas
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={facultyData}
                margin={{ top: 12, right: 12, bottom: 20, left: -10 }}
              >
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#6f7882' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6f7882' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
                  {facultyData.map((entry, index) => (
                    <Cell
                      key={`faculty-cell-${index}`}
                      fill={COLORS.pieColors[index % COLORS.pieColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visualisasi 3: Donut/Pie Chart Jenjang Sarjana vs Magister */}
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="mb-3">
            <h4 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              Distribusi Jenjang Pendidikan
            </h4>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Proporsi jenjang pendidikan Sarjana (S1) vs Magister (S2)
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jenjangData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  isAnimationActive
                >
                  {jenjangData.map((entry, index) => (
                    <Cell
                      key={`jenjang-cell-${index}`}
                      fill={COLORS.jenjangColors[index % COLORS.jenjangColors.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-xs font-medium text-on-surface">
                      {value}: <span className="font-bold">{entry.payload?.count}</span> ({entry.payload?.percentage})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
