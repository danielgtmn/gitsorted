import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Address, LegalLayout } from "@/components/legal-layout";
import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = { title: "Impressum – gitsorted" };

export default function ImprintPage() {
  return (
    <LegalLayout title="Impressum">
      <Suspense fallback={null}>
        <Imprint />
      </Suspense>
    </LegalLayout>
  );
}

async function Imprint() {
  await connection();
  const legal = getLegalInfo();
  if (!legal) notFound();
  return (
    <>
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>{legal.name}</p>
        <Address lines={legal.address} />
        {legal.note && <p>{legal.note}</p>}
      </section>
      <section>
        <h2>Kontakt</h2>
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
        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
      <section>
        <h2>Quellcode</h2>
        <p>
          gitsorted ist Open Source (MIT-Lizenz):{" "}
          <a href="https://github.com/danielgtmn/gitsorted">
            github.com/danielgtmn/gitsorted
          </a>
          . Diese Instanz wird betrieben von {legal.name}.
        </p>
      </section>
    </>
  );
}
