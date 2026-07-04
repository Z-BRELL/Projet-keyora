import Link from 'next/link';
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const socialLinks = [
    { href: '#', icon: Facebook, label: 'Facebook' },
    { href: '#', icon: Twitter, label: 'Twitter' },
    { href: '#', icon: Instagram, label: 'Instagram' },
    { href: '#', icon: Linkedin, label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Keyora</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              La plateforme immobilière de référence en Afrique centrale. Vendez, achetez ou louez en toute confiance.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>Yaoundé, Cameroun</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>contact@keyora.cm</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span>Contactez-nous par email</span>
              </div>
            </div>
            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="font-semibold text-white mb-4">Plateforme</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/listing', label: 'Annonces' },
                { href: '/listing?type=SALE', label: 'Acheter' },
                { href: '/sell', label: 'Vendre' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'À propos' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compte */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h4 className="font-semibold text-white mb-4">Votre compte</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/auth/register', label: 'S\'inscrire' },
                { href: '/auth/login', label: 'Se connecter' },
                { href: '/dashboard', label: 'Tableau de bord' },
                { href: '/dashboard/favorites', label: 'Mes favoris' },
                { href: '/dashboard/alerts', label: 'Mes alertes' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary-400 transition-colors block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Keyora. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Confidentialité</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
