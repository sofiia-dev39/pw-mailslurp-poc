import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

test.describe('Email Testing Suite', () => {
  let mailslurp: MailSlurp;
  let emailAddress: string;
  const INBOX_ID = process.env.MAILSLURP_INBOX_ID || '';
  const API_KEY = process.env.MAILSLURP_API_KEY || '';
  const BASE_URL = process.env.BASE_URL || '';

  test.beforeEach(async () => {
    // Verify environment variables are set
    if (!INBOX_ID || !API_KEY) {
      throw new Error('MAILSLURP_INBOX_ID and MAILSLURP_API_KEY environment variables must be set');
    }

    // Initialize MailSlurp with your API key
    mailslurp = new MailSlurp({ apiKey: API_KEY });
    
    // Get the existing inbox
    const inbox = await mailslurp.getInbox(INBOX_ID);
    emailAddress = inbox.emailAddress;
  });

  test('should be able to receive an email and reset password', async ({ page }) => {
    // Navigate to your application
    await page.goto(BASE_URL);
    
    // Click on the forgotten password link
    await page.getByTestId('forgot-password-link').click();

    // Fill in the email input
    await page.getByTestId('textbox-email').fill(emailAddress);

    // Click the send button
    await page.getByTestId('button-forgotton-send').click();

    // Wait for the email to arrive and get its content
    const email = await mailslurp.waitForLatestEmail(INBOX_ID, 30000);
    
    // Verify email was received and has content
    expect(email.body).toBeTruthy();
    
    // Extract the reset link using regex pattern
    const linkPattern = /href="([^"]*)" target="_blank"/;
    const matches = email.body!.match(linkPattern);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(1);
    
    const resetLink = matches![1];

    // Navigate to the reset link
    await page.goto(resetLink);

    // Fill in the new password fields with a complex password
    const newPassword = 'B9$mP#vL2@nX5qR8*';  // Complex password with mixed chars, numbers, and symbols
    await page.getByTestId('textbox-new-password').fill(newPassword);
    await page.getByTestId('textbox-confirm-password').fill(newPassword);

    // Click the change password button
    await page.getByTestId('btn-change-password').click();

    // Verify the success title
    await expect(page.locator('.form--title')).toBeVisible();
    await expect(page.locator('.form--title')).toHaveText('Password reset');
  });

});