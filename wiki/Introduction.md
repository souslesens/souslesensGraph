SouslesensGraph permet de valoriser rapidement et simplement les données d'une base de données Graphes, Neo4j.

Souslesens est composée de plusieurs modules basé sur des applications opensource permettant de valoriser les données par l'utilisation:

des technologies manipulant des **graphes **
stockage dans Neo4j : module d'import CSV et MongoDB (extensible à tout SGBD relationnel) et API complete CRUD
visualisation de graphe visjs
des technologies sémantiques
moteur de recherche avancé (ElasticSearch
des api permettant de faciliter l'intégration du web sémantique et des linked data dans les applications de recherche(classifiers) et de graphe (transformation rdf vers graphe)
Les graphes sont le meilleur moyen de digitaliser la connaissance car ils permettent de structurer la réalité d'un domaine de connaissance (ontologie) en conservant sa complexité contrairement aux bases de données traditionnelles qui nécessite de schématiser le réel dans des modèles figés et très réducteurs. Ces derniers modèles sont très efficaces pour "opérer", par exemple un logiciel de gestion de bibliothèque ou de gestion financière mais pas du tout pour "penser" en utilisant les données structurées( ou non)

En revanche Le défaut d'un graphe c'est qu'il devient très vite incompréhensible du fait qu'il comporte de nombreuses relations différentes entre des nœuds eux-mêmes de nature différente. Il faut donc pouvoir "projeter" dynamiquement le graphe sur des vues que l'oeil puisse appréhender. c'est ce que j'essaie de faire dans cet outil en m'appuyant sur des librairie java-script de visualisation de données , et avec une interface web qui se veut le plus simple, la plus complète fonctionnellement et la plus performante