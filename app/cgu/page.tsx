export default function CGUPage() {
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
          Conditions Générales d'Utilisation
        </h1>
        <p className="text-sm text-[#8B8BAD] mb-10">Dernière mise à jour : avril 2025</p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités
              et conditions d'utilisation de l'application mobile et du site web Vybor (ci-après « le Service »),
              ainsi que les droits et obligations des parties.
            </p>
            <p className="mt-2">
              En accédant au Service ou en créant un compte, vous acceptez sans réserve les présentes CGU.
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>2. Éditeur du Service</h2>
            <p>Le Service Vybor est édité par :</p>
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
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>3. Accès au Service</h2>
            <p>
              Le Service est accessible à toute personne disposant d'un accès à Internet. L'accès à certaines
              fonctionnalités nécessite la création d'un compte utilisateur.
            </p>
            <p className="mt-2 font-medium" style={{ color: 'var(--text)' }}>
              ⚠️ L'utilisation de Vybor est réservée aux personnes âgées d'au moins 15 ans.
            </p>
            <p className="mt-2">
              En créant un compte, vous déclarez avoir au moins 15 ans. Si vous avez entre 15 et 18 ans,
              vous déclarez avoir obtenu l'autorisation de votre représentant légal. L'éditeur se réserve le
              droit de demander une preuve d'âge et de supprimer tout compte ne respectant pas cette condition.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>4. Création de compte</h2>
            <p>
              Pour accéder aux fonctionnalités complètes du Service, vous devez créer un compte en fournissant
              une adresse e-mail valide et un mot de passe. Vous êtes responsable de la confidentialité de vos
              identifiants de connexion.
            </p>
            <p className="mt-2">
              Vous vous engagez à fournir des informations exactes, complètes et à jour lors de votre inscription,
              et à ne pas usurper l'identité d'une autre personne.
            </p>
            <p className="mt-2">
              Chaque utilisateur ne peut posséder qu'un seul compte. La création de comptes multiples, notamment
              à des fins de contournement de sanctions, est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>5. Règles de conduite</h2>
            <p>En utilisant le Service, vous vous engagez à ne pas :</p>
            <ul className="mt-2 space-y-1.5 list-none">
              {[
                'Publier des contenus illicites, diffamatoires, insultants, discriminatoires, violents, pornographiques ou portant atteinte à la dignité humaine ;',
                "Harceler, menacer ou intimider d'autres utilisateurs ;",
                'Diffuser de fausses informations ou du contenu trompeur ;',
                'Utiliser le Service à des fins commerciales non autorisées, ou pour du spam ;',
                'Tenter de pirater, déstabiliser ou perturber le bon fonctionnement du Service ;',
                "Collecter des données personnelles d'autres utilisateurs sans leur consentement ;",
                'Contourner les mesures de modération ou de restriction du Service.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#FF4D6A] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              L'éditeur se réserve le droit de supprimer tout contenu non conforme et de suspendre ou supprimer
              tout compte en violation des présentes CGU, sans préavis ni remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>6. Contenu utilisateur</h2>
            <p>
              Vous conservez la propriété intellectuelle des contenus que vous publiez sur le Service.
              En publiant un contenu, vous accordez à Vybor une licence non exclusive, mondiale, gratuite et
              transférable pour utiliser, afficher, reproduire et distribuer ce contenu dans le cadre du Service.
            </p>
            <p className="mt-2">
              Vous garantissez que les contenus que vous publiez ne violent aucun droit de tiers, notamment
              les droits d'auteur, droits à l'image ou droits de la personnalité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>7. Modération</h2>
            <p>
              Le Service dispose d'outils de modération. Tout utilisateur peut signaler un contenu inapproprié.
              L'éditeur traite ces signalements dans les meilleurs délais.
            </p>
            <p className="mt-2">
              Les décisions de modération sont prises à la discrétion de l'éditeur. Si vous estimez qu'une
              décision est injustifiée, vous pouvez contacter{' '}
              <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline">admin@vybor.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>8. Disponibilité du Service</h2>
            <p>
              L'éditeur s'efforce d'assurer la disponibilité du Service 24h/24 et 7j/7, mais ne garantit pas
              une disponibilité continue. Des interruptions peuvent survenir pour maintenance, mise à jour ou
              pour toute cause indépendante de la volonté de l'éditeur.
            </p>
            <p className="mt-2">
              L'éditeur se réserve le droit de modifier, suspendre ou interrompre tout ou partie du Service
              à tout moment et sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>9. Limitation de responsabilité</h2>
            <p>
              L'éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de
              l'utilisation ou de l'impossibilité d'utiliser le Service, d'un accès non autorisé à vos données,
              ou des contenus publiés par les utilisateurs.
            </p>
            <p className="mt-2">
              Le Service est fourni « en l'état ». L'éditeur ne garantit pas l'exactitude, l'exhaustivité ou
              la pertinence des informations disponibles sur le Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>10. Données personnelles</h2>
            <p>
              Le traitement des données personnelles des utilisateurs est décrit dans la{' '}
              <a href="/privacy" className="text-[#FF4D6A] hover:underline">Politique de Confidentialité</a>{' '}
              de Vybor, qui fait partie intégrante des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>11. Modification des CGU</h2>
            <p>
              L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
              entrent en vigueur dès leur publication. En continuant à utiliser le Service après modification
              des CGU, vous en acceptez les nouvelles conditions.
            </p>
            <p className="mt-2">
              En cas de modification substantielle, les utilisateurs seront informés par notification dans
              l'application ou par e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>12. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront
              de trouver une solution amiable. À défaut, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text)' }}>13. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez contacter l'éditeur à l'adresse :{' '}
              <a href="mailto:admin@vybor.app" className="text-[#FF4D6A] hover:underline">
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
