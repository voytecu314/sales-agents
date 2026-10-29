// Shared by /create and /edit: interface language, texts and the editable agent form.
(function () {
  const LANGS = ['en', 'de', 'pl'];
  const PALETTE_KEYS = ['accent', 'accent2', 'accent3', 'bg', 'panel'];

const TEXT = {
  en: {
    colorsAdjusted: 'Some colors were adjusted slightly so that text stays readable.',
    dTitle: 'Describe your company', dPlaceholder: 'e.g. We are a family-run bakery in Hannover. We sell sourdough bread, cakes for weddings (from 45 EUR) and offer a weekly bread subscription…',
    dHint: 'Write freely: what you sell, prices, who your customers are, how you talk to them, frequent questions, what the agent must never promise, how to reach you. The more you write, the better your agent.',
    gSummary: 'Optional: answer guided questions (alone or in addition to your text)',
    logoLabel: 'Logo (optional)', logoRemove: 'Remove logo', logoHint: 'PNG, JPEG or WebP. It is shrunk automatically and shown in the header of your agent.', logoType: 'Please choose a PNG, JPEG or WebP image.', logoFailed: 'Your agent is live, but the logo could not be uploaded. You can add it on the edit page.',
    eInputsTitle: 'What your agent knows', eInputsHint: 'Change your description and the instructions of your agent are rewritten automatically when you save. The instructions themselves are managed by us.', eBrandTitle: 'Look and texts',
    linkTitle: 'Links that start a conversation', linkHint: 'Put a link with a topic on your website. When a visitor clicks it, your agent answers that topic right away.', linkTopic: 'Topic or question', linkPh: 'e.g. What does a wedding cake cost?', linkCopy: 'Copy link',
    expiresOn: 'Owner key valid until {date}. After that you need a renewal to edit your agent (the agent itself keeps running).', rewritten: 'Saved. The instructions of your agent were rewritten from your description.', savingLong: 'Saving… rewriting the instructions can take up to a minute',
    supportNote: 'Lost your key or is it expired? Contact {email}.', supportNone: 'Lost your key or is it expired? Contact the operator of this service.',
    copyEdit: 'Copy edit link', editLink: 'Edit page',
    rNotifySuggest: 'We found this address in your description and filled it in. Please check it: when you publish, we send a confirmation link to it. Clear the field if you do not want e-mails.',
    rNotify: 'E-mail for contact requests (optional)', rNotifyHint: 'Contact requests are always saved and listed on your edit page. Add an e-mail to also get them by mail; we first send a confirmation link to this address.',
    editTitle: 'Edit your AI sales agent', keyLabel: 'Owner key', keyGo: 'Open', eStatus: 'Status', sActive: 'Online', sPaused: 'Paused (visitors see "unavailable")',
    save: 'Save changes', saving: 'Saving…', saved: 'Saved.', delete: 'Delete agent', deleteConfirm: 'Delete this agent and all its contact requests? This cannot be undone.',
    privacyLink: 'Privacy policy', termsLink: 'Terms of use', impressumLink: 'Legal notice', rLegal: 'Legal notice of your company (Impressum)', rLegalUrl: 'Link to your legal notice', rLegalText: 'or the text of your legal notice', rLegalHint: "Shown in the footer of your agent's page. Required if your agent addresses customers in Germany or another country that asks for it. A link wins if you fill in both.", termsAccept: 'I have read and accept the', termsAccept2: ", including adding my company's legal notice (Impressum) where the law requires it.", termsRequired: 'Please accept the terms of use.', leadsTitle: 'Contact requests', leadConvo: 'Conversation', leadVisitor: 'Visitor', leadAgent: 'Agent', leadsHint: 'The last 50 requests. They are deleted automatically after 90 days.', noLeads: 'No requests yet.',
    usage: 'Messages today: {n} of {cap}', eSettingsTitle: 'Agent status and usage', visitorLimitToggle: 'Limit your agent usage', visitorLimitLabel: 'Requests per visitor per day (leave blank for no limit)', visitorLimitHint: 'This is a lightweight browser-side limit saved in local storage. Visitors can reset it by clearing site data or using another browser; it is not strict abuse protection.', providerHelpGroqPrefix: 'Open ', providerHelpGroqSuffix: ', sign in with your email, go to API Keys, choose Create API Key, then copy or save it (you only see it once!) and paste it here.', providerHelpRequestyPrefix: 'Open ', providerHelpRequestySuffix: ', sign in with email or Google (Google is easiest), go to API Keys, choose Create API Key, then copy or save it (you only see it once!) and paste it here.', providerHelpOpenRouter: 'Use Connect OpenRouter for the secure sign-in flow, or create an API key in your OpenRouter account and paste it here.', providerKeysTitle: 'AI provider keys', providerKeysHint: 'Add your own provider API key. It is tested before saving and stored encrypted. Your key is never shown again.', providerSelect: 'Provider', providerApiKey: 'API key', providerTestSave: 'Test and save key', providerTesting: 'Testing key…', providerSaved: 'Key tested and saved encrypted.', providerConnectOpenRouter: 'Connect OpenRouter', providerOAuthConnected: 'OpenRouter connected. Your key was tested and saved encrypted.', providerOAuthCancelled: 'OpenRouter connection cancelled. No key was saved.', providerOAuthFailed: 'OpenRouter could not complete the connection or key test. Please try again.', providerNoKeys: 'No owner provider keys yet. Until you add one, the platform fallback has a small daily limit.', providerKeyInvalid: 'Provider rejected this key. Remove it and add a valid key.', providerKeyCooldown: 'Temporarily cooling down after provider rate limit.', providerKeyActive: 'Available for this agent.', providerRemove: 'Remove key', providerRemoveConfirm: 'Remove this provider key from this agent?', providerRemoved: 'Provider key removed.', verifyPending: 'Not confirmed yet: open the link we sent to this address. Until then requests are only stored here, not e-mailed.',
    verifyOk: 'Address confirmed. New requests are e-mailed to it.', verifySent: 'Saved. We sent a confirmation link to the new address.', authError: 'This owner key is not valid.',
    title: 'Create your AI sales agent', subtitle: 'Describe your company in your own words. You get a sales agent on its own link.',
    fName: 'Company name', fOffer: 'What do you sell?', fPricing: 'Offer and prices', fAudience: 'Target audience',
    fTone: 'Tone of voice', phTone: 'friendly, professional, short answers…', fLanguage: 'Main language of your customers', auto: 'Detect automatically',
    fColors: 'Brand colors', phColors: 'e.g. navy blue and orange, or #1d4ed8',
    fFaqs: 'FAQs', fRules: 'Rules and limits (what the agent must never promise or say)', fContact: 'Contact options',
    generate: 'Generate my agent', generating: 'Generating… this can take up to a minute',
    reviewHint: 'Review everything. You can change all texts, colors and the instructions of your agent.',
    rName: 'Display name', rEmoji: 'Emoji (optional)', rColors: 'Colors', cBg: 'Background', cPanel: 'Panels',
    rTexts: 'Texts for visitors', rEditing: 'Language you are editing', rTagline: 'Tagline', rWelcome: 'Welcome message',
    qLabel: 'Button text', qSend: 'Message sent on click',
    rPrompt: 'Instructions of your agent (visitors never see this)', back: 'Back', publish: 'Publish my agent', publishing: 'Publishing…',
    providerSetupTitle: 'Recommended next step: connect an AI provider', providerSetupBody: 'Your agent can use a small, limited platform allowance before you add a provider key. Adding your own key connects the agent to your provider account and its available quota or credits.', providerSetupStep1: 'Open the edit page using the button below.', providerSetupStep2: 'Expand “AI provider keys”, choose a provider, then follow the on-page guide. OpenRouter also offers a secure Connect button.', providerSetupStep3: 'Test and save your key. It is encrypted when stored and will not be shown again.', providerSetupFindKeys: 'Get a provider key:', providerSetupCta: 'Set up provider keys',
    doneTitle: 'Your agent is live', doneLink: 'Public link',
    doneKeyHint: 'This is your private owner key. It is shown only once and cannot be recovered. Save it now; you will need it to edit your agent.',
    copyUrl: 'Copy link', copyKey: 'Copy key', copied: 'Copied', open: 'Open agent', errGeneric: 'Something went wrong. Please try again.'
  },
  de: {
    colorsAdjusted: 'Einige Farben wurden leicht angepasst, damit der Text lesbar bleibt.',
    dTitle: 'Beschreiben Sie Ihr Unternehmen', dPlaceholder: 'z. B. Wir sind eine Familienbäckerei in Hannover. Wir verkaufen Sauerteigbrot, Hochzeitstorten (ab 45 EUR) und bieten ein wöchentliches Brot-Abo an…',
    dHint: 'Schreiben Sie frei: was Sie verkaufen, Preise, wer Ihre Kunden sind, wie Sie mit ihnen sprechen, häufige Fragen, was der Agent nie versprechen darf, wie man Sie erreicht. Je mehr Sie schreiben, desto besser wird Ihr Agent.',
    gSummary: 'Optional: Fragen beantworten (allein oder zusätzlich zu Ihrem Text)',
    logoLabel: 'Logo (optional)', logoRemove: 'Logo entfernen', logoHint: 'PNG, JPEG oder WebP. Es wird automatisch verkleinert und im Kopf Ihres Agenten angezeigt.', logoType: 'Bitte wählen Sie ein PNG-, JPEG- oder WebP-Bild.', logoFailed: 'Ihr Agent ist online, aber das Logo konnte nicht hochgeladen werden. Sie können es auf der Bearbeitungsseite hinzufügen.',
    eInputsTitle: 'Was Ihr Agent weiß', eInputsHint: 'Ändern Sie Ihre Beschreibung, und die Anweisungen Ihres Agenten werden beim Speichern automatisch neu geschrieben. Die Anweisungen selbst verwalten wir.', eBrandTitle: 'Aussehen und Texte',
    linkTitle: 'Links, die ein Gespräch starten', linkHint: 'Setzen Sie einen Link mit Thema auf Ihre Website. Klickt ein Besucher darauf, beantwortet Ihr Agent sofort dieses Thema.', linkTopic: 'Thema oder Frage', linkPh: 'z. B. Was kostet eine Hochzeitstorte?', linkCopy: 'Link kopieren',
    expiresOn: 'Besitzer-Schlüssel gültig bis {date}. Danach brauchen Sie eine Verlängerung zum Bearbeiten (der Agent selbst läuft weiter).', rewritten: 'Gespeichert. Die Anweisungen Ihres Agenten wurden aus Ihrer Beschreibung neu geschrieben.', savingLong: 'Wird gespeichert… das Neuschreiben der Anweisungen kann bis zu einer Minute dauern',
    supportNote: 'Schlüssel verloren oder abgelaufen? Kontakt: {email}.', supportNone: 'Schlüssel verloren oder abgelaufen? Wenden Sie sich an den Betreiber dieses Dienstes.',
    copyEdit: 'Bearbeitungslink kopieren', editLink: 'Bearbeiten',
    rNotifySuggest: 'Wir haben diese Adresse in Ihrer Beschreibung gefunden und eingetragen. Bitte prüfen Sie sie: Beim Veröffentlichen senden wir einen Bestätigungslink dorthin. Leeren Sie das Feld, wenn Sie keine E-Mails möchten.',
    rNotify: 'E-Mail für Kontaktanfragen (optional)', rNotifyHint: 'Kontaktanfragen werden immer gespeichert und auf Ihrer Bearbeitungsseite angezeigt. Mit einer E-Mail-Adresse erhalten Sie sie zusätzlich per Mail; wir senden zuerst einen Bestätigungslink.',
    editTitle: 'KI-Verkaufsagenten bearbeiten', keyLabel: 'Besitzer-Schlüssel', keyGo: 'Öffnen', eStatus: 'Status', sActive: 'Online', sPaused: 'Pausiert (Besucher sehen „nicht verfügbar“)',
    save: 'Änderungen speichern', saving: 'Wird gespeichert…', saved: 'Gespeichert.', delete: 'Agenten löschen', deleteConfirm: 'Diesen Agenten und alle Kontaktanfragen löschen? Das lässt sich nicht rückgängig machen.',
    privacyLink: 'Datenschutz', termsLink: 'Nutzungsbedingungen', impressumLink: 'Impressum', rLegal: 'Impressum Ihres Unternehmens', rLegalUrl: 'Link zu Ihrem Impressum', rLegalText: 'oder der Text Ihres Impressums', rLegalHint: 'Wird in der Fußzeile der Seite Ihres Agenten angezeigt. Pflicht, wenn sich Ihr Agent an Kunden in Deutschland oder einem anderen Land mit dieser Anforderung richtet. Ein Link hat Vorrang, wenn Sie beides ausfüllen.', termsAccept: 'Ich habe die', termsAccept2: ' gelesen und akzeptiere sie, einschließlich der Angabe des Impressums meines Unternehmens, wo das Gesetz es verlangt.', termsRequired: 'Bitte akzeptieren Sie die Nutzungsbedingungen.', leadsTitle: 'Kontaktanfragen', leadConvo: 'Gespräch', leadVisitor: 'Besucher', leadAgent: 'Agent', leadsHint: 'Die letzten 50 Anfragen. Sie werden nach 90 Tagen automatisch gelöscht.', noLeads: 'Noch keine Anfragen.',
    usage: 'Nachrichten heute: {n} von {cap}', eSettingsTitle: 'Agentenstatus und Nutzung', visitorLimitToggle: 'Nutzung deines Agenten begrenzen', visitorLimitLabel: 'Anfragen pro Besucher und Tag (leer lassen für kein Limit)', visitorLimitHint: 'Dieses einfache Limit wird im Browser im lokalen Speicher gespeichert. Besucher können es durch Löschen der Websitedaten oder einen anderen Browser zurücksetzen; es ist kein strenger Schutz vor Missbrauch.', providerHelpGroqPrefix: 'Öffne ', providerHelpGroqSuffix: ', melde dich mit deiner E-Mail an, öffne API Keys und wähle Create API Key. Kopiere oder speichere den Schlüssel (du siehst ihn nur einmal!) und füge ihn hier ein.', providerHelpRequestyPrefix: 'Öffne ', providerHelpRequestySuffix: ', melde dich per E-Mail oder Google an (Google ist am einfachsten), öffne API Keys und wähle Create API Key. Kopiere oder speichere den Schlüssel (du siehst ihn nur einmal!) und füge ihn hier ein.', providerHelpOpenRouter: 'Nutze „OpenRouter verbinden“ für die sichere Anmeldung oder erstelle einen API-Schlüssel in deinem OpenRouter-Konto und füge ihn hier ein.', providerKeysTitle: 'KI-Anbieter-Schlüssel', providerKeysHint: 'Fügen Sie Ihren eigenen API-Schlüssel hinzu. Er wird vor dem Speichern getestet und verschlüsselt gespeichert. Der Schlüssel wird danach nicht erneut angezeigt.', providerSelect: 'Anbieter', providerApiKey: 'API-Schlüssel', providerTestSave: 'Schlüssel testen und speichern', providerTesting: 'Schlüssel wird getestet…', providerSaved: 'Schlüssel getestet und verschlüsselt gespeichert.', providerConnectOpenRouter: 'OpenRouter verbinden', providerOAuthConnected: 'OpenRouter verbunden. Der Schlüssel wurde getestet und verschlüsselt gespeichert.', providerOAuthCancelled: 'OpenRouter-Verbindung abgebrochen. Es wurde kein Schlüssel gespeichert.', providerOAuthFailed: 'OpenRouter konnte die Verbindung oder den Schlüsseltest nicht abschließen. Bitte versuchen Sie es erneut.', providerNoKeys: 'Noch keine eigenen Anbieter-Schlüssel. Ohne eigenen Schlüssel gilt ein kleines tägliches Plattform-Limit.', providerKeyInvalid: 'Der Anbieter hat diesen Schlüssel abgelehnt. Entfernen Sie ihn und fügen Sie einen gültigen hinzu.', providerKeyCooldown: 'Nach einer Anbieterdrosselung vorübergehend pausiert.', providerKeyActive: 'Für diesen Agenten verfügbar.', providerRemove: 'Schlüssel entfernen', providerRemoveConfirm: 'Diesen Anbieter-Schlüssel für diesen Agenten entfernen?', providerRemoved: 'Anbieter-Schlüssel entfernt.', verifyPending: 'Noch nicht bestätigt: Öffnen Sie den Link, den wir an diese Adresse gesendet haben. Bis dahin werden Anfragen nur hier gespeichert, nicht per E-Mail verschickt.',
    verifyOk: 'Adresse bestätigt. Neue Anfragen werden per E-Mail an sie gesendet.', verifySent: 'Gespeichert. Wir haben einen Bestätigungslink an die neue Adresse gesendet.', authError: 'Dieser Besitzer-Schlüssel ist ungültig.',
    title: 'Erstellen Sie Ihren KI-Verkaufsagenten', subtitle: 'Beschreiben Sie Ihr Unternehmen. Sie erhalten einen Verkaufsagenten unter eigenem Link.',
    fName: 'Firmenname', fOffer: 'Was verkaufen Sie?', fPricing: 'Angebot und Preise', fAudience: 'Zielgruppe',
    fTone: 'Tonalität', phTone: 'freundlich, professionell, kurze Antworten…', fLanguage: 'Hauptsprache Ihrer Kunden', auto: 'Automatisch erkennen',
    fColors: 'Markenfarben', phColors: 'z. B. Marineblau und Orange oder #1d4ed8',
    fFaqs: 'FAQs', fRules: 'Regeln und Grenzen (was der Agent nie versprechen oder sagen darf)', fContact: 'Kontaktmöglichkeiten',
    generate: 'Meinen Agenten erstellen', generating: 'Wird erstellt… das kann bis zu einer Minute dauern',
    reviewHint: 'Prüfen Sie alles. Sie können alle Texte, Farben und die Anweisungen Ihres Agenten ändern.',
    rName: 'Anzeigename', rEmoji: 'Emoji (optional)', rColors: 'Farben', cBg: 'Hintergrund', cPanel: 'Flächen',
    rTexts: 'Texte für Besucher', rEditing: 'Sprache, die Sie bearbeiten', rTagline: 'Slogan', rWelcome: 'Begrüßung',
    qLabel: 'Button-Text', qSend: 'Nachricht beim Klick',
    rPrompt: 'Anweisungen Ihres Agenten (Besucher sehen diese nie)', back: 'Zurück', publish: 'Agenten veröffentlichen', publishing: 'Wird veröffentlicht…',
    providerSetupTitle: 'Empfohlener nächster Schritt: KI-Anbieter verbinden', providerSetupBody: 'Bevor du einen eigenen Anbieterschlüssel hinzufügst, kann dein Agent ein kleines, begrenztes Plattformkontingent nutzen. Mit deinem eigenen Schlüssel verwendet der Agent dein Anbieterkonto und dessen verfügbares Kontingent bzw. Guthaben.', providerSetupStep1: 'Öffne über die Schaltfläche unten die Bearbeitungsseite.', providerSetupStep2: 'Klappe „KI-Anbieter-Schlüssel“ auf, wähle einen Anbieter und folge der Anleitung auf der Seite. Für OpenRouter gibt es auch die sichere Schaltfläche zum Verbinden.', providerSetupStep3: 'Teste und speichere deinen Schlüssel. Er wird verschlüsselt gespeichert und danach nicht erneut angezeigt.', providerSetupFindKeys: 'Anbieterschlüssel erstellen:', providerSetupCta: 'Anbieterschlüssel einrichten',
    doneTitle: 'Ihr Agent ist online', doneLink: 'Öffentlicher Link',
    doneKeyHint: 'Das ist Ihr privater Besitzer-Schlüssel. Er wird nur einmal angezeigt und kann nicht wiederhergestellt werden. Speichern Sie ihn jetzt; Sie brauchen ihn zum Bearbeiten.',
    copyUrl: 'Link kopieren', copyKey: 'Schlüssel kopieren', copied: 'Kopiert', open: 'Agenten öffnen', errGeneric: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.'
  },
  pl: {
    colorsAdjusted: 'Niektóre kolory zostały lekko dopasowane, aby tekst był czytelny.',
    dTitle: 'Opisz swoją firmę', dPlaceholder: 'np. Jesteśmy rodzinną piekarnią w Hanowerze. Sprzedajemy chleb na zakwasie, torty weselne (od 45 EUR) i oferujemy cotygodniową subskrypcję chleba…',
    dHint: 'Pisz swobodnie: co sprzedajesz, ceny, kim są Twoi klienci, jak z nimi rozmawiasz, częste pytania, czego agent nigdy nie może obiecywać, jak się z Tobą skontaktować. Im więcej napiszesz, tym lepszy będzie agent.',
    gSummary: 'Opcjonalnie: odpowiedz na pytania (samodzielnie lub dodatkowo do swojego tekstu)',
    logoLabel: 'Logo (opcjonalnie)', logoRemove: 'Usuń logo', logoHint: 'PNG, JPEG lub WebP. Zostanie automatycznie zmniejszone i pokazane w nagłówku Twojego agenta.', logoType: 'Wybierz obraz PNG, JPEG lub WebP.', logoFailed: 'Twój agent działa, ale nie udało się wgrać logo. Możesz je dodać na stronie edycji.',
    eInputsTitle: 'Co wie Twój agent', eInputsHint: 'Zmień opis, a instrukcje agenta zostaną przy zapisie automatycznie napisane od nowa. Same instrukcje zarządzamy my.', eBrandTitle: 'Wygląd i teksty',
    linkTitle: 'Linki, które zaczynają rozmowę', linkHint: 'Umieść na swojej stronie link z tematem. Gdy odwiedzający w niego kliknie, agent od razu odpowie na ten temat.', linkTopic: 'Temat lub pytanie', linkPh: 'np. Ile kosztuje tort weselny?', linkCopy: 'Kopiuj link',
    expiresOn: 'Klucz właściciela ważny do {date}. Potem do edycji potrzebne jest odnowienie (sam agent działa dalej).', rewritten: 'Zapisano. Instrukcje agenta zostały napisane od nowa na podstawie Twojego opisu.', savingLong: 'Zapisywanie… przepisanie instrukcji może potrwać do minuty',
    supportNote: 'Zgubiony lub wygasły klucz? Kontakt: {email}.', supportNone: 'Zgubiony lub wygasły klucz? Skontaktuj się z operatorem usługi.',
    copyEdit: 'Kopiuj link edycji', editLink: 'Strona edycji',
    rNotifySuggest: 'Znaleźliśmy ten adres w opisie i wpisaliśmy go. Sprawdź go: po publikacji wyślemy na niego link potwierdzający. Wyczyść pole, jeśli nie chcesz e-maili.',
    rNotify: 'E-mail do zgłoszeń kontaktowych (opcjonalnie)', rNotifyHint: 'Zgłoszenia kontaktowe są zawsze zapisywane i widoczne na stronie edycji. Dodaj e-mail, aby dostawać je także pocztą; najpierw wyślemy na ten adres link potwierdzający.',
    editTitle: 'Edytuj agenta sprzedaży AI', keyLabel: 'Klucz właściciela', keyGo: 'Otwórz', eStatus: 'Status', sActive: 'Online', sPaused: 'Wstrzymany (odwiedzający widzą „niedostępny”)',
    save: 'Zapisz zmiany', saving: 'Zapisywanie…', saved: 'Zapisano.', delete: 'Usuń agenta', deleteConfirm: 'Usunąć tego agenta i wszystkie zgłoszenia kontaktowe? Tego nie da się cofnąć.',
    privacyLink: 'Polityka prywatności', termsLink: 'Regulamin', impressumLink: 'Impressum', rLegal: 'Informacje prawne Twojej firmy', rLegalUrl: 'Link do Twoich informacji prawnych', rLegalText: 'lub tekst Twoich informacji prawnych', rLegalHint: 'Pokazywane w stopce strony Twojego agenta. Wymagane, jeśli agent jest skierowany do klientów w Niemczech lub innym kraju z takim wymogiem. Link ma pierwszeństwo, jeśli wypełnisz oba pola.', termsAccept: 'Przeczytałem(-am) i akceptuję', termsAccept2: ', w tym podanie informacji prawnych (Impressum) mojej firmy tam, gdzie wymaga tego prawo.', termsRequired: 'Zaakceptuj regulamin.', leadsTitle: 'Zgłoszenia kontaktowe', leadConvo: 'Rozmowa', leadVisitor: 'Odwiedzający', leadAgent: 'Agent', leadsHint: 'Ostatnie 50 zgłoszeń. Po 90 dniach są usuwane automatycznie.', noLeads: 'Brak zgłoszeń.',
    usage: 'Wiadomości dzisiaj: {n} z {cap}', eSettingsTitle: 'Status i wykorzystanie agenta', visitorLimitToggle: 'Ogranicz wykorzystanie agenta', visitorLimitLabel: 'Zapytania na odwiedzającego dziennie (pozostaw puste, aby nie ograniczać)', visitorLimitHint: 'To proste ograniczenie jest zapisywane w pamięci lokalnej przeglądarki. Odwiedzający mogą je zresetować, usuwając dane witryny lub używając innej przeglądarki; nie jest to ścisła ochrona przed nadużyciami.', providerHelpGroqPrefix: 'Otwórz ', providerHelpGroqSuffix: ', zaloguj się przez e-mail, przejdź do API Keys i wybierz Create API Key. Skopiuj lub zapisz klucz (można go zobaczyć tylko raz!) i wklej go tutaj.', providerHelpRequestyPrefix: 'Otwórz ', providerHelpRequestySuffix: ', zaloguj się przez e-mail lub Google (Google jest najłatwiejsze), przejdź do API Keys i wybierz Create API Key. Skopiuj lub zapisz klucz (można go zobaczyć tylko raz!) i wklej go tutaj.', providerHelpOpenRouter: 'Użyj opcji „Połącz z OpenRouter”, aby bezpiecznie się zalogować, albo utwórz klucz API na koncie OpenRouter i wklej go tutaj.', providerKeysTitle: 'Klucze dostawców AI', providerKeysHint: 'Dodaj własny klucz API dostawcy. Zostanie przetestowany przed zapisaniem i zapisany w postaci zaszyfrowanej. Nie będzie ponownie wyświetlany.', providerSelect: 'Dostawca', providerApiKey: 'Klucz API', providerTestSave: 'Przetestuj i zapisz klucz', providerTesting: 'Testowanie klucza…', providerSaved: 'Klucz przetestowany i zapisany w postaci zaszyfrowanej.', providerConnectOpenRouter: 'Połącz z OpenRouter', providerOAuthConnected: 'Połączono z OpenRouter. Klucz został przetestowany i zapisany w postaci zaszyfrowanej.', providerOAuthCancelled: 'Anulowano połączenie z OpenRouter. Nie zapisano klucza.', providerOAuthFailed: 'Nie udało się zakończyć połączenia OpenRouter lub testu klucza. Spróbuj ponownie.', providerNoKeys: 'Brak własnych kluczy dostawców. Bez własnego klucza obowiązuje mały dzienny limit platformy.', providerKeyInvalid: 'Dostawca odrzucił klucz. Usuń go i dodaj prawidłowy.', providerKeyCooldown: 'Tymczasowa przerwa po ograniczeniu szybkości przez dostawcę.', providerKeyActive: 'Dostępny dla tego agenta.', providerRemove: 'Usuń klucz', providerRemoveConfirm: 'Usunąć ten klucz dostawcy z agenta?', providerRemoved: 'Klucz dostawcy usunięty.', verifyPending: 'Jeszcze niepotwierdzony: otwórz link wysłany na ten adres. Do tego czasu zgłoszenia są tylko zapisywane tutaj, bez wysyłki e-mailem.',
    verifyOk: 'Adres potwierdzony. Nowe zgłoszenia są wysyłane na ten adres.', verifySent: 'Zapisano. Wysłaliśmy link potwierdzający na nowy adres.', authError: 'Ten klucz właściciela jest nieprawidłowy.',
    title: 'Stwórz swojego agenta sprzedaży AI', subtitle: 'Opisz swoją firmę. Dostaniesz agenta sprzedaży pod własnym linkiem.',
    fName: 'Nazwa firmy', fOffer: 'Co sprzedajesz?', fPricing: 'Oferta i ceny', fAudience: 'Grupa docelowa',
    fTone: 'Styl komunikacji', phTone: 'przyjazny, profesjonalny, krótkie odpowiedzi…', fLanguage: 'Główny język Twoich klientów', auto: 'Wykryj automatycznie',
    fColors: 'Kolory marki', phColors: 'np. granatowy i pomarańczowy lub #1d4ed8',
    fFaqs: 'FAQ', fRules: 'Zasady i ograniczenia (czego agent nigdy nie może obiecywać ani mówić)', fContact: 'Formy kontaktu',
    generate: 'Wygeneruj mojego agenta', generating: 'Generowanie… może potrwać do minuty',
    reviewHint: 'Sprawdź wszystko. Możesz zmienić wszystkie teksty, kolory i instrukcje agenta.',
    rName: 'Wyświetlana nazwa', rEmoji: 'Emoji (opcjonalnie)', rColors: 'Kolory', cBg: 'Tło', cPanel: 'Panele',
    rTexts: 'Teksty dla odwiedzających', rEditing: 'Edytowany język', rTagline: 'Hasło', rWelcome: 'Wiadomość powitalna',
    qLabel: 'Tekst przycisku', qSend: 'Wiadomość wysyłana po kliknięciu',
    rPrompt: 'Instrukcje agenta (odwiedzający ich nie widzą)', back: 'Wstecz', publish: 'Opublikuj agenta', publishing: 'Publikowanie…',
    providerSetupTitle: 'Zalecany następny krok: połącz dostawcę AI', providerSetupBody: 'Zanim dodasz własny klucz dostawcy, agent może korzystać z niewielkiego, limitowanego pakietu platformy. Własny klucz połączy agenta z Twoim kontem dostawcy i dostępnym limitem lub środkami.', providerSetupStep1: 'Otwórz stronę edycji za pomocą przycisku poniżej.', providerSetupStep2: 'Rozwiń „Klucze dostawców AI”, wybierz dostawcę i postępuj zgodnie z instrukcjami na stronie. OpenRouter oferuje też bezpieczny przycisk połączenia.', providerSetupStep3: 'Przetestuj i zapisz klucz. Zostanie zapisany w postaci zaszyfrowanej i nie będzie ponownie wyświetlany.', providerSetupFindKeys: 'Utwórz klucz dostawcy:', providerSetupCta: 'Skonfiguruj klucze dostawców',
    doneTitle: 'Twój agent jest online', doneLink: 'Publiczny link',
    doneKeyHint: 'To Twój prywatny klucz właściciela. Jest pokazany tylko raz i nie da się go odzyskać. Zapisz go teraz; będzie potrzebny do edycji agenta.',
    copyUrl: 'Kopiuj link', copyKey: 'Kopiuj klucz', copied: 'Skopiowano', open: 'Otwórz agenta', errGeneric: 'Coś poszło nie tak. Spróbuj ponownie.'
  }
};

  const $ = (id) => document.getElementById(id);
  let draft = null;
  let editing = 'en'; // locale currently shown in the form

  /* ---------- interface language: ?lang > saved > browser > English ---------- */
  function pickLang() {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    try { const s = localStorage.getItem('sa_lang'); if (LANGS.includes(s)) return s; } catch { /* storage blocked */ }
    for (const l of navigator.languages || [navigator.language]) {
      const c = String(l || '').slice(0, 2).toLowerCase();
      if (LANGS.includes(c)) return c;
    }
    return 'en';
  }
  let ui = pickLang();
  const t = (k) => TEXT[ui][k] ?? TEXT.en[k];
  const listeners = [];

  function applyUi() {
    document.documentElement.lang = ui;
    document.title = t($('edit-form') ? 'editTitle' : 'title');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $('ui-lang').value = ui;
    $('privacy-link')?.setAttribute('href', `/privacy?lang=${ui}`);
    $('terms-link')?.setAttribute('href', `/terms?lang=${ui}`);
    $('r-terms-link')?.setAttribute('href', `/terms?lang=${ui}`);
    if (draft) renderQuickReplies();
    listeners.forEach((fn) => fn());
  }
  $('ui-lang').addEventListener('change', (e) => {
    if (!LANGS.includes(e.target.value)) return;
    ui = e.target.value;
    try { localStorage.setItem('sa_lang', ui); } catch { /* storage blocked */ }
    applyUi();
  });

  /* ---------- helpers ---------- */
  function showError(msg) { const b = $('error'); b.textContent = msg; b.hidden = !msg; }
  function showNotice(msg) { const b = $('notice'); if (b) { b.textContent = msg; b.hidden = !msg; } }
  async function request(method, url, body, headers = {}) {
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(data.error || t('errGeneric')); err.status = res.status; err.code = data.code; throw err; }
    return data;
  }

  /* ---------- the editable agent form ---------- */
  function fill(d) {
    draft = d;
    editing = LANGS.includes(ui) ? ui : 'en';
    $('r-name').value = d.name;
    $('r-emoji').value = d.emoji;
    $('r-notify').value = d.notifyEmail || '';
    $('r-legal-url').value = d.legalUrl || '';
    $('r-legal-text').value = d.legalText || '';
    for (const k of PALETTE_KEYS) $('c-' + k).value = d.palette[k];
    setLogo(d.logoUrl || null);
    $('r-locale').value = editing;
    loadLocale();
  }

  function loadLocale() {
    const loc = draft.locales[editing];
    $('r-tagline').value = loc.tagline;
    $('r-welcome').value = loc.welcome;
    renderQuickReplies();
  }

  function renderQuickReplies() {
    const box = $('r-qr');
    box.replaceChildren();
    draft.locales[editing].quickReplies.forEach((q, i) => {
      const row = document.createElement('div');
      row.className = 'two';
      for (const [field, labelKey, max] of [['label', 'qLabel', 40], ['send', 'qSend', 200]]) {
        const label = document.createElement('label');
        const span = document.createElement('span');
        span.textContent = t(labelKey);
        const input = document.createElement('input');
        input.type = 'text'; input.maxLength = max; input.value = q[field];
        input.dataset.i = i; input.dataset.field = field;
        label.append(span, input);
        row.append(label);
      }
      box.append(row);
    });
  }

  function collectLocale() {
    const loc = draft.locales[editing];
    loc.tagline = $('r-tagline').value;
    loc.welcome = $('r-welcome').value;
    $('r-qr').querySelectorAll('input').forEach((inp) => { loc.quickReplies[Number(inp.dataset.i)][inp.dataset.field] = inp.value; });
  }

  $('r-locale').addEventListener('change', (e) => {
    if (!LANGS.includes(e.target.value) || !draft) return;
    collectLocale();
    editing = e.target.value;
    loadLocale();
  });

  function collect() {
    collectLocale();
    draft.name = $('r-name').value;
    draft.emoji = $('r-emoji').value;
    draft.notifyEmail = $('r-notify').value;
    draft.legalUrl = $('r-legal-url').value;
    draft.legalText = $('r-legal-text').value;
    for (const k of PALETTE_KEYS) draft.palette[k] = $('c-' + k).value;
    return draft;
  }

  /* ---------- the owner's description (free text + guided answers) ---------- */
  const GUIDED = ['name', 'offer', 'pricing', 'audience', 'tone', 'brandColors', 'faqs', 'rules', 'contact'];
  function getInputs(box) {
    const out = {};
    box.querySelectorAll('[name]').forEach((el) => { out[el.name] = el.value; });
    return out;
  }
  function setInputs(box, inputs) {
    box.querySelectorAll('[name]').forEach((el) => { el.value = inputs?.[el.name] ?? (el.tagName === 'SELECT' ? 'auto' : ''); });
    const details = box.querySelector('details.guided');
    if (details) details.open = GUIDED.some((k) => String(inputs?.[k] || '').trim());
  }

  /* ---------- logo: shrink in the browser, upload as base64 ---------- */
  const logo = { base64: null, remove: false };
  function setLogo(url) {
    logo.base64 = null; logo.remove = false;
    const img = $('r-logo-preview');
    img.hidden = !url; if (url) img.src = url;
    $('r-logo-remove').hidden = !url;
    $('r-logo').value = '';
  }
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(t('logoType')));
      reader.onload = () => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error(t('logoType'))); img.src = reader.result; };
      reader.readAsDataURL(file);
    });
  }
  async function shrink(file) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8_000_000) throw new Error(t('logoType'));
    const img = await loadImage(file);
    for (const max of [256, 192, 128]) {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL('image/webp', 0.9); // browsers without WebP encoding return PNG instead
      const base64 = dataUrl.split(',')[1];
      if (base64.length * 0.75 <= 140 * 1024) return { dataUrl, base64 };
    }
    throw new Error(t('logoType'));
  }
  $('r-logo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { dataUrl, base64 } = await shrink(file);
      logo.base64 = base64; logo.remove = false;
      $('r-logo-preview').src = dataUrl; $('r-logo-preview').hidden = false; $('r-logo-remove').hidden = false;
      showError('');
    } catch (err) { showError(err.message); e.target.value = ''; }
  });
  $('r-logo-remove').addEventListener('click', () => {
    logo.base64 = null; logo.remove = true;
    $('r-logo-preview').hidden = true; $('r-logo-remove').hidden = true; $('r-logo').value = '';
  });
  // after the agent exists: upload or remove the logo with the owner key
  async function syncLogo(slug, headers) {
    const url = `/api/agents/${encodeURIComponent(slug)}/logo`;
    if (logo.base64) await request('PUT', url, { image: logo.base64 }, headers);
    else if (logo.remove) await request('DELETE', url, undefined, headers);
    logo.base64 = null; logo.remove = false;
  }

  window.AgentForm = { getInputs, setInputs, syncLogo, hasLogoChange: () => Boolean(logo.base64 || logo.remove), logoSelected: () => Boolean(logo.base64), t, getUi: () => ui, $, fill, collect, applyUi, request, showError, showNotice, onUiChange: (fn) => listeners.push(fn) };
})();
