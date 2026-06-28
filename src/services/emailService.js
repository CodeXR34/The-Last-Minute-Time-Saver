/**
 * Triggers a test email via the Google Apps Script Web App.
 * 
 * @param {string} uid The Firebase UID of the user.
 * @param {string} userEmail The email address to send the test email to.
 * @param {string} userName The display name of the user.
 * @param {string} templateType (Optional) 'morning', 'afternoon', 'evening', 'night', 'weekly', 'inactivity'
 */
export const triggerTestEmail = async (uid, userEmail, userName, templateType = 'morning') => {
  const gasWebAppUrl = import.meta.env.VITE_GAS_WEB_APP_URL;

  if (!gasWebAppUrl) {
    throw new Error('GAS Web App URL is missing. Add VITE_GAS_WEB_APP_URL to .env');
  }

  try {
    const response = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight
      },
      body: JSON.stringify({
        action: 'sendTestEmail',
        templateType: templateType,
        uid: uid,
        email: userEmail,
        name: userName
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error triggering GAS test email:', error);
    throw error;
  }
};
