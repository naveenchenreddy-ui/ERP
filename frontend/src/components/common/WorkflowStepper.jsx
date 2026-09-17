import React from 'react';
import { FileText, FileSpreadsheet, ShoppingCart, Boxes, Truck, Check } from 'lucide-react';

const steps = [
  { id: 'enquiry', label: '1. Enquiry', icon: FileText },
  { id: 'quotation', label: '2. Quotation', icon: FileSpreadsheet },
  { id: 'order', label: '3. Sales Order', icon: ShoppingCart },
  { id: 'reservation', label: '4. Stock Reserved', icon: Boxes },
  { id: 'dispatch', label: '5. Dispatch', icon: Truck },
];

/**
 * currentStep: 'enquiry' | 'quotation' | 'order' | 'reservation' | 'dispatch'
 * status: optional status for coloring (e.g., 'CANCELLED', 'REJECTED')
 */
export default function WorkflowStepper({ currentStep = 'enquiry', status = null }) {
  const stepIndexMap = {
    enquiry: 0,
    quotation: 1,
    order: 2,
    reservation: 3,
    dispatch: 4,
  };

  const currentIdx = stepIndexMap[currentStep] ?? 0;
  const isCancelled = status === 'CANCELLED' || status === 'REJECTED' || status === 'LOST';

  return (
    <div className="w-full py-3 px-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Workflow Pipeline Tracker
      </div>
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          let circleStyle = 'bg-slate-100 text-slate-400 border-slate-200';
          let labelStyle = 'text-slate-400';

          if (isCancelled && isCurrent) {
            circleStyle = 'bg-rose-50 text-rose-600 border-rose-400 ring-2 ring-rose-200';
            labelStyle = 'text-rose-600 font-semibold';
          } else if (isCompleted) {
            circleStyle = 'bg-emerald-600 text-white border-emerald-600';
            labelStyle = 'text-emerald-700 font-medium';
          } else if (isCurrent) {
            circleStyle = 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 shadow-sm';
            labelStyle = 'text-indigo-700 font-bold';
          }

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${circleStyle}`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`mt-1.5 text-xs text-center transition-colors ${labelStyle}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
