import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
  description: "The rules for using and contributing to the USAPhO Guide.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms cover your use of the USAPhO Guide at usapho.one (&ldquo;the
        Guide&rdquo;), run by Shlok Madhekar. By using the Guide you agree to them.
        If you don&apos;t agree, please don&apos;t use the site.
      </p>

      <h2>The Guide</h2>
      <p>
        The Guide is a free, open-source study resource for the F=ma exam and the
        US Physics Olympiad. It is a volunteer project and is <b>not affiliated with,
        endorsed by, or sponsored by the American Association of Physics Teachers
        (AAPT)</b> or the organizers of any exam.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You don&apos;t need an account to use the Guide. Accounts only save your progress and allow contributing.</li>
        <li>You must be at least 13 to create an account.</li>
        <li>Give a real email address, keep your password private, and let us know if you think someone else has used your account.</li>
        <li>You can stop using your account at any time and ask us to delete it.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>Use the Guide during an official exam, or in any way that breaks a competition&apos;s rules.</li>
        <li>Try to break, overload or get around the security of the site, or access other people&apos;s data.</li>
        <li>Scrape or copy the site in a way that harms it or breaks the license below.</li>
        <li>Submit spam, harassment, or content you don&apos;t have the right to share through the editor or our community.</li>
        <li>Pretend to be someone else, or misuse contributor tools.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules.</p>

      <h2>Content and license</h2>
      <p>
        Unless marked otherwise, the Guide&apos;s lessons, problems, simulations and
        code are licensed under{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">
          CC BY-NC-SA 4.0
        </a>
        . You may share and adapt them for non-commercial purposes if you credit
        the USAPhO Guide (usapho.one) and release your adaptations under the same
        license.
      </p>
      <p>
        Past exam problems are cited and linked rather than copied, and they belong
        to their original publishers. Names such as F=ma, USAPhO and AAPT, and any
        other trademarks, belong to their owners.
      </p>

      <h2>Your contributions</h2>
      <p>
        When you submit a lesson, problem, simulation or fix (through the editor or
        a pull request), you confirm that you wrote it or have the right to share
        it, and you license it under CC BY-NC-SA 4.0 like the rest of the Guide.
        Contributions are reviewed and may be edited, combined or removed. Your
        GitHub username and commits are public and may be credited on the{" "}
        <Link prefetch={false} href="/contributors">contributors page</Link>.
      </p>

      <h2>Community</h2>
      <p>
        Our Discord server is run on Discord, so Discord&apos;s terms apply there,
        along with the server&apos;s own rules. Be respectful and keep it about physics.
      </p>

      <h2>No guarantees</h2>
      <p>
        We work hard to get things right, but the Guide is written by students and
        volunteers and may contain mistakes, including wrong answers. It is provided
        &ldquo;as is&rdquo;, without warranties of any kind, and is not a replacement for
        official exam materials or a teacher. Using it does not guarantee any exam
        score or award. If you find an error, please{" "}
        <a href="https://github.com/shlok-madhekar/usapho-guide/issues" target="_blank" rel="noopener noreferrer">
          report it
        </a>
        .
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent the law allows, the people who run and contribute to the
        Guide are not liable for any indirect or consequential damages, or for any
        loss arising from your use of the site. The Guide is free, and our total
        liability for any claim is limited to zero dollars.
      </p>

      <h2>Changes and ending</h2>
      <p>
        We may change or stop the Guide, or update these terms, at any time. If the
        terms change, we will update the date at the top. Continuing to use the
        site after that means you accept the new terms.
      </p>

      <h2>Law</h2>
      <p>These terms are governed by the laws of the State of California, USA.</p>

      <h2>Contact</h2>
      <p>
        Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{" "}
        <Link prefetch={false} href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
