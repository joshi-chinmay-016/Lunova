import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Sparkles, Edit3, CheckCircle2, FileText, Database } from 'lucide-react';
import { RECENT_ACTIVITIES } from '@/lib/mockData';

export const ActivityFeed: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'edit':
        return <Edit3 className="w-3.5 h-3.5 text-amber-600" />;
      case 'approval':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'ingest':
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'knowledge':
        return <Database className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          <p className="text-[11px] text-gray-500">Real-time proposal audit events</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[#E2E5E9]">
          {RECENT_ACTIVITIES.map((act) => (
            <li key={act.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#EEF0F3] border border-[#E2E5E9] flex items-center justify-center shrink-0 mt-0.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
                {getIcon(act.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900">{act.event}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{act.target}</p>
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">{act.timestamp}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
