import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  processPayment, 
  PaymentGateway,
  type PaymentRequest 
} from '../services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planPrice: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, planPrice }) => {
  const { professionalId } = useAuth();
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!paymentGateway) {
      setError('Selecione um gateway de pagamento');
      return;
    }

    if ((paymentGateway === 'mercadopago' || paymentGateway === 'pix' || paymentGateway === 'card') && !paymentMethod) {
      setError('Selecione uma forma de pagamento');
      return;
    }

    if (paymentMethod === 'card' && (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv)) {
      setError('Preencha todos os dados do cartão');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentRequest: PaymentRequest = {
        amount: planPrice,
        currency: 'BRL',
        description: `Plano Pro FisioQ - Mensalidade`,
        userId: professionalId || 'anonymous',
        planId: 'pro-monthly',
      };

      // Determinar gateway e método
      let gateway: PaymentGateway = paymentGateway;
      if (paymentGateway === 'mercadopago') {
        gateway = paymentMethod === 'pix' ? 'pix' : 'card';
      }

      const response = await processPayment(
        gateway,
        paymentRequest,
        paymentMethod === 'card' ? cardData : undefined
      );

      if (response.success) {
        // Se houver URL de redirecionamento (PayPal ou Mercado Pago checkout)
        if (response.paymentUrl) {
          window.open(response.paymentUrl, '_blank');
          alert('Redirecionando para o gateway de pagamento...\n\nApós confirmar o pagamento, seu plano será ativado automaticamente.');
        } else {
          // Pagamento processado diretamente
          alert(`Pagamento de R$ ${planPrice.toFixed(2)} processado com sucesso!\n\nID da transação: ${response.transactionId}`);
          onSuccess();
          onClose();
        }
      } else {
        setError(response.error || 'Erro ao processar pagamento');
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assinar Plano Pro
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Total a pagar:</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">R$ {planPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">por mês</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Gateway de pagamento:</h3>
          
          {/* PayPal */}
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            paymentGateway === 'paypal'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="gateway"
              value="paypal"
              checked={paymentGateway === 'paypal'}
              onChange={() => {
                setPaymentGateway('paypal');
                setPaymentMethod(null); // PayPal não precisa de método adicional
              }}
              className="mr-3"
            />
            <div className="flex-1 flex items-center gap-3">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.174 1.351 1.05 3.3.927 4.715-.122 1.415-.1 2.354.102 3.08.232.822.767 1.517 1.506 1.996.83.543 1.56.844 2.146 1.238.696.47 1.203.99 1.464 1.605a6.296 6.296 0 0 1 .378 3.006c-.056.957-.307 1.884-.734 2.693-.36.67-.823 1.232-1.37 1.64-.502.373-1.08.665-1.708.867-1.038.324-2.23.485-3.442.485H9.982a.99.99 0 0 0-.955.746l-1.12 5.6a.641.641 0 0 1-.631.52zm-1.768-6.245h6.536c3.923 0 6.81-1.043 8.178-3.057.932-1.387.831-3.28.725-4.73-.106-1.45-.188-2.58.03-3.417.176-.684.526-1.224 1.023-1.617.505-.4 1.109-.66 1.772-.79.715-.138 1.483-.203 2.276-.203h.825c.123-.85.15-1.663.078-2.38-.08-.79-.32-1.484-.693-2.042C18.804 1.756 17.246 1.25 15.119 1.25H6.52l-3.505 18.842h3.721l.948-5.555z"/>
              </svg>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cartão, saldo PayPal ou conta bancária</div>
              </div>
            </div>
          </label>

          {/* Mercado Pago */}
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            paymentGateway === 'mercadopago'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="gateway"
              value="mercadopago"
              checked={paymentGateway === 'mercadopago'}
              onChange={() => {
                setPaymentGateway('mercadopago');
                setPaymentMethod(null); // Reset para escolher método depois
              }}
              className="mr-3"
            />
            <div className="flex-1 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                MP
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Mercado Pago</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">PIX, cartão ou boleto</div>
              </div>
            </div>
          </label>

          {/* Métodos do Mercado Pago */}
          {paymentGateway === 'mercadopago' && (
            <div className="ml-8 space-y-3 border-l-2 border-blue-500 pl-4">
              <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'pix'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
              }`}>
                <input
                  type="radio"
                  name="mp-method"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={() => setPaymentMethod('pix')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">PIX</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Aprovação instantânea</div>
                </div>
              </label>

              <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'card'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
              }`}>
                <input
                  type="radio"
                  name="mp-method"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Cartão de Crédito</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Elo, Hipercard</div>
                </div>
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do cartão
              </label>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardData.number}
                onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700"
                maxLength={19}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome no cartão
              </label>
              <input
                type="text"
                placeholder="Nome completo"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validade
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={cardData.expiry}
                  onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || !paymentGateway || (paymentGateway === 'mercadopago' && !paymentMethod)}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : (
              `Pagar R$ ${planPrice.toFixed(2)}`
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            🔒 Pagamento seguro processado por gateway de pagamento
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span>💳 Cartões aceitos</span>
            <span>•</span>
            <span>🔐 SSL Seguro</span>
            <span>•</span>
            <span>✅ Cancelamento fácil</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

