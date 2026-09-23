import { describe, expect, it } from 'vitest';
import { detectScamTypeFromText, runFallbackScorer } from '../services/fallbackScorer.js';

describe('Fallback Scorer Scam-Type Classification (FR-39)', () => {
  it('classifies Digital Arrest communications', () => {
    const text = 'This is Inspector Vijay Rathore calling from the CBI Cyber Crime Branch in Delhi. A non-bailable arrest warrant has been issued against you.';
    expect(detectScamTypeFromText(text)).toBe('digital_arrest');

    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('digital_arrest');
  });

  it('classifies Parcel / Courier customs extortion', () => {
    const text = 'Your FedEx courier parcel from Mumbai has been seized by customs officials containing illegal drugs and contraband.';
    expect(detectScamTypeFromText(text)).toBe('parcel_courier');

    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('parcel_courier');
  });

  it('classifies Bank KYC and electricity disconnection threats', () => {
    const text1 = 'Dear consumer, your electricity power supply will be disconnected tonight before midnight because your electricity bill update failed.';
    expect(detectScamTypeFromText(text1)).toBe('kyc_update');

    const text2 = 'Your bank account will be blocked today due to pending KYC documents and PAN card update.';
    expect(detectScamTypeFromText(text2)).toBe('kyc_update');
  });

  it('classifies Work-from-Home and Telegram task scams as job_offer', () => {
    const text = 'Hello, I am recruiting manager Priya. We have an urgent work from home job where you can like YouTube videos and earn daily income guaranteed of 5,000 rupees.';
    expect(detectScamTypeFromText(text)).toBe('job_offer');

    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('job_offer');
  });

  it('classifies Crypto and stock trading schemes as investment', () => {
    const text = 'Join our VIP signals channel for 300% high return investment in crypto trading and bitcoin arbitrage daily profits.';
    expect(detectScamTypeFromText(text)).toBe('investment');

    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('investment');
  });

  it('classifies Lottery and prize rewards as lottery_reward', () => {
    const text = 'Congratulations! You have won a prize of 25 Lakh Rupees in KBC lucky draw lottery. Contact customer manager now.';
    expect(detectScamTypeFromText(text)).toBe('lottery_reward');

    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('lottery_reward');
  });

  it('classifies unknown / legitimate messages as other', () => {
    const text = 'Good afternoon, this is your bank reminding you that your statement is ready. You can visit your local branch anytime.';
    const res = runFallbackScorer(text);
    expect(res.scamType).toBe('other');
  });

  it('produces sensible scam_type for all bundled samples (PRD_P3 criterion 10)', () => {
    // 1. Digital Arrest sample
    const sampleDigitalArrest =
      'This is Inspector Vijay Rathore calling from the CBI Cyber Crime Branch headquarters in Delhi. Your identity documents and phone number have been implicated in a money laundering case and an illegal consignment seized at Mumbai customs containing narcotics. A non-bailable arrest warrant has been issued against you. Do not hang up the call. Maintain complete secrecy and stay in a quiet room immediately.';
    expect(detectScamTypeFromText(sampleDigitalArrest)).toBe('digital_arrest');
    expect(runFallbackScorer(sampleDigitalArrest).scamType).toBe('digital_arrest');

    // 2. Electricity Disconnection sample
    const sampleElectricity =
      'Dear consumer, your electricity power supply will be permanently disconnected tonight before midnight because your electricity bill update failed on the central server. This is urgent action required immediately. Download AnyDesk or QuickSupport app right now on your phone to verify your meter transaction.';
    expect(detectScamTypeFromText(sampleElectricity)).toBe('kyc_update');
    expect(runFallbackScorer(sampleElectricity).scamType).toBe('kyc_update');

    // 3. Task Scam sample
    const sampleTask =
      'Hello! I am recruiting manager Priya. We have an urgent work from home job where you can like YouTube videos and earn daily income guaranteed of 5,000 rupees. Congratulations, your initial trial bonus was credited.';
    expect(detectScamTypeFromText(sampleTask)).toBe('job_offer');
    expect(runFallbackScorer(sampleTask).scamType).toBe('job_offer');

    // 4. Legit Bank Call sample
    const sampleLegit =
      'Good afternoon, I am calling from your local bank branch to inform you that your periodic KYC documentation is due for renewal next month. Please remember that our bank will never ask for your password, PIN, or OTP over the phone. No payment is required for this verification. You can complete your verification by visiting your nearest bank branch in person.';
    expect(runFallbackScorer(sampleLegit).scamType).toBe('other');
  });
});
