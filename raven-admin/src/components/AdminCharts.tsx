import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { Complaint, Shuttle, Driver } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const GRID = 'rgba(255, 255, 255, 0.06)';
const TICK = '#9ca3af';
const LEGEND = '#9ca3af';

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: LEGEND, boxWidth: 12, padding: 16 },
    },
  },
  scales: {
    x: {
      ticks: { color: TICK, maxRotation: 45, minRotation: 0 },
      grid: { color: GRID },
    },
    y: {
      ticks: { color: TICK },
      grid: { color: GRID },
      beginAtZero: true,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: LEGEND, boxWidth: 12, padding: 14 },
    },
  },
  cutout: '62%',
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children }) => (
  <div className="p-5 rounded-2xl bg-[#111215] border border-gray-800 flex flex-col">
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="h-[220px]">{children}</div>
  </div>
);

interface AdminChartsProps {
  drivers: Driver[];
  complaints: Complaint[];
  shuttles: Shuttle[];
  layout?: 'overview' | 'drivers' | 'complaints' | 'shuttles';
}

export const AdminCharts: React.FC<AdminChartsProps> = ({
  drivers,
  complaints,
  shuttles,
  layout = 'overview',
}) => {
  const approvedDrivers = drivers.filter(d => d.isVerified && d.isApproved).length;
  const needsVerification = drivers.filter(d => !d.isVerified).length;
  const needsApproval = drivers.filter(d => d.isVerified && !d.isApproved).length;

  const driverAuthData = useMemo(() => ({
    labels: ['Approved', 'Needs verification', 'Needs approval'],
    datasets: [{
      data: [approvedDrivers, needsVerification, needsApproval],
      backgroundColor: ['#10b981', '#f59e0b', '#f97316'],
      borderColor: ['#111215', '#111215', '#111215'],
      borderWidth: 2,
    }],
  }), [approvedDrivers, needsVerification, needsApproval]);

  const complaintData = useMemo(() => {
    const pending = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    return {
      labels: ['Open', 'Resolved'],
      datasets: [{
        data: [pending, resolved],
        backgroundColor: ['#ef4444', '#6b7280'],
        borderColor: ['#111215', '#111215'],
        borderWidth: 2,
      }],
    };
  }, [complaints]);

  const fleetData = useMemo(() => {
    const shuttle = drivers.filter(d => d.vehicleType === 'shuttle').length;
    const keke = drivers.filter(d => d.vehicleType === 'keke').length;
    const bike = drivers.filter(d => d.vehicleType === 'bike').length;
    return {
      labels: ['Shuttle', 'Keke', 'Bike'],
      datasets: [{
        label: 'Drivers',
        data: [shuttle, keke, bike],
        backgroundColor: ['#2563eb', '#eab308', '#8b5cf6'],
        borderRadius: 6,
      }],
    };
  }, [drivers]);

  const occupancyData = useMemo(() => {
    const labels = shuttles.map(s => s.shuttleCode);
    const booked = shuttles.map(s => s.bookedSeats.length);
    const available = shuttles.map(s => s.totalSeats - s.bookedSeats.length);
    return {
      labels,
      datasets: [
        {
          label: 'Booked',
          data: booked,
          backgroundColor: '#2563eb',
          borderRadius: 4,
        },
        {
          label: 'Available',
          data: available,
          backgroundColor: '#374151',
          borderRadius: 4,
        },
      ],
    };
  }, [shuttles]);

  const revenueData = useMemo(() => ({
    labels: shuttles.map(s => s.shuttleCode),
    datasets: [{
      label: 'Est. revenue (₦)',
      data: shuttles.map(s => s.bookedSeats.length * s.pricePerSeat),
      backgroundColor: '#0891b2',
      borderRadius: 6,
    }],
  }), [shuttles]);

  if (layout === 'drivers') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Authorization status" subtitle="Driver approval pipeline">
          <Doughnut data={driverAuthData} options={doughnutOptions} />
        </ChartCard>
        <ChartCard title="Fleet by vehicle type" subtitle="Registered drivers">
          <Bar data={fleetData} options={barOptions} />
        </ChartCard>
      </div>
    );
  }

  if (layout === 'complaints') {
    return (
      <ChartCard title="Complaint status" subtitle="Open vs resolved">
        <Doughnut data={complaintData} options={doughnutOptions} />
      </ChartCard>
    );
  }

  if (layout === 'shuttles') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Seat occupancy" subtitle="Booked vs available per route">
          <Bar data={occupancyData} options={{ ...barOptions, scales: { ...barOptions.scales, x: { ...barOptions.scales.x, stacked: true }, y: { ...barOptions.scales.y, stacked: true } } }} />
        </ChartCard>
        <ChartCard title="Revenue by route" subtitle="Based on booked seats">
          <Bar data={revenueData} options={barOptions} />
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Analytics</h3>
        <p className="text-xs text-gray-500 mt-0.5">Live fleet and operations snapshot</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="Driver authorization" subtitle={`${drivers.length} total drivers`}>
          <Doughnut data={driverAuthData} options={doughnutOptions} />
        </ChartCard>
        <ChartCard title="Complaints" subtitle={`${complaints.length} total reports`}>
          <Doughnut data={complaintData} options={doughnutOptions} />
        </ChartCard>
        <ChartCard title="Fleet breakdown" subtitle="By vehicle type">
          <Bar data={fleetData} options={barOptions} />
        </ChartCard>
        <ChartCard title="Shuttle occupancy" subtitle={`${shuttles.length} active routes`}>
          {shuttles.length > 0 ? (
            <Bar
              data={occupancyData}
              options={{
                ...barOptions,
                scales: {
                  ...barOptions.scales,
                  x: { ...barOptions.scales.x, stacked: true },
                  y: { ...barOptions.scales.y, stacked: true },
                },
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              No shuttle routes yet
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};