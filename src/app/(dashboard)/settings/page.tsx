import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  DollarSign, 
  Download,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and application preferences</p>
        </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </label>
                  <Input placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </label>
                  <Input placeholder="Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="john.doe@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input type="password" placeholder="••••••••" />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input type="password" placeholder="••••••••" />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input type="password" placeholder="••••••••" />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button>Update Password</Button>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <Button variant="outline" size="sm">Toggle</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                  </div>
                  <Button variant="outline" size="sm">Toggle</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Goal Reminders</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get reminded about your financial goals</p>
                  </div>
                  <Button variant="outline" size="sm">Toggle</Button>
                </div>
              </div>
            </Card>

            {/* Currency & Display */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Currency & Display</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Currency
                  </label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                    <option>CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Format
                  </label>
                  <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Data Management */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Management</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Download your financial data</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-600">Delete Account</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
  );
}
