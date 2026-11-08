import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Address, LegalLayout } from "@/components/legal-layout";
import { getLegalInfo } from "@/lib/legal";
import { statsEnabled } from "@/lib/stats";

export const metadata: Metadata = { title: "Datenschutz – gitsorted" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Datenschutzerklärung">
      <Suspense fallback={null}>
        <Privacy />
      </Suspense>
    </LegalLayout>
  );
}

async function Privacy() {
  await connection();
  const legal = getLegalInfo();
  if (!legal) notFound();
  const stats = statsEnabled();

  return (
    <>
      <section>
        <h2>Kurz gesagt</h2>
        <ul>
          <li>
            Deine Anmeldung und dein GitHub-Zugang liegen nur verschlüsselt in
            Cookies in deinem Browser – nicht auf unserem Server.
          </li>
          <li>
            Deine Repositories werden bei jedem Aufruf live bei GitHub abgefragt
            und nicht gespeichert.
          </li>
          {stats ? (
            <li>
              Gespeichert werden nur anonyme Gesamtzahlen (z. B. „Repos
              gelöscht“) und ein nicht umkehrbarer Kennwert pro Account, damit
              niemand doppelt gezählt wird.
            </li>
          ) : (
            <li>Auf dem Server wird nichts über dich gespeichert.</li>
          )}
          <li>Keine Analyse-, Werbe- oder Tracking-Dienste.</li>
        </ul>
      </section>

      <section>
        <h2>Verantwortlicher</h2>
        <p>{legal.name}</p>
        <Address lines={legal.address} />
        <p>
          E-Mail: <a href={`mailto:${legal.email}`}>{legal.email}</a>
          {legal.phone && (
            <>
              <br />
              Telefon: {legal.phone}
            </>
          )}
        </p>
      </section>

      <section>
        <h2>Hosting und Server-Protokolle</h2>
        <p>
          {legal.hosting
            ? `gitsorted läuft auf Servern von ${legal.hosting}.`
            : "gitsorted läuft auf einem gemieteten Server."}{" "}
          Beim Aufruf verarbeitet der Server technisch notwendige Daten wie
          IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserkennung, um die
          Seite auszuliefern und den sicheren Betrieb zu gewährleisten.
          Protokolle werden nur kurzfristig zur Fehlersuche vorgehalten.
        </p>
        <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb).</p>
      </section>

      <section>
        <h2>Anmeldung mit GitHub</h2>
        <p>
          Zur Anmeldung leiten wir dich zu GitHub weiter (GitHub, Inc., 88 Colin
          P. Kelly Jr. Street, San Francisco, CA 94107, USA). Nach deiner
          Zustimmung übermittelt GitHub uns deine GitHub-Kennung, deinen Namen,
          deine E-Mail-Adresse, dein Profilbild und einen Zugangsschlüssel mit
          den Rechten, deine Repositories zu lesen, zu archivieren und zu
          löschen.
        </p>
        <p>
          Diese Daten speichern wir ausschließlich verschlüsselt in Cookies in
          deinem Browser. Die Anmeldung läuft nach spätestens 7 Tagen ab oder
          endet, wenn du dich abmeldest. Dein Profilbild wird direkt von GitHub
          geladen.
        </p>
        <p>
          GitHub ist nach dem EU-US Data Privacy Framework zertifiziert. Für die
          Verarbeitung bei GitHub gilt die{" "}
          <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">
            Datenschutzerklärung von GitHub
          </a>
          . Den Zugriff von gitsorted kannst du jederzeit unter{" "}
          <a href="https://github.com/settings/applications">
            GitHub → Settings → Applications
          </a>{" "}
          widerrufen.
        </p>
        <p>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der von
          dir genutzten Funktionen).
        </p>
      </section>

      <section>
        <h2>Deine Repositories</h2>
        <p>
          Die Liste deiner Repositories (Name, Beschreibung, Daten, Größe usw.)
          wird bei jedem Aufruf über die GitHub-Schnittstelle abgefragt, nur zur
          Anzeige verarbeitet und nicht gespeichert. Archivieren und Löschen
          führen wir ausschließlich auf deine ausdrückliche Anweisung bei GitHub
          aus.
        </p>
        <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Wir setzen nur Cookies, die für die Anmeldung technisch notwendig sind
          (§ 25 Abs. 2 Nr. 2 TDDDG). Sie enthalten deine verschlüsselte Sitzung
          und werden beim Abmelden gelöscht. Schriftarten liegen auf unserem
          Server; es werden keine Inhalte von Drittanbietern außer den
          Profilbildern von GitHub geladen.
        </p>
      </section>

      {stats && (
        <section>
          <h2>Anonyme Statistik</h2>
          <p>
            Auf der Startseite zeigen wir, wie viele Repositories insgesamt mit
            gitsorted gelöscht und archiviert wurden, wie viel Speicher dabei
            frei wurde und wie viele Accounts aufgeräumt haben. Dafür speichern
            wir nach einem Löschen oder Archivieren nur die Gesamtzahlen.
          </p>
          <p>
            Damit ein Account nicht mehrfach zählt, speichern wir zusätzlich
            einen Kennwert, der mit einem geheimen Schlüssel aus deiner
            GitHub-Kennung berechnet wird. Daraus lässt sich deine Kennung nicht
            zurückrechnen; Namen, Repository-Namen oder Zugangsschlüssel
            speichern wir nicht. Die Daten liegen in einer Datenbank auf
            demselben Server.
          </p>
          <p>
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
            an einer öffentlichen, anonymen Nutzungsstatistik). Du kannst
            jederzeit widersprechen: Schreib uns deinen GitHub-Benutzernamen,
            dann löschen wir den zugehörigen Kennwert.
          </p>
        </section>
      )}

      <section>
        <h2>Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art.
          16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
          Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Schreib dazu
          an <a href={`mailto:${legal.email}`}>{legal.email}</a>.
        </p>
        <p>
          Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde
          beschweren
          {legal.authority ? `, zum Beispiel bei: ${legal.authority}.` : "."}
        </p>
      </section>

      <section>
        <h2>Stand</h2>
        <p>
          November 2026. Siehe auch das <Link href="/impressum">Impressum</Link>
          .
        </p>
      </section>
    </>
  );
}
