import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planPrice: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, planPrice }) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento');
      return;
    }

    setIsProcessing(true);
    
    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aqui seria feita a integração real com gateway de pagamento
    // Por enquanto, apenas simula sucesso
    alert(`Pagamento de R$ ${planPrice.toFixed(2)} processado com sucesso!`);
    
    setIsProcessing(false);
    onSuccess();
    onClose();
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Forma de pagamento:</h3>
          
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            paymentMethod === 'pix'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="payment"
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

          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            paymentMethod === 'card'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }`}>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={() => setPaymentMethod('card')}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Cartão de Crédito</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Elo</div>
            </div>
          </label>
        </div>

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
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || !paymentMethod}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isProcessing ? 'Processando...' : `Pagar R$ ${planPrice.toFixed(2)}`}
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          🔒 Pagamento seguro processado por gateway de pagamento
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;

