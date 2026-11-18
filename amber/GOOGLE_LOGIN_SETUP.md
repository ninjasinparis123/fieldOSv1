# Amber – Google-Login und zentrale Interaktionen (kostenloser Start)

## Stand
Die Oberfläche ist vorbereitet. Solange `auth-config.js` leer ist, ist Amber bewusst **nur lesbar**. Nutzer sehen beim Versuch zu interagieren eine Anmeldung, aber es wird KEINE Authentifizierung vorgetäuscht.

## Schritte vor der Freischaltung
1. Ein eigenes Supabase-Projekt mit **Free**-Tarif erstellen (oder Supabase zu ChatGPT verbinden, damit die Einrichtung mit Zustimmung durchgeführt werden kann).
2. Im SQL Editor den vollständigen Inhalt `supabase-schema.sql` ausführen. RLS darf nicht deaktiviert werden.
3. In der Google Cloud Console einen OAuth-Client für eine Webanwendung erzeugen. In Supabase **Authentication → Providers → Google** aktivieren. Google Client Secret nur bei Supabase eintragen, **niemals** in GitHub.
4. Im Google OAuth-Client als Redirect URI die von Supabase angezeigte `https://<project-ref>.supabase.co/auth/v1/callback` hinterlegen.
5. In Supabase **Authentication → URL Configuration** als Site URL `https://amber-nautilak.onrender.com` und als erlaubte Redirect URL `https://amber-nautilak.onrender.com/**` konfigurieren. Später `https://amber.nautilak.com/**` ergänzen, sobald die Subdomain tatsächlich aktiv ist.
6. Die **Project URL** sowie den **publishable key** (`sb_publishable_...`; auch ältere anon-keys werden unterstützt) in `auth-config.js` eintragen. Diese Werte sind für Browser vorgesehen, mit RLS geschützt. Niemals `service_role` oder secret key veröffentlichen.
7. Auth-Test: Nicht angemeldet → Schreibversuche gesperrt; mit Google angemeldet → eigene Frage verfassen, genau einmal pro Umfrage abstimmen; derselbe Google-Account auf zweitem Gerät → zweite Stimme wird durch eindeutigen DB-Schlüssel verhindert.

## Datenschutz und Einschränkungen
- Ein Google-Account ist **kein eindeutiger Mensch**. Mehrere Google-Accounts pro Person bleiben möglich.
- Telefon-SMS ist NICHT kostenlos und nicht eingerichtet. Für zusätzliche Eindeutigkeit wären ein datensparsamer Verifikationsanbieter und Missbrauchsprävention nötig.
- Die öffentlichen Beispielfragen und ihre eingeblendeten Stimmen sind synthetische Demo-Daten. Keine repräsentativen Ergebnisse.
- Die kleinen Amber-Credits sind lokale, wertlose Demo-Punkte, keine Token, keine finanzierten Spenden.
- User-Posts und Kommentare werden nach Einrichtung auf Supabase gespeichert; Kontometadaten verbleiben beim Auth-Provider. Keine echten Klarnamen werden öffentlich angezeigt.
- Vor breitem Publikum: Melde-/Löschprozesse, Sperrungen, Rate-Limits, Privacy Policy, Datenexport/Löschung und DSGVO-Prüfung ergänzen.

**Besonders wichtig:** Die Login-UI allein ist niemals ein Sicherheitsmechanismus. Einmaligkeit der Stimmen wird durch den einzigartigen Datenbank-Schlüssel `(post_id, user_id)` und die aktivierten RLS-Policies enforced.
