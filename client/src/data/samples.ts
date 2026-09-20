export interface SampleScript {
  id: string;
  title: string;
  subtitle: string;
  targetState: 'ALERT' | 'SAFE';
  category: string;
  chunks: {
    speaker: string;
    text: string;
    durationSec: number;
  }[];
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'digital-arrest',
    title: 'CBI / Police "Digital Arrest" Call',
    subtitle: 'Classic impersonation with legal threats and isolation demands',
    targetState: 'ALERT',
    category: 'Impersonation & Coercion',
    chunks: [
      {
        speaker: 'Caller',
        text: 'This is Inspector Vijay Rathore calling from the CBI Cyber Crime Branch headquarters in Delhi. Your identity documents and phone number have been implicated in a money laundering case and an illegal consignment seized at Mumbai customs containing narcotics.',
        durationSec: 6,
      },
      {
        speaker: 'Caller',
        text: 'A non-bailable arrest warrant has been issued against you. Do not hang up the call. Maintain complete secrecy and stay in a quiet room immediately. You must not tell your family or anyone because this is an active confidential investigation.',
        durationSec: 6,
      },
      {
        speaker: 'Caller',
        text: 'To avoid immediate arrest and jail, you must transfer a security deposit to the RBI verification clearance account right now within 15 minutes. Send the funds via UPI immediately or our police patrol will reach your residence.',
        durationSec: 7,
      },
    ],
  },
  {
    id: 'electricity-disconnection',
    title: 'Urgent Electricity Disconnection',
    subtitle: 'Utility cutoff threat paired with remote desktop app installation',
    targetState: 'ALERT',
    category: 'Utility & Remote Access',
    chunks: [
      {
        speaker: 'Caller',
        text: 'Dear consumer, your electricity power supply will be permanently disconnected tonight before midnight because your electricity bill update failed on the central server.',
        durationSec: 5,
      },
      {
        speaker: 'Caller',
        text: 'This is urgent action required immediately. You have only 20 minutes left before disconnection penalty will be imposed and your power connection meter is confiscated.',
        durationSec: 5,
      },
      {
        speaker: 'Caller',
        text: 'Download AnyDesk or QuickSupport app right now on your phone to verify your meter transaction. Share the 9 digit code on your screen and pay the verification fee immediately.',
        durationSec: 6,
      },
    ],
  },
  {
    id: 'task-scam',
    title: 'Work-from-Home Telegram Task Scam',
    subtitle: 'Unsolicited high reward followed by artificial deposit demand',
    targetState: 'ALERT',
    category: 'Job & Investment Fraud',
    chunks: [
      {
        speaker: 'Caller',
        text: 'Hello! I am recruiting manager Priya. We have an urgent work from home job where you can like YouTube videos and earn daily income guaranteed of 5,000 rupees.',
        durationSec: 5,
      },
      {
        speaker: 'Caller',
        text: 'Congratulations, your initial trial bonus was credited. Now for VIP level 2 with 300% high return investment, you must deposit 10,000 rupees immediately to claim your 40,000 rupees reward.',
        durationSec: 6,
      },
      {
        speaker: 'Caller',
        text: 'System alert: your payout is blocked. You must transfer funds of 25,000 rupees within 10 minutes as a clearance fee or your account balance will be seized permanently.',
        durationSec: 6,
      },
    ],
  },
  {
    id: 'legit-bank-call',
    title: 'Legitimate Bank Branch KYC Advisory',
    subtitle: 'Official bank reminder advising in-person branch verification',
    targetState: 'SAFE',
    category: 'Legitimate Advisory',
    chunks: [
      {
        speaker: 'Bank Officer',
        text: 'Good afternoon, I am calling from your local bank branch to inform you that your periodic KYC documentation is due for renewal next month.',
        durationSec: 5,
      },
      {
        speaker: 'Bank Officer',
        text: 'Please remember that our bank will never ask for your password, PIN, or OTP over the phone. No payment is required for this verification.',
        durationSec: 5,
      },
      {
        speaker: 'Bank Officer',
        text: 'You can complete your verification by visiting your nearest bank branch in person, or safely through your official netbanking portal. Please take your time to review.',
        durationSec: 6,
      },
    ],
  },
];
