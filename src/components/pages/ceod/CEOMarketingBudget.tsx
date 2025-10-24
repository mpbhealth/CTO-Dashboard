import { useState } from 'react';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CEODashboardLayout } from '../../layouts/CEODashboardLayout';

export function CEOMarketingBudget() {
  const [budgetData] = useState([
    { channel: 'Digital Ads', budget: 35000, spent: 28400, roi: 3.2, leads: 1240 },
    { channel: 'Content Marketing', budget: 22000, spent: 18900, roi: 4.1, leads: 890 },
    { channel: 'Email Campaigns', budget: 15000, spent: 12300, roi: 5.8, leads: 720 },
    { channel: 'Events & Webinars', budget: 18000, spent: 14200, roi: 2.9, leads: 450 },
    { channel: 'Partner Marketing', budget: 12000, spent: 8100, roi: 3.7, leads: 380 },
    { channel: 'Social Media', budget: 10000, spent: 7800, roi: 4.5, leads: 560 },
  ]);

  const totalBudget = budgetData.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
  const avgROI = (budgetData.reduce((sum, item) => sum + item.roi, 0) / budgetData.length).toFixed(1);

  return (
    <CEODashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Budget</h1>
            <p className="text-gray-600 mt-1">Track spend and ROI by channel</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Download Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">{Math.round((totalSpent / totalBudget) * 100)}%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Total Budget</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-600">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${(totalBudget - totalSpent).toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Remaining Budget</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-2">
              <ArrowUpRight size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">+18%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{avgROI}x</div>
            <div className="text-sm text-gray-500 mt-1">Average ROI</div>
          </div>
        </div>

        <div className="space-y-4">
          {budgetData.map((item) => {
            const utilization = (item.spent / item.budget) * 100;
            const isEfficient = item.roi > 3.5;
            return (
              <div key={item.channel} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.channel}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.leads} leads generated</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {isEfficient ? (
                        <ArrowUpRight size={16} className="text-green-600" />
                      ) : (
                        <ArrowDownRight size={16} className="text-red-600" />
                      )}
                      <span>ROI</span>
                    </div>
                    <div className={`text-lg font-semibold ${isEfficient ? 'text-green-600' : 'text-yellow-600'}`}>
                      {item.roi}x
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Budget</div>
                    <div className="text-lg font-semibold text-gray-900">${item.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Spent</div>
                    <div className="text-lg font-semibold text-gray-900">${item.spent.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Remaining</div>
                    <div className="text-lg font-semibold text-gray-900">${(item.budget - item.spent).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${utilization > 90 ? 'bg-red-600' : utilization > 75 ? 'bg-yellow-600' : 'bg-green-600'}`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{Math.round(utilization)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CEODashboardLayout>
  );
}
