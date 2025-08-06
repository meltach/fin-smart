import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon, Copy, CheckCircle, X } from 'lucide-react';

interface SandboxHelperProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const SandboxHelper: React.FC<SandboxHelperProps> = ({ 
  isVisible = true,
  onClose 
}) => {
  const [copiedField, setCopiedField] = useState('');

  // Only show in sandbox/development mode
  const isProduction = process.env.NODE_ENV === 'production' && 
                      process.env.NEXT_PUBLIC_PLAID_ENV === 'production';
  
  if (isProduction || !isVisible) {
    return null;
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const testCredentials = [
    { label: 'Phone Number', value: '+15555550123', field: 'phone' },
    { label: 'Username', value: 'user_good', field: 'username' },
    { label: 'Password', value: 'pass_good', field: 'password' },
    { label: 'PIN', value: '1234', field: 'pin' },
  ];

  return (
    <Card className="fixed bottom-4 right-4 p-4 w-80 z-50 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            🏦 Sandbox Test Credentials
          </h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
        Use these when connecting to test banks:
      </p>
      
      <div className="space-y-2">
        {testCredentials.map(({ label, value, field }) => (
          <div key={field} className="flex items-center justify-between">
            <div className="flex-1">
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                {label}:
              </span>
              <code className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 px-1 rounded text-blue-900 dark:text-blue-100">
                {value}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(value, field)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              {copiedField === field ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
        💡 Click to copy any credential
      </p>
    </Card>
  );
};
