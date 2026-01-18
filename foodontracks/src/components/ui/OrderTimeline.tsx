import React from 'react';
import { FileText, CheckCircle, ChefHat, Package, Bike, Truck, PartyPopper, XCircle } from 'lucide-react';

export interface TimelineStep {
  status: string;
  label: string;
  icon: React.ElementType;
  timestamp?: Date | string;
  active: boolean;
  completed: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
  orderTimeline?: {
    orderPlaced?: Date;
    confirmed?: Date;
    preparing?: Date;
    ready?: Date;
    delivered?: Date;
  };
}

export function OrderTimeline({ currentStatus, orderTimeline }: OrderTimelineProps) {
  const statusSteps: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    preparing: 2,
    ready: 3,
    picked_by_delivery: 4,
    out_for_delivery: 5,
    delivered: 6,
    cancelled: -1,
  };

  const currentStep = statusSteps[currentStatus] ?? 0;

  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Placed',
      icon: FileText,
      timestamp: orderTimeline?.orderPlaced,
      active: currentStep === 0,
      completed: currentStep > 0,
    },
    {
      status: 'confirmed',
      label: 'Confirmed',
      icon: CheckCircle,
      timestamp: orderTimeline?.confirmed,
      active: currentStep === 1,
      completed: currentStep > 1,
    },
    {
      status: 'preparing',
      label: 'Preparing',
      icon: ChefHat,
      timestamp: orderTimeline?.preparing,
      active: currentStep === 2,
      completed: currentStep > 2,
    },
    {
      status: 'ready',
      label: 'Ready for Pickup',
      icon: Package,
      timestamp: orderTimeline?.ready,
      active: currentStep === 3,
      completed: currentStep > 3,
    },
    {
      status: 'picked_by_delivery',
      label: 'Picked Up',
      icon: Bike,
      timestamp: undefined,
      active: currentStep === 4,
      completed: currentStep > 4,
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      icon: Truck,
      timestamp: undefined,
      active: currentStep === 5,
      completed: currentStep > 5,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: PartyPopper,
      timestamp: orderTimeline?.delivered,
      active: currentStep === 6,
      completed: currentStep >= 6,
    },
  ];

  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 dark:bg-red-900/20 dark:border-red-800">
        <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Order Cancelled</h3>
            <p className="text-sm">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order Progress</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="bg-gradient-to-b from-yellow-400 to-orange-500 w-full transition-all duration-500"
            style={{
              height: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.status} className="flex items-start gap-4">
                {/* Icon Circle */}
                <div
                  className={`relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.completed
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg scale-110'
                      : step.active
                      ? 'bg-white dark:bg-gray-800 border-4 border-yellow-400 text-yellow-600 shadow-lg scale-110 animate-pulse'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-2 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div
                    className={`font-semibold ${
                      step.completed || step.active
                        ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(step.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
                {step.active && (
                  <div className="mt-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                    ● In Progress
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Estimated Time */}
      {currentStep < 6 && currentStep >= 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⏱️</span>
            <span>
              Estimated delivery:{' '}
              <span className="font-semibold text-gray-900">
                {currentStep < 3 ? '30-45 mins' : currentStep < 5 ? '15-20 mins' : '5-10 mins'}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTimeline;
