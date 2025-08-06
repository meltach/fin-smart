"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit, PlaidLinkOptions } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlaidSetupInstructions } from '@/components/PlaidSetupInstructions';
import { SandboxHelper } from '@/components/SandboxHelper';
import { Loader2, CreditCard, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialStore } from '@/stores/financialStore';

interface PlaidLinkComponentProps {
  userId: string;
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
  className?: string;
  variant?: 'button' | 'card';
  disabled?: boolean;
}

export const PlaidLinkComponent: React.FC<PlaidLinkComponentProps> = ({
  userId,
  onSuccess,
  onExit,
  className,
  variant = 'button',
  disabled = false,
}) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaidConfigured, setIsPlaidConfigured] = useState(true);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);
  const [showSandboxHelper, setShowSandboxHelper] = useState(false);
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);
  const [connectionStatusChecked, setConnectionStatusChecked] = useState(false);

  // Get refresh function from store
  const { refreshData } = useFinancialStore();

  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!userId) {
        setConnectionStatusChecked(true);
        return;
      }

      try {
        const response = await fetch(`/api/plaid/connection-status?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.isConnected) {
          setIsPlaidConnected(true);
        }
      } catch (error) {
        console.error('Error checking Plaid connection status:', error);
      } finally {
        setConnectionStatusChecked(true);
      }
    };

    checkConnectionStatus();
  }, [userId]);

  // Fetch link token from your backend
  const fetchLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setLinkToken(data.linkToken);
        setIsPlaidConfigured(true);
        setShouldAutoOpen(true); // Mark that we should auto-open when ready
      } else {
        // Check if it's a configuration error
        const errorString = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        if (errorString?.includes('not configured') || errorString?.includes('environment variables')) {
          setIsPlaidConfigured(false);
          setError('Plaid needs to be configured');
        } else {
          throw new Error(data.error || 'Failed to create link token');
        }
      }
    } catch (err: any) {
      console.error('Error fetching link token:', err);
      const errorMessage = err.message || 'Failed to initialize bank connection';
      
      if (errorMessage.includes('not configured') || errorMessage.includes('environment variables')) {
        setIsPlaidConfigured(false);
        setError('Plaid needs to be configured');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle successful bank connection
  const handleOnSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken, metadata) => {
      console.log('Plaid Link success:', { publicToken, metadata });
      
      try {
        // Exchange public token for access token on your backend
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            publicToken,
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
            accounts: metadata.accounts,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setIsConnected(true);
          onSuccess?.(publicToken, metadata);
          
          // Trigger a refresh of financial data without page reload
          console.log('Bank account connected successfully! Refreshing data...');
          await refreshData();
          console.log('Data refreshed successfully.');
        } else {
          throw new Error(data.error || 'Failed to connect bank account');
        }
      } catch (err: any) {
        console.error('Error exchanging token:', err);
        setError(err.message || 'Failed to connect bank account');
      }
    },
    [onSuccess, refreshData]
  );

  // Handle Link exit/cancellation
  const handleOnExit: PlaidLinkOnExit = useCallback(
    (error, metadata) => {
      console.log('Plaid Link exit:', { error, metadata });
      
      if (error) {
        setError(error.error_message || 'Bank connection was cancelled');
      }
      
      onExit?.(error, metadata);
    },
    [onExit]
  );

  // Plaid Link configuration
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
    env: (process.env.NEXT_PUBLIC_PLAID_ENV as any) || 'sandbox',
  };

  const { open, ready, error: plaidError } = usePlaidLink(config);

  // Log any Plaid Link errors
  useEffect(() => {
    if (plaidError) {
      console.error('Plaid Link error:', plaidError);
      setError(`Plaid Link error: ${plaidError.type || 'Unknown error'} - ${plaidError.message || 'Unknown message'}`);
    }
  }, [plaidError]);

  // Debug effect to track when Plaid Link becomes ready
  useEffect(() => {
    // console.log('Plaid Link ready state changed:', { ready, linkToken, shouldAutoOpen });
    if (ready && linkToken && shouldAutoOpen) {
      console.log('Auto-opening Plaid Link...');
      setShouldAutoOpen(false);
      try {
        open();
      } catch (error) {
        console.error('Error auto-opening Plaid Link:', error);
        setError('Failed to open bank connection dialog. Please try clicking the button again.');
      }
    }
  }, [ready, linkToken, shouldAutoOpen, open]);

  // Handle opening Plaid Link
  const handleOpenLink = useCallback(() => {
    if (!linkToken) {
      console.log('No link token, fetching...');
      fetchLinkToken();
    } else if (ready) {
      console.log('Opening Plaid Link with token:', linkToken.substring(0, 20) + '...');
      console.log('Plaid config:', { env: process.env.NEXT_PUBLIC_PLAID_ENV, ready });
      setShouldAutoOpen(false); // Clear auto-open since we're manually opening
      
      // Show sandbox helper if we're in sandbox mode
      const isSandbox = process.env.NEXT_PUBLIC_PLAID_ENV === 'sandbox' || 
                       process.env.NODE_ENV === 'development';
      if (isSandbox) {
        setShowSandboxHelper(true);
      }
      
      try {
        open();
      } catch (error) {
        console.error('Error opening Plaid Link:', error);
        setError('Failed to open bank connection dialog. Please try again.');
      }
    } else {
      console.log('Plaid Link not ready yet, ready:', ready, 'linkToken:', !!linkToken);
      setError('Bank connection is initializing. Please wait a moment and try again.');
    }
  }, [linkToken, ready, open, fetchLinkToken]);

  // Show setup instructions if Plaid is not configured
  if (!isPlaidConfigured || showSetupInstructions) {
    return (
      <div className={className}>
        <PlaidSetupInstructions />
        <div className="mt-4 text-center">
          <Button
            onClick={() => {
              setShowSetupInstructions(false);
              setIsPlaidConfigured(true);
              setError(null);
            }}
            variant="outline"
          >
            I've configured Plaid - Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isPlaidConnected) {
    return null; // Or a component indicating connection is active
  }

  // Don't render anything until we've checked the connection status
  if (!connectionStatusChecked) {
    return null;
  }

  // Render as button
  if (variant === 'button') {
    return (
      <div className={className}>
        <Button
          onClick={handleOpenLink}
          disabled={disabled || isLoading || (!ready && linkToken !== null)}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : isConnected ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Bank Connected
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Bank Account
            </>
          )}
        </Button>
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            {error.includes('Plaid needs to be configured') && (
              <Button
                onClick={() => setShowSetupInstructions(true)}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                <Settings className="mr-2 h-4 w-4" />
                Show Setup Instructions
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render as card
  return (
    <>
      <Card className={cn("p-6", className)}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Bank Account
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Securely connect your bank account to automatically sync transactions and get personalized insights.
          </p>
        
        <div className="space-y-3">
          <Button
            onClick={handleOpenLink}
            disabled={disabled || isLoading || (!ready && linkToken !== null)}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : isConnected ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Bank Connected
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Connect Bank Account
              </>
            )}
          </Button>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Debug: ready={ready ? 'true' : 'false'}, token={linkToken ? 'set' : 'null'}</div>
              <div>Env: {process.env.NEXT_PUBLIC_PLAID_ENV}</div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              {error.includes('Plaid needs to be configured') && (
                <Button
                  onClick={() => setShowSetupInstructions(true)}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Show Setup Instructions
                </Button>
              )}
              {error.includes('Failed to open bank connection dialog') && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>Troubleshooting tips:</p>
                  <ul className="list-disc ml-4 mt-1">
                    <li>Check if popup blocker is enabled</li>
                    <li>Try refreshing the page</li>
                    <li>Check browser console for errors</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>🔒 Your data is encrypted and secure</p>
          <p>Powered by Plaid - trusted by millions</p>
        </div>        </div>
      </Card>
      
      {/* Sandbox helper for development */}
      <SandboxHelper 
        isVisible={showSandboxHelper} 
        onClose={() => setShowSandboxHelper(false)}
      />
    </>
  );
};
