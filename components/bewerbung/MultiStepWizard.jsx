'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, User, Gamepad2, Heart, Send, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Multi-Step Wizard Komponente
export function MultiStepWizard({ 
  children, 
  currentStep, 
  totalSteps, 
  onStepChange,
  onSubmit,
  canGoNext,
  submitting = false 
}) {
  // children ist jetzt nur der aktuelle Step (da wir in bewerbung/page.js currentStep prüfen)
  // Wir filtern false/null/undefined raus
  const validChildren = Array.isArray(children) 
    ? children.filter(child => child != null && child !== false && child !== true) 
    : (children ? [children] : []);
  
  const CurrentStepComponent = validChildren.length > 0 ? validChildren[0] : null;

  const stepIcons = [
    { icon: User, label: 'Persönliches' },
    { icon: Gamepad2, label: 'Erfahrung' },
    { icon: Heart, label: 'Motivation' },
    { icon: Eye, label: 'Vorschau' }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-4 gap-2">
          {stepIcons.slice(0, totalSteps).map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={index}
                onClick={() => index < currentStep && onStepChange(index)}
                disabled={index > currentStep}
                className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                  index < currentStep ? 'cursor-pointer hover:scale-105' : index > currentStep ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 scale-110' 
                      : isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-white/5 border-2 border-white/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/50'}`} />
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-white' : 'text-white/50'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] animate-in fade-in-50 duration-300">
        {CurrentStepComponent}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/5">
        <Button
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep === 0}
          variant="outline"
          className="flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>

        <div className="text-xs text-white/40">
          Schritt {currentStep + 1} von {totalSteps}
        </div>

        {currentStep < totalSteps - 1 ? (
          <Button
            onClick={() => onStepChange(currentStep + 1)}
            disabled={!canGoNext}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white disabled:opacity-50"
          >
            Weiter
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={submitting || !canGoNext}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Absenden
              </>
            )}
          </Button>
        )}
      </div>

      {/* Auto-Save Indicator */}
      <div className="text-center">
        <p className="text-xs text-white/30">
          <Circle className="w-2 h-2 inline-block mr-1 fill-green-500 text-green-500" />
          Wird automatisch gespeichert
        </p>
      </div>
    </div>
  );
}

// Step Container für bessere Lesbarkeit
export function WizardStep({ title, description, children }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-white/50">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
