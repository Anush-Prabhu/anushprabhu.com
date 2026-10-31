// Singleton profile facts. Source: resume (Oct 2026). Phone number deliberately excluded.
// `headline` is placeholder positioning copy pending the owner's wording (see CLAUDE.md open questions).

export const profile = {
  name: 'Anush Prabhu',
  user: 'anush',
  host: 'portfolio',
  headline: 'I secure identity, detection and AI systems, and automate the work around them.',
  facts:
    'Finishing an MS in Security Informatics at Johns Hopkins (May 2026). Based in Baltimore. Previously at Bank of America, Jio Platforms and Johns Hopkins Medicine.',
  focus:
    'Detection engineering with Splunk and Wazuh, identity automation across Active Directory, Kerberos and gMSA, and AI with guardrails that stays grounded in approved sources. Compliance work under NIST, HIPAA and SOC 2.',
  location: 'Baltimore, MD',
  /** Undecided — see CLAUDE.md open question 1. Contact surfaces must handle `null`. */
  email: null as string | null,
  github: 'https://github.com/Anush-Prabhu',
  linkedin: 'https://www.linkedin.com/in/anush-prabhu/',
  /** Redacted PDF arrives in Milestone 5. */
  resumeUrl: null as string | null,
  placeholder: true,
} as const

export const site = {
  url: 'https://anushprabhu.com',
  title: 'Anush Prabhu',
  description:
    'Anush Prabhu — security engineering, identity automation and applied AI. Experience, projects and research.',
}
