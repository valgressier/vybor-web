export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div
        className="border-b border-[#252538]"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <a
            href="/"
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Vybor
          </a>
          <a href="/" className="text-sm text-[#8B8BAD] hover:text-white transition-colors">
            ← Retour
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text)' }}>
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-[#8B8BAD] mb-10">Dernière mise à jour : avril 2025</p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>1. Responsable du traitement</h2>
            <p>Le responsable du traitement des données personnelles collectées via le Service Vybor est :</p>
            <div className="mt-3 p-4 rounded-xl border border-[#252538]" style={{ backgroundColor: 'var(--surface)' }}>
              <p><strong style={{ color: 'var(--text)' }}>Valentin Gressier</strong></p>
              <p className="mt-1">SIRET : 10353480600015</p>
              <p className="mt-1">
                Contact :{' '}
                <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline">
                  admin@vybor.app
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>2. Données collectées</h2>
            <p>Vybor collecte les catégories de données suivantes :</p>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>2.1 Données d'inscription</h3>
                <p>Adresse e-mail, nom d'utilisateur (pseudo), mot de passe (stocké sous forme hashée).</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>2.2 Données de profil (facultatives)</h3>
                <p>
                  Photo de profil, photo de couverture, biographie, pays de résidence, année de naissance,
                  genre, site web personnel.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>2.3 Données d'utilisation</h3>
                <p>
                  Questions publiées, votes exprimés, commentaires rédigés, messages privés,
                  abonnements et abonnés, groupes rejoints ou créés, interactions avec les notifications.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>2.4 Données techniques</h3>
                <p>
                  Identifiant de session, adresse IP (collectée par notre hébergeur),
                  informations sur l'appareil et le système d'exploitation, dates et heures de connexion.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>3. Finalités du traitement</h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="mt-2 space-y-1.5 list-none">
              {[
                'Création et gestion de votre compte utilisateur ;',
                'Fourniture des fonctionnalités du Service (sondages, votes, commentaires, messagerie) ;',
                'Affichage des statistiques de vote (genre, âge, pays) de manière agrégée ;',
                'Personnalisation du feed de contenu ;',
                'Envoi de notifications liées à votre activité (nouveaux abonnés, votes, commentaires) ;',
                'Modération du Service et prévention des abus ;',
                'Amélioration et développement du Service ;',
                'Respect de nos obligations légales.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#FF4D6A] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>4. Base légale du traitement</h2>
            <div className="space-y-3">
              <p>
                <strong style={{ color: 'var(--text)' }}>Exécution du contrat :</strong>{' '}
                Le traitement des données d'inscription et d'utilisation est nécessaire à la fourniture du Service
                que vous avez demandé.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Consentement :</strong>{' '}
                Pour les données de profil facultatives (photo, biographie, pays, âge, genre) et pour l'affichage
                de vos statistiques démographiques agrégées dans les résultats de sondages.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Intérêt légitime :</strong>{' '}
                Pour la modération du Service, la prévention des fraudes et l'amélioration de nos fonctionnalités.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Obligation légale :</strong>{' '}
                Pour la conservation des données requise par la loi française.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>5. Durée de conservation</h2>
            <div className="space-y-2">
              <p>
                <strong style={{ color: 'var(--text)' }}>Données de compte :</strong>{' '}
                Conservées pendant toute la durée d'existence du compte, puis supprimées dans un délai de 30 jours
                suivant la demande de suppression.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Données d'activité :</strong>{' '}
                Les questions, votes et commentaires sont supprimés à la fermeture du compte, sauf obligation légale de conservation.
              </p>
              <p>
                <strong style={{ color: 'var(--text)' }}>Données techniques :</strong>{' '}
                Conservées pendant 12 mois conformément à la législation française applicable aux hébergeurs.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>6. Partage des données</h2>
            <p>Vybor ne vend pas vos données personnelles à des tiers.</p>
            <p className="mt-2">Vos données peuvent être partagées uniquement avec :</p>
            <ul className="mt-2 space-y-1.5 list-none">
              {[
                "Supabase (hébergeur de la base de données et de l'authentification — serveurs en Europe) ;",
                'Les autres utilisateurs du Service, dans les limites de vos paramètres de confidentialité ;',
                'Les autorités judiciaires ou administratives, sur demande légale.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#FF4D6A] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique
              et Libertés, vous disposez des droits suivants :
            </p>
            <ul className="mt-3 space-y-2 list-none">
              {[
                ["Droit d'accès", 'obtenir une copie de vos données personnelles'],
                ['Droit de rectification', 'corriger des données inexactes ou incomplètes'],
                ["Droit à l'effacement", 'demander la suppression de vos données'],
                ['Droit à la limitation', 'limiter le traitement de vos données dans certains cas'],
                ['Droit à la portabilité', 'recevoir vos données dans un format structuré'],
                ["Droit d'opposition", 'vous opposer à certains traitements basés sur notre intérêt légitime'],
                ['Droit de retirer votre consentement', 'à tout moment pour les traitements basés sur le consentement'],
              ].map(([right, desc], i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#FF4D6A] shrink-0">•</span>
                  <span><strong style={{ color: 'var(--text)' }}>{right}</strong> : {desc}.</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline">admin@vybor.app</a>.
              Nous répondrons dans un délai maximum d'un mois.
            </p>
            <p className="mt-2">
              Vous avez également le droit d'introduire une réclamation auprès de la{' '}
              <strong style={{ color: 'var(--text)' }}>CNIL</strong> (Commission Nationale de l'Informatique
              et des Libertés — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#FF4D6A] hover:underline">www.cnil.fr</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>8. Sécurité des données</h2>
            <p>
              Vybor met en œuvre des mesures techniques et organisationnelles appropriées pour protéger
              vos données personnelles contre tout accès non autorisé, perte, destruction ou altération.
            </p>
            <p className="mt-2">
              Les mots de passe sont stockés sous forme hashée. Les communications entre votre appareil
              et nos serveurs sont chiffrées via HTTPS/TLS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>9. Mineurs</h2>
            <p>
              Le Service est interdit aux personnes de moins de 15 ans. Nous ne collectons pas sciemment
              de données personnelles auprès de personnes de moins de 15 ans. Si vous pensez qu'un mineur
              de moins de 15 ans a créé un compte, contactez-nous à{' '}
              <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline">admin@vybor.app</a>{' '}
              afin que nous procédions à la suppression du compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>10. Cookies</h2>
            <p>
              Le site web Vybor utilise des cookies techniques strictement nécessaires au fonctionnement
              du Service (gestion de session, préférences d'affichage). Aucun cookie de suivi publicitaire
              tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>11. Transferts hors UE</h2>
            <p>
              Les données sont hébergées sur des serveurs Supabase situés en Europe.
              Aucun transfert de données personnelles en dehors de l'Espace Économique Européen n'est effectué
              sans garanties appropriées conformément au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>12. Modification de la politique</h2>
            <p>
              Cette politique de confidentialité peut être modifiée à tout moment. Toute modification
              substantielle sera notifiée aux utilisateurs via l'application ou par e-mail avant son entrée
              en vigueur. La date de dernière mise à jour est indiquée en haut de ce document.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>13. Contact</h2>
            <p>
              Pour toute question relative à la présente politique ou au traitement de vos données, contactez-nous :
            </p>
            <p className="mt-2">
              <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline font-medium">
                admin@vybor.app
              </a>
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#252538] px-6 py-8 text-center text-sm text-[#555575]">
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <a href="/cgu" className="hover:text-white transition-colors">CGU</a>
          <a href="/privacy" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="mailto:admin@vybor.app" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} Vybor — Valentin Gressier</p>
      </footer>
    </main>
  );
}
