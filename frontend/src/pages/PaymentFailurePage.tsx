import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const PaymentFailurePage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const courseId = searchParams.get('courseId') || sessionStorage.getItem('pendingCourseId');

  useEffect(() => {
    // Auto-redirect to cancel page if we have a courseId
    if (courseId) {
      console.log('🔍 PaymentFailurePage - Auto-redirecting to cancel page');
      navigate(`/checkout/cancel?courseId=${courseId}`, { replace: true });
    }
  }, [courseId, navigate]);

  const handleCheckPaymentStatus = async () => {
    if (!courseId) {
      setCheckResult(t('payment_failure.no_course_id'));
      return;
    }

    setIsChecking(true);
    setCheckResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCheckResult(t('payment_failure.not_authenticated'));
        return;
      }

      const response = await fetch(`/api/payment/check-purchase/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasPurchased = data.data?.hasPurchased;

        if (hasPurchased) {
          setCheckResult(t('payment_failure.payment_successful'));
          setTimeout(() => {
            navigate(`/checkout/success?courseId=${courseId}`);
          }, 2000);
        } else {
          setCheckResult(t('payment_failure.payment_not_successful'));
          setTimeout(() => {
            navigate(`/checkout/cancel?courseId=${courseId}`);
          }, 2000);
        }
      } else {
        setCheckResult(t('payment_failure.could_not_check'));
      }
    } catch (error) {
      setCheckResult(t('payment_failure.error_checking'));
      console.error('Error checking payment status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualRedirect = () => {
    if (courseId) {
      navigate(`/checkout/cancel?courseId=${courseId}`);
    } else {
      navigate('/checkout/cancel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-8 py-12 text-center">
            <div className="bg-white bg-opacity-20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-16 w-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('payment_failure.title')}
            </h1>
            <p className="text-xl text-yellow-100">
              {t('payment_failure.subtitle')}
            </p>
          </div>

          <div className="p-8">
            {/* Status Message */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('payment_failure.whats_happening')}</h2>
              <p className="text-gray-600 mb-4">
                {t('payment_failure.description')}
              </p>
              
              {checkResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800">{checkResult}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleCheckPaymentStatus}
                disabled={isChecking}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isChecking ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                <span>{isChecking ? t('payment_failure.checking') : t('payment_failure.check_payment_status')}</span>
              </button>

              <button
                onClick={handleManualRedirect}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>{t('payment_failure.go_to_cancel_page')}</span>
              </button>

              <Link
                to="/dashboard"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 text-center"
              >
{t('payment_failure.go_to_dashboard')}
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('payment_failure.need_help')}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('payment_failure.help_description')}
              </p>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• {t('payment_failure.check_email')}</li>
                <li>• {t('payment_failure.contact_support')}</li>
                <li>• {t('payment_failure.try_again')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
