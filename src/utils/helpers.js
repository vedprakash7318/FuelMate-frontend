// Format number as Indian Rupee
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Format plain number with Indian comma separators
export const formatNumber = (num) => {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

// Format Liters
export const formatLiters = (liters) => {
  const n = Number(liters) || 0;
  return `${n.toFixed(2)} L`;
};

// Format Date: e.g. 17 Nov 2024
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format Date & Time: e.g. 17 Nov 2024, 02:45 PM
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format compact time for mobile feeds: e.g. "Today, 02:45 PM" or "17 Nov, 02:45 PM"
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isToday) {
    return `Today, ${timeStr}`;
  }
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${dateStr}, ${timeStr}`;
};

// Extract error message from API response
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

// Generate WhatsApp reminder link
export const generateWhatsAppLink = (mobile, ownerName, outstanding, pumpName = 'Petrol Pump') => {
  if (!mobile) return null;
  const cleanPhone = mobile.replace(/\D/g, '');
  const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const text = encodeURIComponent(
    `Dear ${ownerName},\n\nThis is a friendly reminder that your outstanding fuel balance at ${pumpName} is ₹${formatNumber(outstanding)}.\nKindly clear the payment at your earliest convenience.\n\nThank you,\n${pumpName}`
  );
  return `https://wa.me/${phone}?text=${text}`;
};
