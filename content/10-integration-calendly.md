# Intégration Calendly observée (existante)

- Chaque service dispose d'un compte/lien Calendly dédié, au format :
  calendly.com/{service}-consulat/30min
  (exemple confirmé : passeport-consulat)
- Durée de créneau observée : 30 minutes
- Lieu affiché : 3, Villa Copernic - 75116, Paris
- Message d'avertissement affiché sur la page Calendly : se présenter à l'heure exacte du rendez-vous, muni de tous les documents nécessaires ainsi que du montant de la taxe consulaire en espèces.
- Comportement actuel : redirection complète hors du site vers calendly.com (pas d'embed iframe).

## Cible pour la v2 (à implémenter)
- Un Event Type Calendly par couple Service/Formalité, mappé depuis la console d'administration.
- Affichage en iframe embed (Calendly Inline Widget) plutôt qu'une redirection sortante.
- Synchronisation via webhooks (invitee.created / invitee.canceled) vers la base de données interne.
