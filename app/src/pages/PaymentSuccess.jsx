import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui.jsx';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Verify payment status
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe-verify-session?session_id=${sessionId}`);
        if (response.ok) {
          setStatus('success');
          // Refresh user profile after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('[PaymentSuccess] Verification error:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h2>
            <p className="text-gray-400">Please wait while we confirm your purchase.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">
              Welcome to Founders Club! Your account has been upgraded.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting you to the app...
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>
              Go to App
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 text-red-400 mx-auto mb-4">✕</div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-6">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Return to App
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

