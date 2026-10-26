// Terms of use for company owners who create an assistant (en, de, pl). DRAFT, not legal advice: have it reviewed by a lawyer
// (especially the liability clause, the data processing agreement and the choice of law) before the service goes public.
const { renderDoc } = require('./legalDocs');

const TERMS_VERSION = '2026-10-26'; // stored with every acceptance; change it when the text changes materially

const TEXT = {
  en: {
    title: 'Terms of use for company owners',
    updated: 'Last updated: 26 October 2026',
    back: 'Back',
    sections: [
      { h: '1. Scope', p: [
        'These terms apply when you create and run an AI sales assistant ("assistant") with this service, operated by {operator}. The service is offered to businesses only. Visitors who chat with an assistant are not parties to these terms; the privacy policy applies to them.'] },
      { h: '2. Your content and your responsibility', p: [
        'You are responsible for everything you enter (descriptions, prices, texts, logo) and for what your assistant tells visitors on the basis of your instructions. The assistant is generated with AI and can make mistakes: check it after creating it, keep prices and facts up to date and correct it when something is wrong. You need the rights to everything you upload or enter.'] },
      { h: '3. Rules', p: [
        'Do not use the service for anything unlawful, misleading or harmful: for example illegal goods or services, fraud, hate speech, adult content, impersonating another person or company, malware, or personal data of third parties in your descriptions. Content is checked automatically. We may pause or delete an assistant that breaks these rules or that visitors report, and we may refuse to create one.'] },
      { h: '4. Legal notice (Impressum) and other duties as a provider', p: [
        'If your assistant addresses customers in Germany or in another country that requires you to identify yourself as a provider of an online offer, you must provide your own legal notice (Impressum) for it. Use the fields "Legal notice of your company" in the assistant form: either a link to the legal notice on your website or the text itself. It is then shown in the footer of your assistant\'s page. The legal notice of the operator identifies the operator only and does not replace yours. You are responsible for it being complete and correct. Other duties that apply to you (for example price indication, information on distance contracts, advertising rules) stay with you.'] },
      { h: '5. Contact requests and data protection', p: [
        'Visitors can send contact requests to you through your assistant. After you receive a request (by e-mail or in the edit page), you are the controller under data protection law for what you do with it: you must inform the person as required, answer or delete the request in time and keep the data secure. We process the request on your behalf only to store it for a limited time and pass it on to you. Where required, we conclude a data processing agreement (Art. 28 GDPR) with you; write to {email}.'] },
      { h: '6. Access key', p: [
        'You get a secret key to edit your assistant. Keep it safe: whoever has it can change your assistant. If you lose it, contact us at {email}.'] },
      { h: '7. Availability and changes', p: [
        'We provide the service as available and do not promise uninterrupted operation. AI providers or other services may fail or change. We may change or end the service or parts of it; we will give notice in good time if you are affected.'] },
      { h: '8. Liability', p: [
        'We are liable without limit for intent, gross negligence, injury to life, body or health and where the law requires it. For slight negligence we are liable only for the breach of essential contractual duties and limited to typical, foreseeable damage. We are not liable for statements an assistant makes on the basis of your instructions; that is covered by section 2.'] },
      { h: '9. Ending', p: [
        'You can delete your assistant at any time on its edit page. We may end the use of the service for good cause, in particular if you break section 3 or 4.'] },
      { h: '10. Law and contact', p: [
        'German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. Contact: {email}.'] }
    ]
  },
  de: {
    title: 'Nutzungsbedingungen für Unternehmen',
    updated: 'Stand: 26. Oktober 2026',
    back: 'Zurück',
    sections: [
      { h: '1. Geltungsbereich', p: [
        'Diese Bedingungen gelten, wenn Sie mit diesem Dienst, betrieben von {operator}, einen KI-Verkaufsassistenten („Assistent“) erstellen und betreiben. Der Dienst richtet sich ausschließlich an Unternehmer. Besucher, die mit einem Assistenten chatten, sind nicht Partei dieser Bedingungen; für sie gilt die Datenschutzerklärung.'] },
      { h: '2. Ihre Inhalte und Ihre Verantwortung', p: [
        'Sie sind verantwortlich für alles, was Sie eingeben (Beschreibungen, Preise, Texte, Logo), und für das, was Ihr Assistent Besuchern auf Grundlage Ihrer Vorgaben mitteilt. Der Assistent wird mit KI erzeugt und kann Fehler machen: Prüfen Sie ihn nach der Erstellung, halten Sie Preise und Angaben aktuell und korrigieren Sie ihn, wenn etwas nicht stimmt. Sie benötigen die Rechte an allem, was Sie hochladen oder eingeben.'] },
      { h: '3. Regeln', p: [
        'Nutzen Sie den Dienst nicht für Rechtswidriges, Irreführendes oder Schädliches: etwa illegale Waren oder Leistungen, Betrug, Hassrede, nicht jugendfreie Inhalte, die Ausgabe als andere Person oder anderes Unternehmen, Schadsoftware oder personenbezogene Daten Dritter in Ihren Beschreibungen. Inhalte werden automatisch geprüft. Wir können einen Assistenten pausieren oder löschen, der gegen diese Regeln verstößt oder den Besucher melden, und wir können die Erstellung ablehnen.'] },
      { h: '4. Impressum und weitere Anbieterpflichten', p: [
        'Wenn sich Ihr Assistent an Kunden in Deutschland oder in einem anderen Land richtet, das eine Anbieterkennzeichnung verlangt, müssen Sie dafür Ihr eigenes Impressum bereitstellen. Nutzen Sie dazu die Felder „Impressum Ihres Unternehmens“ im Formular des Assistenten: entweder einen Link zum Impressum auf Ihrer Website oder den Text selbst. Es wird dann in der Fußzeile der Seite Ihres Assistenten angezeigt. Das Impressum des Betreibers kennzeichnet nur den Betreiber und ersetzt Ihres nicht. Sie sind für Vollständigkeit und Richtigkeit verantwortlich. Weitere Pflichten, die Sie treffen (z. B. Preisangaben, Informationen zu Fernabsatzverträgen, Werberegeln), verbleiben bei Ihnen.'] },
      { h: '5. Kontaktanfragen und Datenschutz', p: [
        'Besucher können Ihnen über Ihren Assistenten Kontaktanfragen senden. Nachdem Sie eine Anfrage erhalten haben (per E-Mail oder auf der Bearbeitungsseite), sind Sie datenschutzrechtlich Verantwortlicher für Ihren Umgang damit: Sie müssen die Person wie vorgeschrieben informieren, die Anfrage rechtzeitig beantworten oder löschen und die Daten sichern. Wir verarbeiten die Anfrage in Ihrem Auftrag nur, um sie für begrenzte Zeit zu speichern und an Sie weiterzuleiten. Soweit erforderlich, schließen wir mit Ihnen einen Auftragsverarbeitungsvertrag (Art. 28 DSGVO); schreiben Sie an {email}.'] },
      { h: '6. Zugangsschlüssel', p: [
        'Sie erhalten einen geheimen Schlüssel zum Bearbeiten Ihres Assistenten. Bewahren Sie ihn sicher auf: Wer ihn hat, kann Ihren Assistenten ändern. Wenn Sie ihn verlieren, kontaktieren Sie uns unter {email}.'] },
      { h: '7. Verfügbarkeit und Änderungen', p: [
        'Wir stellen den Dienst im Rahmen der Verfügbarkeit bereit und versprechen keinen unterbrechungsfreien Betrieb. KI-Anbieter oder andere Dienste können ausfallen oder sich ändern. Wir können den Dienst oder Teile davon ändern oder beenden; wenn Sie betroffen sind, kündigen wir dies rechtzeitig an.'] },
      { h: '8. Haftung', p: [
        'Wir haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit, Verletzung von Leben, Körper oder Gesundheit sowie soweit das Gesetz es zwingend vorschreibt. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den typischen, vorhersehbaren Schaden. Für Aussagen, die ein Assistent auf Grundlage Ihrer Vorgaben macht, haften wir nicht; dazu gilt Abschnitt 2.'] },
      { h: '9. Beendigung', p: [
        'Sie können Ihren Assistenten jederzeit auf seiner Bearbeitungsseite löschen. Wir können die Nutzung des Dienstes aus wichtigem Grund beenden, insbesondere bei Verstößen gegen Abschnitt 3 oder 4.'] },
      { h: '10. Recht und Kontakt', p: [
        'Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Kontakt: {email}.'] }
    ]
  },
  pl: {
    title: 'Regulamin dla właścicieli firm',
    updated: 'Stan na: 26 października 2026',
    back: 'Wstecz',
    sections: [
      { h: '1. Zakres', p: [
        'Regulamin obowiązuje, gdy tworzysz i prowadzisz asystenta sprzedaży AI („asystenta”) w tej usłudze, prowadzonej przez {operator}. Usługa jest skierowana wyłącznie do przedsiębiorców. Odwiedzający rozmawiający z asystentem nie są stroną tego regulaminu; dotyczy ich polityka prywatności.'] },
      { h: '2. Twoje treści i Twoja odpowiedzialność', p: [
        'Odpowiadasz za wszystko, co wpisujesz (opisy, ceny, teksty, logo) oraz za to, co Twój asystent mówi odwiedzającym na podstawie Twoich wytycznych. Asystent jest tworzony przez AI i może się mylić: sprawdź go po utworzeniu, aktualizuj ceny i informacje oraz popraw go, gdy coś się nie zgadza. Musisz mieć prawa do wszystkiego, co przesyłasz lub wpisujesz.'] },
      { h: '3. Zasady', p: [
        'Nie używaj usługi do celów niezgodnych z prawem, wprowadzających w błąd lub szkodliwych: np. nielegalnych towarów lub usług, oszustw, mowy nienawiści, treści dla dorosłych, podszywania się pod inną osobę lub firmę, złośliwego oprogramowania ani danych osobowych osób trzecich w opisach. Treści są sprawdzane automatycznie. Możemy wstrzymać lub usunąć asystenta, który łamie te zasady lub został zgłoszony przez odwiedzających, i możemy odmówić jego utworzenia.'] },
      { h: '4. Informacje prawne (Impressum) i inne obowiązki usługodawcy', p: [
        'Jeśli Twój asystent jest skierowany do klientów w Niemczech lub w innym kraju, który wymaga oznaczenia usługodawcy, musisz podać dla niego własne informacje prawne (Impressum). Użyj pól „Informacje prawne Twojej firmy” w formularzu asystenta: albo link do informacji prawnych na Twojej stronie, albo sam tekst. Zostaną one pokazane w stopce strony Twojego asystenta. Impressum operatora oznacza tylko operatora i nie zastępuje Twojego. Odpowiadasz za jego kompletność i poprawność. Inne obowiązki, które Cię dotyczą (np. podawanie cen, informacje o umowach zawieranych na odległość, zasady reklamy), pozostają po Twojej stronie.'] },
      { h: '5. Zgłoszenia kontaktowe i ochrona danych', p: [
        'Odwiedzający mogą wysyłać Ci zgłoszenia kontaktowe przez Twojego asystenta. Po otrzymaniu zgłoszenia (e-mailem lub na stronie edycji) jesteś administratorem danych w rozumieniu przepisów o ochronie danych w zakresie tego, co z nim robisz: musisz poinformować osobę zgodnie z przepisami, odpowiedzieć na zgłoszenie lub je w porę usunąć i zabezpieczyć dane. My przetwarzamy zgłoszenie w Twoim imieniu tylko po to, aby przechować je przez ograniczony czas i przekazać Tobie. Jeśli jest to wymagane, zawieramy z Tobą umowę powierzenia przetwarzania (art. 28 RODO); napisz na {email}.'] },
      { h: '6. Klucz dostępu', p: [
        'Otrzymujesz tajny klucz do edycji asystenta. Przechowuj go bezpiecznie: kto go ma, może zmienić Twojego asystenta. Jeśli go zgubisz, skontaktuj się z nami: {email}.'] },
      { h: '7. Dostępność i zmiany', p: [
        'Świadczymy usługę w miarę dostępności i nie obiecujemy nieprzerwanego działania. Dostawcy AI i inne usługi mogą ulec awarii lub zmianie. Możemy zmienić lub zakończyć usługę albo jej części; jeśli Cię to dotyczy, powiadomimy Cię z odpowiednim wyprzedzeniem.'] },
      { h: '8. Odpowiedzialność', p: [
        'Odpowiadamy bez ograniczeń za winę umyślną, rażące niedbalstwo, szkody na życiu, ciele lub zdrowiu oraz w zakresie, w jakim wymaga tego prawo. Za lekkie niedbalstwo odpowiadamy tylko w razie naruszenia istotnych obowiązków umownych i do wysokości typowej, przewidywalnej szkody. Nie odpowiadamy za wypowiedzi asystenta oparte na Twoich wytycznych; dotyczy tego punkt 2.'] },
      { h: '9. Zakończenie', p: [
        'Możesz w każdej chwili usunąć asystenta na jego stronie edycji. Możemy zakończyć korzystanie z usługi z ważnego powodu, w szczególności w razie naruszenia punktu 3 lub 4.'] },
      { h: '10. Prawo i kontakt', p: [
        'Obowiązuje prawo niemieckie z wyłączeniem Konwencji ONZ o umowach międzynarodowej sprzedaży towarów. Kontakt: {email}.'] }
    ]
  }
};

const renderTermsPage = (lang, env = process.env) => renderDoc('/terms', TEXT, lang, env);

module.exports = { renderTermsPage, TERMS_VERSION, TEXT };
