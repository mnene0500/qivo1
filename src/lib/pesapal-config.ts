
/**
 * @fileOverview Minimal PesaPal Configuration for QIVO.
 */
export const PESAPAL_CONFIG = {
  // The URL PesaPal calls behind the scenes (S2S) to notify us of payment status
  IPN_URL: 'https://qivo-gamma.vercel.app/api/pesapal/callback',
  // The URL the user is redirected to after completing payment in the browser
  CALLBACK_URL: 'https://qivo-gamma.vercel.app/payment-success',
};
