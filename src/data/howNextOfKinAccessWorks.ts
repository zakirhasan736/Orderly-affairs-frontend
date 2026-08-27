export const NOK_ACCESS_OWNER_GUIDE = {
  title: 'How Next-of-Kin Access Works',
  subtitle: 'A guide for Vault owners',
  company: 'Orderly Affairs Digital, LLC',
  lastUpdated: 'August 27, 2026',
  intro:
    "This guide explains what happens when your Vault unlocks for your next of kin. It replaces the old single master-password approach. Access now goes through a verification process built to protect two things at once: your family should never be locked out, and no one should ever get in while you're still here.",
  shortVersion:
    "Nobody can open your Vault while you're alive unless you invite them in yourself. When something happens to you, whoever is trying to get access has to clear a shared verification process first, no matter who starts it or how. You're notified the moment anyone starts it, before any other check even finishes. That process checks a death certificate, cross-checks it against independent records, confirms the identity of whoever is taking action, your named attorney or executor as well as your next of kin, and gives you a window to stop it if it was started by mistake or in bad faith. Only after all of that clears does your next of kin get in, and even then, nobody is handed your password. They set their own.",
  startPaths: [
    {
      title: 'Your attorney or executor',
      body: "The estate attorney or executor you've named has to verify their own identity first, a government ID plus a live selfie, before they can do anything. Once that clears, they're notified and can start the process, attaching the death certificate or probate filing they already hold.",
    },
    {
      title: 'A next of kin request',
      body: "Someone you've named as next of kin logs in, requests access, and uploads a death certificate for review.",
    },
    {
      title: 'Missed check-ins',
      body: "If you've turned on scheduled check-ins and you miss them for the full notification window, we don't unlock the Vault automatically. Instead, we ask your next of kin whether they've actually heard from you. If they say you're fine, the clock pauses and you're notified a check-in was missed. If they're not sure, we simply run the independent records check sooner. If they confirm you've passed, it converts into the same request-and-verify process as option 2 above.",
    },
  ],
  onceStarted: [
    "You're notified on every channel you have on file, email, text, and in the app, when a death certificate is stored and the 7-day hold starts. Not after any other check finishes. This gives you the earliest possible chance to see it and stop it if it wasn't you.",
    'A death certificate is required in every after-death case, even when your attorney initiates it. After it is stored privately, we run an owner death-record check through Didit against independent U.S. mortality records. That check is not a guarantee that a particular file is unaltered.',
    'The name and date of death are cross-checked against independent public mortality records, separately from the document check above.',
    "If you haven't responded once that window closes, we move forward only if every other gate is also met. When a death certificate is stored, you get a security alert immediately and we wait a full 7 days (168 hours), with reminders on day 2, day 4, and a final reminder on day 6. You can stop it with I Am Alive. That window is never shortened. Missed check-ins are not a live automatic unlock path.",
    "Your next of kin has to clear one more check before anything releases: a government-issued ID (driver's license or passport) plus a live selfie, checked through an identity verification service called Didit, matched against the name, date of birth, and phone number they verified when you named them. This confirms the specific person claiming access is the one you actually named, not just anyone holding onto their phone.",
    "If you respond at any point along the way, the request is cancelled and logged. Nothing about your Vault changes. If you don't, and your next of kin clears the identity check above, an Orderly Affairs admin still has to release access. Then they get a one-time claim link (valid 72 hours) and a code sent to the phone number they verified when you named them. They set their own password and turn on two-factor authentication before they can see anything.",
    "If the document fails the authenticity check, the extracted details come back low-confidence, or the identity check above can't confidently confirm a match, the Vault stays locked and the request is escalated for a person on our team to review by hand within 48 hours. It doesn't get released on a technicality, and it doesn't get released without a person confirming it should be.",
  ],
  afterTheyAreIn: [
    'Access is read-only for the files that are there. Next of kin, and an executor or attorney who claims through this process, cannot delete vault files. They can view and download document images.',
    'They can carry out the work in each section: mark tasks complete, add notes, and deliver private messages. They set their own password on a one-time claim link after identity verification — nobody is given your password.',
  ],
  whatToDoNow: [
    'Name at least one next of kin in Access Management, and add a backup if you can. Whoever you name has to accept the invite themselves and verify their own email and phone number. That verified phone number is what makes the claim process at the end secure, so it needs to happen well before it\'s ever needed, not after.',
    "Let your next of kin know that when the time comes, they'll also need to complete a quick government-ID and selfie check as part of claiming access. There's nothing for them to do about it now, just something worth knowing ahead of time so it doesn't catch them off guard.",
    "Keep your own email, phone number, and any other notification channel current. That's what gives you the chance to stop a false trigger before anything releases.",
    'Check-ins run every 30 days. If you miss one, three reminders go out over two weeks. That is how the process can start if no one else knows to initiate it.',
    "Sign the separate authorization allowing Orderly Affairs to collect and use your death certificate and related information for this purpose. Without it, we can't act on a death certificate even after your next of kin uploads one. That authorization is a standalone document, not buried in these instructions, so you know exactly what you're agreeing to.",
  ],
  whatThisIsnt:
    "This process controls access to your Vault. It doesn't transfer legal authority over your estate, and it isn't a substitute for a will, trust, or power of attorney. Whoever gets into your Vault still needs to work with an attorney for anything that requires legal authority to act on your behalf. Orderly Affairs doesn't give legal, tax, or medical advice, and nothing here should be read as any of those.",
  questions:
    "Reach us at support@orderly-affairs.com. If you want to change who's named as your next of kin, adjust your check-in cadence, or revisit your authorization, you can do all of that from Access Management at any time while you're living.",
} as const;

export const NOK_ACCESS_PUBLIC_COPY = {
  title: 'How Next-of-Kin Access Works',
  subtitle: 'Your Vault, protected on both ends',
  lastUpdated: 'August 27, 2026',
  sections: [
    {
      id: 'both-ends',
      title: 'Your Vault, protected on both ends',
      paragraphs: [
        "Your Vault stays private while you're living. Nobody, not even the people you've named as next of kin, can see inside it unless you invite them in yourself.",
        "When something happens to you, your family shouldn't be locked out searching for a password. But a password sitting in a drawer, with nothing checking who's using it or when, is its own risk: anyone who finds it gets in, whether that's the right person or not. Orderly Affairs is built to close both gaps at once. Getting in after you're gone still requires clearing a verification process, and nobody, including your family, is ever handed your password to do it.",
      ],
    },
    {
      id: 'how-it-starts',
      title: 'How the process starts',
      intro:
        'There are three ways it can begin, and all of them lead to the same checks below.',
      bullets: [
        {
          title: 'Your named next of kin requests access.',
          body: 'They log in and upload a death certificate for review.',
        },
        {
          title: 'Your attorney or executor starts it.',
          body: "If you've named one, they verify their own identity first, a photo ID plus a quick live selfie, then initiate the process directly, attaching the death certificate or probate filing they already hold.",
        },
        {
          title: 'You miss scheduled check-ins.',
          body: "This is optional. If you turn it on, we don't unlock anything automatically just because you missed a check-in. We ask your next of kin whether they've actually heard from you first. If they say you're fine, everything pauses and you're notified. If they're not sure, we simply verify sooner rather than waiting out the full window. Only a confirmed report moves it into the same process as the other two paths.",
        },
      ],
    },
    {
      id: 'before-unlock',
      title: 'What has to happen before anything unlocks',
      intro:
        'No matter which path starts it, the same shared process runs:',
      paragraphs: [
        "You're notified on every contact method you have on file, email, push, and in the app, when a death certificate is stored and the 7-day hold starts. Not after anything else finishes first. If you're alive and choose I Am Alive, the request is frozen and nothing about your Vault changes.",
        'After a death certificate is stored privately, an owner death-record check runs through Didit against independent U.S. mortality records. That check is not a claim that a particular file is genuine or unaltered, and it does not unlock the Vault.',
        "If anything about the document can't be confidently verified, your Vault doesn't unlock and doesn't get rejected either. It goes to a person on our team to review by hand.",
        "Once that window closes without a response from you, whoever is completing the claim has to confirm their own identity too: a photo of a government-issued ID and a quick live selfie, matched against the contact details they verified when they were named. This confirms the specific person you named is the one getting in, not just anyone holding onto their phone. Your attorney or executor goes through that same identity check earlier, at the moment they start the process, not at the end. If a match can't be confidently confirmed, the same rule applies: it doesn't unlock, and it doesn't get rejected outright. A person reviews it by hand, usually within 48 hours.",
        "Only after the document checks, the notification window, and every identity check involved all clear does an admin release access, and even then, your next of kin doesn't receive your password. They get a one-time link (valid 72 hours), a code sent to their own verified phone, and they set a password of their own.",
        'Inside the Vault they can view and download files, mark tasks complete, add notes, and deliver private messages. They cannot delete files. The same rules apply to an executor or attorney who is granted access this way.',
      ],
    },
    {
      id: 'waiting',
      title: 'Why the waiting period exists',
      paragraphs: [
        "It's not there to slow your family down for its own sake. It's there so a single mistake, a false report, an estranged relative, a bad-faith attempt, can be caught and stopped before it does any damage. When a death certificate is uploaded, the wait is 7 days, with a note on your account and reminders every 2 days. It is never skipped.",
      ],
    },
    {
      id: 'set-up-now',
      title: 'What to set up now, not later',
      paragraphs: [
        'Name a next of kin, and give them time to accept the invite and verify their own email and phone number. That verification is what makes their access secure later, so it has to happen in advance. You must sign the death certificate authorization in your Vault before naming anyone for after-death access.',
        "Keep your own contact information current. That's what gives you the chance to stop a false trigger before it ever reaches your family.",
        "It also helps for your next of kin, and your attorney or executor if you've named one, to have a valid, unexpired photo ID on hand for when the time comes. There's nothing to submit now. It's just worth knowing about in advance so it doesn't slow things down later.",
      ],
    },
    {
      id: 'what-this-isnt',
      title: "What this isn't",
      paragraphs: [
        "This process controls who can open your Vault. It doesn't replace a will, trust, or power of attorney, and it doesn't hand anyone legal authority over your estate. Orderly Affairs doesn't provide legal, tax, or medical advice. For anything that requires legal authority, your family will still need to work with an attorney, using what the Vault points them to.",
      ],
    },
  ],
} as const;
