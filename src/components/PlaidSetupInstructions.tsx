import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';

export const PlaidSetupInstructions: React.FC = () => {
  const [copiedEnv, setCopiedEnv] = React.useState('');

  const copyToClipboard = (text: string, envVar: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEnv(envVar);
    setTimeout(() => setCopiedEnv(''), 2000);
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🏦 Plaid Integration Setup
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            To connect real bank accounts, you'll need to set up your Plaid credentials
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Step 1: Get Your Plaid Credentials
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
              <li>Go to <a href="https://dashboard.plaid.com" target="_blank" rel="noopener noreferrer" className="underline">Plaid Dashboard</a></li>
              <li>Create a free account (no credit card required for sandbox)</li>
              <li>Create a new application</li>
              <li>Copy your Client ID and Secret Key</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://dashboard.plaid.com', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Plaid Dashboard
            </Button>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Step 2: Add Environment Variables
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              Add these to your <code className="bg-green-100 dark:bg-green-800 px-1 rounded">.env.local</code> file:
            </p>
            
            <div className="space-y-2">
              {[
                { key: 'PLAID_CLIENT_ID', value: 'your_plaid_client_id_here' },
                { key: 'PLAID_SECRET', value: 'your_plaid_secret_here' },
                { key: 'PLAID_ENV', value: 'sandbox' },
                { key: 'NEXT_PUBLIC_PLAID_ENV', value: 'sandbox' },
              ].map(({ key, value }) => (
                <div key={key} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded p-2">
                  <code className="text-sm font-mono">{key}={value}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${key}=${value}`, key)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedEnv === key ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Step 3: Restart Your Development Server
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              After adding the environment variables, restart your development server:
            </p>
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded p-2">
              <code className="text-sm font-mono">npm run dev</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('npm run dev', 'npm')}
                className="h-6 w-6 p-0"
              >
                {copiedEnv === 'npm' ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              🔒 Sandbox Testing Guide
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
              <li>Sandbox environment is perfect for development and testing</li>
              <li><strong>Phone Number:</strong> Use <code>+15555550123</code> when prompted</li>
              <li><strong>Bank Login:</strong> Username: <code>user_good</code>, Password: <code>pass_good</code></li>
              <li><strong>PIN:</strong> Use <code>1234</code> if asked for a PIN</li>
              <li>For production, change PLAID_ENV to 'production' and use real credentials</li>
              <li>Always encrypt access tokens in production databases</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
