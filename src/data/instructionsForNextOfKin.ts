export const NOK_INSTRUCTIONS = {
  title: 'Instructions for Your Next of Kin',
  subtitle: 'What to expect, and what to do, with the Orderly Vault',
  company: 'Orderly Affairs Digital, LLC',
  lastUpdated: 'August 27, 2026',
  intro:
    "You've been named as a next of kin, executor, or trusted contact on someone's Orderly Vault. This page explains what that means, what you need to do now, and what to do if the time ever comes to ask for access. Keep it somewhere you'll actually find it again, and take your time reading it. There's no rush.",
  sections: [
    {
      id: 'what-it-means',
      title: 'What being named as next of kin means',
      paragraphs: [
        "It means someone trusts you to help manage their affairs if they become unable to, or after they're gone. It does not give you access to anything right now. Nobody, including you, can see inside someone's Vault while they're alive unless they've separately invited you in for that purpose.",
      ],
    },
    {
      id: 'do-now',
      title: 'What to do now, before you ever need it',
      paragraphs: [
        'Accept the invite you were sent, and verify the email address and phone number on file for you. This step matters more than it looks like it does: your verified phone number is what lets you securely claim access later. If it isn\'t done in advance, it can slow things down at the exact moment you need them to go fast.',
        'Keep that email and phone number current. If you change your number, update it. An out-of-date contact is the single most common reason access gets delayed.',
        "If you don't already know, ask the Vault owner where their attorney or executor information is kept, and whether there's anything you should know in advance. You don't need to memorize anything. You just need to know it's there.",
        "Have a valid, unexpired government-issued ID, like a driver's license or passport, on hand for later. There's nothing to upload now. It's just something you'll be asked for when the time comes, so it helps to know that in advance.",
      ],
    },
    {
      id: 'when-the-time-comes',
      title: 'When the time comes',
      paragraphs: [
        "There are three ways this process can start. You might be the one who starts it, or it might already be underway by the time you're contacted.",
      ],
      subsections: [
        {
          title: "If you're starting it",
          paragraphs: [
            "Log in and request after-death access (report a passing). You'll be asked to upload a death certificate. A certified copy commonly takes one to three weeks to arrive after a death, so it's worth requesting one as early as you're able to. If there's an estate attorney or executor already involved, they can start this instead, and their filing carries the same weight, though they'll need to verify their own identity first, a government ID plus a live selfie, before they're able to start anything. Named next of kin may report a passing first, then complete that same ID and selfie check before a claim can be issued.",
          ],
        },
        {
          title: 'If someone else starts it',
          paragraphs: [
            'If the attorney or executor starts the process, you may be contacted and asked to complete your own identity check and follow the case on your dashboard. A simple confirmation from the living account holder that they are alive is enough to freeze the request. If you are not sure, say so. Independent verification still has to run. Nothing is skipped.',
          ],
        },
      ],
    },
    {
      id: 'after-certificate',
      title: 'What happens after a death certificate is uploaded',
      paragraphs: [
        'This is the part that takes the most patience, and it is worth knowing why it works the way it does. After the death certificate is stored privately, two things happen together: the file is kept on a private record, and a mandatory 7-day protection period, 168 hours, starts for the account holder. They are notified on every contact method on file (day 0), then reminded on day 2, day 4, and a final reminder on day 6. Their Vault stays sealed. They can stop the request at any time with I Am Alive.',
        'After the death certificate is stored privately, Orderly Affairs runs an owner death-record check through Didit against independent U.S. mortality records for the Vault owner, not for you. That check asks whether the owner identity matches a death-record source. It does not prove that a particular PDF or photo is unaltered, and it does not unlock the Vault by itself.',
        'This is not a sign of distrust in you. It exists because the alternative, a single printed password with no check on who uses it or when, is exactly the kind of gap this process was built to close. It protects the account holder from premature or fraudulent access just as much as it protects you from ever being blocked out.',
        'If the death-record check is not a match, or something about the file cannot be confidently reviewed, the request is not rejected outright. It is routed to a person on our team for manual review instead, typically within 48 hours. No single signal, a certificate, a match, or identity approval, can release a Vault. An Orderly Affairs admin still has to release access by hand after every gate is met.',
      ],
    },
    {
      id: 'how-you-get-in',
      title: 'How you actually get in',
      paragraphs: [
        "You'll be asked to verify your own identity before you can claim access: a photo of a government-issued ID, like a driver's license or passport, plus a quick live selfie so we can match your face to it. This runs through an identity verification service called Didit, and it's separate from the phone verification you did when you first accepted the invite. It confirms you're the specific person named as next of kin, not just anyone who happens to have your phone. If your ID doesn't scan cleanly or the match is inconclusive, you won't be denied outright, it gets routed to a person on our team to sort out by hand, the same as with the death certificate.",
        "Once identity is Approved, the protection period is complete, the owner has not stopped the request, and an admin has released access, you'll get an email with a one-time claim link, valid for 72 hours. Opening it will ask for a one-time code sent to the phone number you verified when you first accepted the invite, which is why that step earlier matters. From there, you'll set your own password and turn on two-factor authentication. Nobody hands you a password to type in. You create your own, and only you know it.",
      ],
    },
    {
      id: 'inside-the-vault',
      title: 'What you can do once you are in',
      paragraphs: [
        'Getting in gives you view and download access to the account holder\'s information. You cannot delete files, change owner settings, or manage next of kin. The same is true if you are acting as executor or attorney.',
        'You can mark tasks complete in each section, add notes, deliver private messages the owner scheduled, and download document images.',
      ],
    },
    {
      id: 'stuck',
      title: 'If something feels stuck',
      paragraphs: [
        "If it's been a while and you haven't heard anything, or something doesn't look right, contact support@orderly-affairs.com. A person will look into it. This process is designed to fail safe, meaning if anything is uncertain, it pauses for a human to check rather than guessing in either direction.",
      ],
    },
    {
      id: 'one-more-thing',
      title: 'One more thing',
      paragraphs: [
        "Getting into the Vault gives you the account holder's information. It doesn't, by itself, give you legal authority to act on their behalf. For anything that requires that authority, such as accessing accounts, closing them, or handling the estate, you'll still need to work with an attorney, using the documents and contacts the Vault points you to.",
      ],
    },
  ],
} as const;

export const NOK_INSTRUCTIONS_PATH = '/instructions-for-next-of-kin';
export const NOK_INSTRUCTIONS_PORTAL_PATH = '/next-kin/instructions';
