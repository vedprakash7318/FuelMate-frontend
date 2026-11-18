import React from 'react';
import { Fuel, Printer, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { formatCurrency, formatDateTime, formatLiters, generateWhatsAppLink } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const ReceiptModal = ({ isOpen, onClose, txn, payment }) => {
  const { pumpSettings } = useAuth();

  if (!isOpen || (!txn && !payment)) return null;

  const isFuel = Boolean(txn);
  const data = txn || payment;

  const handlePrint = () => {
    window.print();
  };

  const shareText = isFuel
    ? `*${pumpSettings?.pumpName || 'Petrol Pump'}*\n` +
      `Fuel Receipt: ${data.transactionId}\n` +
      `Date: ${formatDateTime(data.createdAt)}\n` +
      `Customer: ${data.ownerId?.name || data.ownerId}\n` +
      `Vehicle: ${data.vehicleId?.vehicleNumber || 'N/A'}\n` +
      `Fuel: ${data.fuelType} (${formatLiters(data.quantity)})\n` +
      `Rate: ₹${data.pricePerLiter}/L\n` +
      `Total: ${formatCurrency(data.totalAmount)}\n` +
      (data.amountReceived > 0
        ? `Paid: ${formatCurrency(data.amountReceived)} (${data.paymentMode || 'Cash'}${data.transactionRef ? ' - ' + data.transactionRef : ''})\n`
        : '') +
      `*Pending: ${formatCurrency(data.remainingAmount)}*`
    : `*${pumpSettings?.pumpName || 'Petrol Pump'}*\n` +
      `Payment Receipt: ${data.paymentId}\n` +
      `Date: ${formatDateTime(data.createdAt)}\n` +
      `Customer: ${data.ownerId?.name || data.ownerId}\n` +
      `Amount Received: ${formatCurrency(data.amount)}\n` +
      `Mode: ${data.paymentMode}\n` +
      `Ref: ${data.transactionRef || 'N/A'}`;

  const ownerMobile = data.ownerId?.mobile;
  const whatsappUrl = ownerMobile
    ? `https://wa.me/91${ownerMobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Receipt" maxWidth="max-w-md">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-mono text-sm shadow-inner print:m-0 print:border-none print:shadow-none" id="printable-receipt">
        {/* Pump Header */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300">
          <div className="w-10 h-10 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 shadow-sm">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">{pumpSettings?.pumpName || 'Petrol Pump Khata'}</h2>
          <p className="text-xs text-slate-500 font-sans">{pumpSettings?.tagline || 'Authorized Fuel Station'}</p>
          <p className="text-xs text-slate-500 mt-1">{pumpSettings?.address || 'Main Highway Road'}, {pumpSettings?.city || ''}</p>
          {pumpSettings?.gstNumber && (
            <p className="text-[11px] text-slate-400">GST: {pumpSettings.gstNumber}</p>
          )}
        </div>

        {/* Receipt Details */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Slip No:</span>
            <span className="font-bold text-slate-800">{isFuel ? data.transactionId : data.paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date & Time:</span>
            <span>{formatDateTime(data.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold">{data.ownerId?.name || 'Customer'}</span>
          </div>
          {data.ownerId?.mobile && (
            <div className="flex justify-between">
              <span className="text-slate-500">Mobile:</span>
              <span>{data.ownerId.mobile}</span>
            </div>
          )}
          {data.vehicleId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-bold">{data.vehicleId?.vehicleNumber || data.vehicleId}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="py-3 border-b border-dashed border-slate-300 space-y-2 text-xs">
          {isFuel ? (
            <>
              <div className="flex justify-between">
                <span>Fuel Type:</span>
                <span className="font-bold">{data.fuelType}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume / Liters:</span>
                <span>{formatLiters(data.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Liter:</span>
                <span>₹{Number(data.pricePerLiter).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200">
                <span>Total Fuel Bill:</span>
                <span>{formatCurrency(data.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span>- {formatCurrency(data.amountReceived)}</span>
              </div>
              {data.amountReceived > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                  <span>Payment Mode:</span>
                  <span className="font-semibold text-slate-700">
                    {data.paymentMode || 'Cash'}
                    {data.transactionRef ? ` (${data.transactionRef})` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-rose-700 pt-1 border-t border-slate-200">
                <span>Balance on Credit:</span>
                <span>{formatCurrency(data.remainingAmount)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold">{data.paymentMode}</span>
              </div>
              {data.transactionRef && (
                <div className="flex justify-between">
                  <span>Reference / UTR:</span>
                  <span>{data.transactionRef}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-emerald-700 pt-2 border-t border-slate-200">
                <span>Amount Received:</span>
                <span>{formatCurrency(data.amount)}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 text-center text-[11px] text-slate-500 font-sans">
          <p>{pumpSettings?.receiptFooter || 'Thank you! Visit again.'}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">Powered by Petrol Pump Khata Manager</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3 print:hidden">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Share</span>
        </a>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
