export const calculateLeadScore = (budget, timeline, serviceInterest, hasBookedAppointment) => {
  let score = 0;

  // 1. Budget scoring weights
  if (budget === 'Above ₹1,00,000') {
    score += 30;
  } else if (budget === '₹50,000 – ₹1,00,000') {
    score += 20;
  } else if (budget === '₹25,000 – ₹50,000') {
    score += 10;
  }

  // 2. Timeline scoring weights
  if (timeline === 'Immediately') {
    score += 20;
  } else if (timeline === 'Within 30 Days') {
    score += 15;
  } else if (timeline === 'Within 3 Months') {
    score += 5;
  }

  // 3. Appointment Booking weight
  if (hasBookedAppointment) {
    score += 30;
  }

  // 4. Service Interest weight
  if (serviceInterest === 'AI Voice Agent') {
    score += 20;
  } else if (serviceInterest === 'CRM Development') {
    score += 15;
  } else if (serviceInterest) {
    score += 10;
  }

  // 5. Categorize lead status
  let status = 'Cold';
  if (score >= 80) {
    status = 'Hot';
  } else if (score >= 50) {
    status = 'Warm';
  }

  return { score, status };
};
