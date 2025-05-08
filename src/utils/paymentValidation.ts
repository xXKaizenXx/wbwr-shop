export const validateCardNumber = (number: string): boolean => {
  // Remove spaces and dashes
  const cleanNumber = number.replace(/[\s-]/g, '');
  
  // Check if it's a valid length (13-19 digits)
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false;
  }

  // Luhn algorithm for card validation
  let sum = 0;
  let isEven = false;
  
  // Loop through values starting from the rightmost digit
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  // Format should be MM/YY
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (expMonth < 1 || expMonth > 12) {
    return false;
  }

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return false;
  }

  return true;
};

export const validateCVV = (cvv: string): boolean => {
  // CVV should be 3 or 4 digits
  return /^\d{3,4}$/.test(cvv);
};

export const formatCardNumber = (number: string): string => {
  // Remove all non-digit characters
  const digits = number.replace(/\D/g, '');
  
  // Add space after every 4 digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

export const formatExpiryDate = (date: string): string => {
  // Remove all non-digit characters
  const digits = date.replace(/\D/g, '');
  
  // Format as MM/YY
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}; 