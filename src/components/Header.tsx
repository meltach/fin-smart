"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, ChevronRight, ChevronLeft, Home, BarChart3, Target, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizedLink } from '@/components/shared/OptimizedLink';

export function Header() {
  const { dark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex">
      {/* Fixed Sidebar - Hidden on mobile */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-16 bg-white dark:bg-gray-800 shadow-md z-40 flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FS</span>
          </div>
        </div>
        
        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <OptimizedLink 
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center h-12 mx-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" aria-label={item.label} />
              </OptimizedLink>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          {user ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="w-full h-12 p-0"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <OptimizedLink href="/login">
              <Button variant="ghost" size="sm" className="w-full h-12 p-0" aria-label="Login">
                <User className="w-5 h-5" />
              </Button>
            </OptimizedLink>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="flex-1 md:ml-16">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" onClick={toggleMobileMenu} className="md:hidden">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <h1
            className='text-xl font-bold text-gray-900 dark:text-white'
            >FinSmart</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={toggleTheme}>
              {isMounted ? (dark ? <Sun /> : <Moon />) : <div className="w-6 h-6" />}
            </Button>
            <Input placeholder="Search…" className="hidden sm:block w-64" />
            
            {/* User info for desktop */}
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-opacity-50 z-40"
            onClick={toggleMobileMenu}
          />
          
          {/* Mobile Menu */}
          <div className="md:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
            <div className="p-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <OptimizedLink 
                      key={item.href}
                      href={item.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                          : 'hover:bg-teal-50 dark:hover:bg-teal-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </OptimizedLink>
                  );
                })}
              </nav>

              {/* User section in mobile menu */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                {user ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">Signed in</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <OptimizedLink 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="block text-center p-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </OptimizedLink>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
