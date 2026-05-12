'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import AppLogo from '@/components/ui/AppLogo';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import {
  GraduationCap, Building2, UtensilsCrossed, Stethoscope,
  Wrench, Dumbbell, Scissors, LayoutGrid,
  CheckCircle, Shield, Zap
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const perks = [
    { id: 'perk-1', icon: Zap, text: '8 industry types supported' },
    { id: 'perk-2', icon: Shield, text: 'GST-compliant billing' },
    { id: 'perk-3', icon: CheckCircle, text: '14-day free trial' },
  ];

  const industryIcons = [
    { id: 'ai-academy', Icon: GraduationCap, color: '#7C3AED', label: 'Academy' },
    { id: 'ai-hotel', Icon: Building2, color: '#0891B2', label: 'Hotel' },
    { id: 'ai-restaurant', Icon: UtensilsCrossed, color: '#EA580C', label: 'Restaurant' },
    { id: 'ai-clinic', Icon: Stethoscope, color: '#10B981', label: 'Clinic' },
    { id: 'ai-service', Icon: Wrench, color: '#F59E0B', label: 'Service' },
    { id: 'ai-gym', Icon: Dumbbell, color: '#EF4444', label: 'Gym' },
    { id: 'ai-salon', Icon: Scissors, color: '#EC4899', label: 'Salon' },
    { id: 'ai-custom', Icon: LayoutGrid, color: '#38BDF8', label: 'Custom' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 gradient-hero flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-border">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full opacity-15 blur-3xl bg-primary pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <AppLogo size={40} />
            <span className="font-800 text-2xl text-foreground">BizManage</span>
          </Link>

          <h2 className="text-3xl xl:text-4xl font-800 text-foreground mb-4 leading-tight">
            Run Any Business From
            <br />
            <span className="gradient-text">One Dashboard</span>
          </h2>
          <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-sm">
            Industry-specific dashboards for Academy, Hotel, Restaurant, Clinic, Service Center, Gym, Salon, and more.
          </p>

          {/* Perks */}
          <div className="space-y-3 mb-12">
            {perks?.map((perk) => (
              <div key={perk?.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <perk.icon size={14} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{perk?.text}</span>
              </div>
            ))}
          </div>

          {/* Industry icons grid */}
          <div className="grid grid-cols-4 gap-3">
            {industryIcons?.map(({ id, Icon, color, label }) => (
              <div
                key={id}
                className="glass-card-light rounded-xl p-3 flex flex-col items-center gap-1.5 text-center"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-2xs text-muted-foreground font-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © {new Date()?.getFullYear()} BizManage · Made in India
        </div>
      </div>
      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-10 overflow-y-auto bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <AppLogo size={32} />
          <span className="font-800 text-xl text-foreground">BizManage</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          {/* Tab switcher */}
          <div className="flex bg-muted rounded-xl p-1 mb-8 border border-border">
            <button
              className={`flex-1 py-2.5 text-sm font-600 rounded-lg transition-all duration-200 ${
                activeTab === 'login' ?'btn-primary shadow-glow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-600 rounded-lg transition-all duration-200 ${
                activeTab === 'signup' ?'btn-primary shadow-glow-sm' :'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}