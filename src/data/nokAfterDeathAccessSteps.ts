/** What named next of kin do after the owner passes — not a printed password card. */
export const NOK_AFTER_DEATH_ACCESS_STEPS = [
  {
    title: 'Open the next-of-kin portal',
    body: 'They use the Next of Kin sign-in page from the invite email — not the owner dashboard. Upon-death access stays closed while you are living.',
  },
  {
    title: 'Verify their identity',
    body: 'At first sign-in they set a password, turn on two-factor authentication, then complete a government ID and live selfie (Didit) before the portal opens.',
  },
  {
    title: 'Report a passing',
    body: 'After identity is Approved they can report that you have passed. This does not unlock the vault.',
  },
  {
    title: 'Upload a death certificate',
    body: 'A certified copy often takes one to three weeks. The 7-day owner hold, owner emails, and independent death-record check start when that file is stored.',
  },
  {
    title: 'Wait the 7-day hold',
    body: 'You are notified immediately and reminded on days 2, 4, and 6. You can stop the request with I Am Alive. The vault stays sealed.',
  },
  {
    title: 'Admin release, then they claim access',
    body: 'Independent death records are checked. An Orderly Affairs admin must release access by hand. They then get a one-time claim link (72 hours) and a code to their verified phone. They set their own password and turn on two-factor authentication. Nobody is given yours.',
  },
  {
    title: 'Use the vault',
    body: 'View and download only. They can complete checklists, add notes, and deliver private messages. They cannot change your next of kin or delete vault files.',
  },
] as const;
