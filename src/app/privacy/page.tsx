import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
  description: "What the USAPhO Guide collects, why, and how to have it deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        The USAPhO Guide (usapho.one, &ldquo;the Guide&rdquo;, &ldquo;we&rdquo;) is a free,
        open-source study site for the F=ma exam and the US Physics Olympiad. It is
        run by Shlok Madhekar, a student in California, with help from volunteer
        contributors. This policy explains what we collect when you use the Guide
        and what we do with it.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You can read every lesson and work every problem without an account.</li>
        <li>
          We keep basic usage numbers (which pages are read, where visitors came
          from, how many answers are checked) so we can tell what helps. They are
          tied to a random ID, not to your name, unless you are signed in.
        </li>
        <li>We do not sell your data, show ads, or use advertising trackers.</li>
        <li>
          You can ask us to delete your account and everything linked to it at
          any time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>What we collect</h2>
      <h3>If you create an account</h3>
      <ul>
        <li>Your email address and the display name you choose.</li>
        <li>
          Your password, which is stored only as a secure hash by our
          authentication provider. We never see it.
        </li>
        <li>
          Your progress: which lessons you have marked as reading, practicing,
          complete or skipped, and which problems you have solved, so it follows
          you between devices.
        </li>
        <li>When the account was created and last signed in, and any contributor role.</li>
      </ul>

      <h3>When you use the site (with or without an account)</h3>
      <ul>
        <li>The pages you view and when.</li>
        <li>
          The site or link that brought you here (for example a search engine, or
          a tag like <code>?utm_source=reddit</code> on a link we shared).
        </li>
        <li>
          Actions on the site: checking an answer (and whether it was right),
          answering a quick check, changing a lesson&apos;s status, exporting a PDF,
          clicking a Discord link, and signing up or in.
        </li>
        <li>
          Your approximate country, which our host works out from your IP
          address. We do not store your IP address in our analytics.
        </li>
        <li>Your time zone, browser language, and whether you are on a phone, tablet or computer.</li>
        <li>
          A random visitor ID and session ID saved in your browser, so we can count
          returning visitors. If you are signed in, these events are linked to your
          account.
        </li>
      </ul>
      <p>
        We also use Vercel Web Analytics, which counts page views without cookies
        and reports only totals to us. Our hosting provider, like any web server,
        keeps short-lived request logs (including IP addresses) for security and
        reliability under its own policy.
      </p>

      <h3>If you contribute through the editor</h3>
      <p>
        Connecting GitHub gives the editor a token that is kept only in your
        browser tab (it is cleared when the tab closes) and is used to open a pull
        request under your GitHub account. We do not store it on our servers.
        Pull requests, commits and your GitHub username are public on GitHub, and
        your username may be listed on our{" "}
        <Link prefetch={false} href="/contributors">contributors page</Link>.
      </p>

      <h2>Cookies and browser storage</h2>
      <ul>
        <li><b>Sign-in cookies</b> from our authentication provider keep you logged in.</li>
        <li><b>ug_c</b>: a cookie holding your two-letter country code for analytics. Expires after a day.</li>
        <li><b>ug_vid, ug_sid</b> (local storage): the random visitor and session IDs described above.</li>
        <li><b>Progress and theme</b> (local storage): your progress when signed out, and light or dark mode.</li>
        <li><b>ug_touch, GitHub token</b> (session storage): how you arrived this visit, and the editor token. Both clear when the tab closes.</li>
      </ul>
      <p>
        You can clear these at any time in your browser settings. Clearing them
        signs you out and gives you a new random visitor ID.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To run the site, keep you signed in, and save your progress.</li>
        <li>To find out which lessons and problems help, which are confusing, and which answers might be wrong.</li>
        <li>To see which posts and links bring people to the Guide, and to report overall usage numbers (never anything that identifies you).</li>
        <li>To keep the site secure and prevent abuse.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We do not sell or rent personal information. We use a few providers to run the site:</p>
      <ul>
        <li><b>Supabase</b>: accounts, progress and analytics database, and account emails.</li>
        <li><b>Vercel</b>: hosting and aggregate page-view analytics.</li>
        <li><b>GitHub</b>: the source code, contributions and the contributors list.</li>
      </ul>
      <p>
        Our community is on Discord. If you follow a Discord link, Discord&apos;s
        own terms and privacy policy apply there. We may also disclose information
        if the law requires it, or to protect the safety of users or the site.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account information and progress are kept until you delete your account
        or ask us to. Usage events are kept while the Guide runs, so we can compare
        over time. When an account is deleted, its usage events are unlinked from
        it.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Use the Guide without an account.</li>
        <li>Clear your browser storage, or use a content blocker, to stop or reset analytics.</li>
        <li>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to see,
          correct, export or delete your information. We will answer within 30 days.
        </li>
      </ul>
      <p>
        Depending on where you live (for example California, or the EU and UK),
        you may have further rights under local law. We will honor those requests
        through the same email.
      </p>

      <h2>Children</h2>
      <p>
        The Guide is meant for high school and older students. Accounts are for
        people 13 and older, and we do not knowingly collect personal information
        from children under 13. If you think a child under 13 has made an
        account, email us and we will delete it.
      </p>

      <h2>Where data is stored and how it is protected</h2>
      <p>
        Our providers store data on servers that may be outside your country,
        including in the United States. Connections to the site are encrypted,
        database access is restricted so the public cannot read other people&apos;s
        data, and analytics cannot be read through the public API. No system is
        perfectly secure, but we take reasonable steps to protect what we hold.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, we will update the date at the top of this page.
        Big changes will also be announced on the site or in the Discord.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
