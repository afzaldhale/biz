import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Mail, Phone } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        {/* CTA Banner */}
        <div className="relative rounded-3xl overflow-hidden gradient-primary p-12 md:p-16 text-center mb-16">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)' }} />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-800 text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
              Join 5,000+ businesses across India already using BizManage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="tel:+918888888888"
                className="border border-white/40 text-white font-600 px-8 py-4 rounded-xl text-base flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Phone size={16} />
                Call Us: +91 88888 88888
              </a>
            </div>
          </div>
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { id: 'contact-whatsapp', icon: MessageCircle, title: 'WhatsApp Support', desc: 'Chat with us on WhatsApp for instant help', action: 'Chat Now', color: '#10B981' },
            { id: 'contact-email', icon: Mail, title: 'Email Support', desc: 'support@bizmanage.in — response within 4 hours', action: 'Send Email', color: '#2563EB' },
            { id: 'contact-phone', icon: Phone, title: 'Phone Support', desc: 'Mon–Sat 9AM–7PM IST — Hindi & English', action: 'Call Now', color: '#7C3AED' },
          ]?.map((channel) => (
            <div key={channel?.id} className="glass-card rounded-2xl p-6 border border-border/60 text-center card-hover">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${channel?.color}18` }}
              >
                <channel.icon size={22} style={{ color: channel?.color }} />
              </div>
              <h3 className="text-base font-700 text-foreground mb-2">{channel?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{channel?.desc}</p>
              <button
                className="text-sm font-600 transition-colors"
                style={{ color: channel?.color }}
              >
                {channel?.action} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}