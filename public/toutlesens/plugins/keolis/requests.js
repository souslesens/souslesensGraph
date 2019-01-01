{
    "communautesFR.csv":
    {
        "message": "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\communautesFR.csv.json", "name"
    :
        "communautesFR.csv", "header"
    :
        ["", "", "", "", "", "", "", "", "nom", "administrateurs", "administrateursID", "ordre", "nbGroupes", "nbMembres", "cree", "modifie", "espaceDeTravailParent", "espaceDeTravailParentID", "redacteur", "redacteurID", "iD", "quotaDeLespaceDeTravail", "seuilDalerte", "utiliseLaConfigurationDesQuotasParDefaut"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.communaute_nom", "Nodes_keosphere19.communauteFR_nom", "Nodes_keosphere19.communaute2_nom", "Nodes_keosphere19.communaute_nom"]
    }
,
    "communautesEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\communautesEN.csv.json", "name"
    :
        "communautesEN.csv", "header"
    :
        ["", "", "", "", "name", "administrators", "administratorsID", "order", "groups", "members", "created", "modified", "parentWorkspace", "parentWorkspaceID", "writer", "writerID", "iD", "workspaceQuota", "alertThreshold", "useDefaultQuotaConfiguration"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.communauteEN_name"]
    }
,
    "personnesEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\personnesEN.csv.json", "name"
    :
        "personnesEN.csv", "header"
    :
        ["", "", "", "", "", "", "", "salutation", "firstName", "name", "organization", "department", "jobTitle", "workspace", "workspaceID", "readRightsProfile", "readRightsProfileID", "login", "eMail", "eMailVisible", "phone", "mobile", "streetAddress", "postCode", "pOBox", "stateProvince", "city", "address", "information", "language", "country", "groups", "groupsID", "mainAdmin", "usage", "lastSignInDate", "disabled", "lDAPSync", "lDAPSync", "webDAVAccess", "created", "modified", "writer", "writerID", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.personneEN_name"]
    }
,
    "personnesFR.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\personnesFR.csv.json", "name"
    :
        "personnesFR.csv", "header"
    :
        ["", "", "", "", "", "", "", "", "", "", "civilite", "prenom", "nom", "organisation", "service", "fonction", "espaceDeTravail", "espaceDeTravailID", "profilDeConsultation", "profilDeConsultationID", "compteUtilisateur", "eMail", "eMailVisible", "telephone", "mobile", "voieEtNumero", "codePostal", "boitePostale", "departementRegion", "ville", "coordonnees", "informations", "langue", "pays", "groupes", "groupesID", "adminCentral", "usage", "dernieresConnexions", "desactive", "syncLDAP", "syncLDAP", "accesWebDAV", "cree", "modifie", "redacteur", "redacteurID", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.personne_nom", "Rels_keosphere19.personne->communaute:membreDeCommunaute", "Rels_keosphere19.communaute->groupe:membreDeGroupe", "Rels_keosphere19.personne->groupe:membreDeGroupe", "Rels_keosphere19.personne->communaute:membreDeCommunaute", "Rels_keosphere19.personne->communaute:membreDeCommunaute", "Rels_keosphere19.personne->groupe:membreDeGroupe"]
    }
,
    "groups.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\groups.csv.json", "name"
    :
        "groups.csv", "header"
    :
        ["", "", "", "", "", "", "", "nom", "descriptionEnAnglais", "groupesParents", "groupesParentsID", "espaceDeTravail", "espaceDeTravailID", "ordre", "visibilite", "dureeDeLidentification", "nbDeMembres", "accesWebDAV", "cree", "modifie", "redacteur", "redacteurID", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.groupe_nom", "Rels_keosphere19.groupe->communaute:aCommunaute"]
    }
,
    "tagsFR.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\tagsFR.csv.json", "name"
    :
        "tagsFR.csv", "header"
    :
        ["", "", "", "nom", "parent", "parentID", "descriptionEnAnglais", "synonymes", "selectionnable", "ordre", "icone", "image", "couleur", "droitsDeConsultationMembres", "droitsDeConsultationMembresID", "droitsDeConsultationGroupes", "droitsDeConsultationGroupesID", "cree", "modifie", "redacteur", "redacteurID", "nbFils", "nbDesc", "nbPub", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.tag_nom"]
    }
,
    "requests"
:
    {
        "Nodes_keosphere19.communaute_nom"
    :
        {
            "source"
        :
            "communautesFR.csv", "exportedFields"
        :
            "espaceDeTravailParent;espaceDeTravailParentID", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "communaute", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.communauteEN_name"
    :
        {
            "source"
        :
            "communautesEN.csv", "exportedFields"
        :
            "none", "sourceField"
        :
            "name", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "name", "label"
        :
            "communauteEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.personne_nom"
    :
        {
            "source"
        :
            "personnesFR.csv", "exportedFields"
        :
            "civilite;prenom;organisation;organisation;fonction;ville;langue;pays", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "personne", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.groupe_nom"
    :
        {
            "source"
        :
            "groups.csv", "exportedFields"
        :
            "descriptionEnAnglais;redacteur;cree", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "groupe", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.groupe->communaute:aCommunaute"
    :
        {
            "sourceDB"
        :
            "groups.csv", "source"
        :
            "groups.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "groupe", "sourceTargetField"
        :
            "espaceDeTravailID", "neoTargetLabel"
        :
            "communaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aCommunaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.personne->communaute:membreDeCommunaute"
    :
        {
            "sourceDB"
        :
            "personnesFR.csv", "source"
        :
            "personnesFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "personne", "sourceTargetField"
        :
            "espaceDeTravailID", "neoTargetLabel"
        :
            "communaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "membreDeCommunaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.communaute->groupe:membreDeGroupe"
    :
        {
            "sourceDB"
        :
            "personnesFR.csv", "source"
        :
            "personnesFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "communaute", "sourceTargetField"
        :
            "groupesID", "neoTargetLabel"
        :
            "groupe", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "membreDeGroupe", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.personne->groupe:membreDeGroupe"
    :
        {
            "sourceDB"
        :
            "groups.csv", "source"
        :
            "personnesFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "personne", "sourceTargetField"
        :
            "groupesID", "neoTargetLabel"
        :
            "groupe", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "membreDeGroupe", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.documentCollaboratif_titre"
    :
        {
            "source"
        :
            "contenusCollaboratifsFR.csv", "exportedFields"
        :
            "version;redacteur;type;cree", "sourceField"
        :
            "titre", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "titre", "label"
        :
            "documentCollaboratif", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.contenuDocument_titre"
    :
        {
            "source"
        :
            "contenusDocumentsFR.csv", "exportedFields"
        :
            "version;redacteur;type;cree", "sourceField"
        :
            "titre", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "titre", "label"
        :
            "contenuDocument", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.categorie_nom"
    :
        {
            "source"
        :
            "categoriesFR.csv", "exportedFields"
        :
            "parent;parentID;descriptionEnAnglais;synonymes", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "categorie", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.communaute->categorie:aCategorie"
    :
        {
            "sourceDB"
        :
            "categoriesFR.csv", "source"
        :
            "categoriesFR.csv", "sourceSourceField"
        :
            "nom", "neoSourceKey"
        :
            "nom", "neoSourceLabel"
        :
            "communaute", "sourceTargetField"
        :
            "nom", "neoTargetLabel"
        :
            "categorie", "neoTargetKey"
        :
            "nom", "relationType"
        :
            "aCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.tag_nom"
    :
        {
            "source"
        :
            "tagsFR.csv", "exportedFields"
        :
            "parent;parentID;synonymes", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "tag", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->communaute:dansCommunaute"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "espaceDeTravailID", "neoTargetLabel"
        :
            "communaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "dansCommunaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->categorie:aCategorie"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "categorie", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.documentCollaboratif->categorie:aCategorie"
    :
        {
            "sourceDB"
        :
            "contenusCollaboratifsFR.csv", "source"
        :
            "contenusCollaboratifsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "documentCollaboratif", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "categorie", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.documentCollaboratif->communaute:dansCommunaute"
    :
        {
            "sourceDB"
        :
            "contenusCollaboratifsFR.csv", "source"
        :
            "contenusCollaboratifsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "documentCollaboratif", "sourceTargetField"
        :
            "espaceDeTravailID", "neoTargetLabel"
        :
            "communaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "dansCommunaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.documentCollaboratif->personne:aAuteur"
    :
        {
            "sourceDB"
        :
            "contenusCollaboratifsFR.csv", "source"
        :
            "contenusCollaboratifsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "documentCollaboratif", "sourceTargetField"
        :
            "redacteurID", "neoTargetLabel"
        :
            "personne", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aAuteur", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->personne:aAuteur"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "redacteurID", "neoTargetLabel"
        :
            "personne", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aAuteur", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->tag:aTag"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "tag", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "aTag", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->categorieCommunaute:ContenuDoc2Categorie"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "categorieCommunaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "ContenuDoc2Categorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.contenuDocument->tag:ContenuDoc2Tag"
    :
        {
            "sourceDB"
        :
            "contenusDocumentsFR.csv", "source"
        :
            "contenusDocumentsFR.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "contenuDocument", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "tag", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "ContenuDoc2Tag", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.documentCollaboratif->tag:ContenuCollab2Tag"
    :
        {
            "sourceDB"
        :
            "contenusCollaboratifsEN.csv", "source"
        :
            "contenusCollaboratifsEN.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "documentCollaboratif", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "tag", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "ContenuCollab2Tag", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.documentCollaboratif->categorieCommunaute:ContenuCollab2Communaute"
    :
        {
            "sourceDB"
        :
            "contenusCollaboratifsEN.csv", "source"
        :
            "contenusCollaboratifsEN.csv", "sourceSourceField"
        :
            "iD", "neoSourceKey"
        :
            "iD", "neoSourceLabel"
        :
            "documentCollaboratif", "sourceTargetField"
        :
            "categoriesID", "neoTargetLabel"
        :
            "categorieCommunaute", "neoTargetKey"
        :
            "iD", "relationType"
        :
            "ContenuCollab2Communaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.communauteFR_nom"
    :
        {
            "source"
        :
            "communautesFR.csv", "exportedFields"
        :
            "none", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "communauteFR", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.personneEN_name"
    :
        {
            "source"
        :
            "personnesEN.csv", "exportedFields"
        :
            "firstName;jobTitle", "sourceField"
        :
            "name", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "name", "label"
        :
            "personneEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.categorieEN_name"
    :
        {
            "source"
        :
            "categoriesEN.csv", "exportedFields"
        :
            "firstName;jobTitle", "sourceField"
        :
            "name", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "name", "label"
        :
            "categorieEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.tagEN_name"
    :
        {
            "source"
        :
            "tagsEN.csv", "exportedFields"
        :
            "firstName;jobTitle", "sourceField"
        :
            "name", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "name", "label"
        :
            "tagEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.docColllaboratifEN_title"
    :
        {
            "source"
        :
            "contenusCollaboratifsEN.csv", "exportedFields"
        :
            "firstName;jobTitle", "sourceField"
        :
            "title", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "title", "label"
        :
            "docColllaboratifEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.docContenuEN_title"
    :
        {
            "source"
        :
            "contenusDocumentsEN.csv", "exportedFields"
        :
            "firstName;jobTitle", "sourceField"
        :
            "title", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "title", "label"
        :
            "docContenuEN", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.communaute->categorieCommunaute:aCategorieCommunaute"
    :
        {
            "sourceDB"
        :
            "categoriesFR.csv", "source"
        :
            "categoriesFR.csv", "sourceSourceField"
        :
            "nom", "neoSourceKey"
        :
            "nom", "neoSourceLabel"
        :
            "communaute", "sourceTargetField"
        :
            "nom", "neoTargetLabel"
        :
            "categorieCommunaute", "neoTargetKey"
        :
            "nom", "relationType"
        :
            "aCategorieCommunaute", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.communaute->categorieCommunaute:deCategorie"
    :
        {
            "sourceDB"
        :
            "categoriesEN.csv", "source"
        :
            "categoriesFR.csv", "sourceSourceField"
        :
            "nom", "neoSourceKey"
        :
            "nom", "neoSourceLabel"
        :
            "communaute", "sourceTargetField"
        :
            "nom", "neoTargetLabel"
        :
            "categorieCommunaute", "neoTargetKey"
        :
            "nom", "relationType"
        :
            "deCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.categorieCommunaute->communaute:deCategorie"
    :
        {
            "sourceDB"
        :
            "categoriesFR.csv", "source"
        :
            "categoriesFR.csv", "sourceSourceField"
        :
            "nom", "neoSourceKey"
        :
            "nom", "neoSourceLabel"
        :
            "categorieCommunaute", "sourceTargetField"
        :
            "nom", "neoTargetLabel"
        :
            "communaute", "neoTargetKey"
        :
            "nom", "relationType"
        :
            "deCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{\"parent\":\"Communautés\"}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Nodes_keosphere19.communaute2_nom"
    :
        {
            "source"
        :
            "communautesFR.csv", "exportedFields"
        :
            "none", "sourceField"
        :
            "nom", "sourceKey"
        :
            "iD", "distinctValues"
        :
            true, "sourceIdField"
        :
            "nom", "label"
        :
            "communaute2", "sourceQuery"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    ,
        "Rels_keosphere19.communaute->categorieCommunaute:aCategorie"
    :
        {
            "sourceDB"
        :
            "categoriesFR.csv", "source"
        :
            "categoriesFR.csv", "sourceSourceField"
        :
            "nom", "neoSourceKey"
        :
            "nom", "neoSourceLabel"
        :
            "communaute", "sourceTargetField"
        :
            "nom", "neoTargetLabel"
        :
            "categorieCommunaute", "neoTargetKey"
        :
            "nom", "relationType"
        :
            "aCategorie", "neoRelAttributeField"
        :
            "", "sourceQueryR"
        :
            "{}", "subGraph"
        :
            "keosphere19"
        }
    }
,
    "contenusCollaboratifsFR.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\contenusCollaboratifsFR.csv.json", "name"
    :
        "contenusCollaboratifsFR.csv", "header"
    :
        ["", "", "", "", "", "iD", "titre", "version", "redacteur", "redacteurID", "type", "categories", "categoriesID", "tat", "gabAff", "membresAutorisesaConsulter", "membresAutorisesaConsulterID", "groupesAutorisesaConsulter", "groupesAutorisesaConsulterID", "membresAutorisesaModifier", "membresAutorisesaModifierID", "groupesAutorisesaModifier", "groupesAutorisesaModifierID", "espaceDeTravail", "espaceDeTravailID", "cree", "modifie", "publie", "expire", "archive", "misaJour", "dateDeTri", "workflowID"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.documentCollaboratif_titre", "Rels_keosphere19.documentCollaboratif->categorie:aCategorie", "Rels_keosphere19.documentCollaboratif->communaute:dansCommunaute", "Rels_keosphere19.documentCollaboratif->personne:aAuteur"]
    }
,
    "contenusCollaboratifsEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\contenusCollaboratifsEN.csv.json", "name"
    :
        "contenusCollaboratifsEN.csv", "header"
    :
        ["", "", "", "iD", "title", "version", "writer", "writerID", "type", "categories", "categoriesID", "status", "dispTplt", "membersAuthorizedToRead", "membersAuthorizedToReadID", "groupsAuthorizedToRead", "groupsAuthorizedToReadID", "membersAuthorizedToUpdate", "membersAuthorizedToUpdateID", "groupsAuthorizedToUpdate", "groupsAuthorizedToUpdateID", "workspace", "workspaceID", "created", "modified", "published", "expired", "archived", "updated", "sortDate", "workflowID"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Rels_keosphere19.documentCollaboratif->tag:ContenuCollab2Tag", "Rels_keosphere19.documentCollaboratif->categorieCommunaute:ContenuCollab2Communaute", "Nodes_keosphere19.docColllaboratifEN_title"]
    }
,
    "contenusDocumentsFR.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\contenusDocumentsFR.csv.json", "name"
    :
        "contenusDocumentsFR.csv", "header"
    :
        ["", "", "", "", "", "", "", "iD", "titre", "version", "redacteur", "redacteurID", "type", "categories", "categoriesID", "tat", "gabAff", "membresAutorisesaConsulter", "membresAutorisesaConsulterID", "groupesAutorisesaConsulter", "groupesAutorisesaConsulterID", "membresAutorisesaModifier", "membresAutorisesaModifierID", "groupesAutorisesaModifier", "groupesAutorisesaModifierID", "espaceDeTravail", "espaceDeTravailID", "cree", "modifie", "publie", "expire", "archive", "misaJour", "dateDeTri", "workflowID"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.contenuDocument_titre", "Rels_keosphere19.contenuDocument->communaute:dansCommunaute", "Rels_keosphere19.contenuDocument->categorie:aCategorie", "Rels_keosphere19.contenuDocument->personne:aAuteur", "Rels_keosphere19.contenuDocument->tag:aTag", "Rels_keosphere19.contenuDocument->categorieCommunaute:ContenuDoc2Categorie", "Rels_keosphere19.contenuDocument->tag:ContenuDoc2Tag"]
    }
,
    "contenusDocumentsEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\contenusDocumentsEN.csv.json", "name"
    :
        "contenusDocumentsEN.csv", "header"
    :
        ["", "", "iD", "title", "version", "writer", "writerID", "type", "categories", "categoriesID", "status", "dispTplt", "membersAuthorizedToRead", "membersAuthorizedToReadID", "groupsAuthorizedToRead", "groupsAuthorizedToReadID", "membersAuthorizedToUpdate", "membersAuthorizedToUpdateID", "groupsAuthorizedToUpdate", "groupsAuthorizedToUpdateID", "workspace", "workspaceID", "created", "modified", "published", "expired", "archived", "updated", "sortDate", "workflowID"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.docContenuEN_title"]
    }
,
    "categoriesEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\categoriesEN.csv.json", "name"
    :
        "categoriesEN.csv", "header"
    :
        ["", "", "", "name", "parent", "parentID", "description", "synonyms", "selectable", "order", "icon", "image", "color", "readRightsMembers", "readRightsMembersID", "readRightsGroups", "readRightsGroupsID", "created", "modified", "writer", "writerID", "child", "desc", "pub", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.categorieEN_name"]
    }
,
    "categoriesFR.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\categoriesFR.csv.json", "name"
    :
        "categoriesFR.csv", "header"
    :
        ["", "", "", "", "", "", "nom", "parent", "parentID", "descriptionEnAnglais", "synonymes", "selectionnable", "ordre", "icone", "image", "couleur", "droitsDeConsultationMembres", "droitsDeConsultationMembresID", "droitsDeConsultationGroupes", "droitsDeConsultationGroupesID", "cree", "modifie", "redacteur", "redacteurID", "nbFils", "nbDesc", "nbPub", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.categorie_nom", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorie:aCategorie", "Nodes_keosphere19.categorie_nom", "Rels_keosphere19.communaute->categorie:aCategorie", "Rels_keosphere19.communaute->categorieCommunaute:aCategorieCommunaute", "Rels_keosphere19.communaute->categorieCommunaute:deCategorie", "Rels_keosphere19.categorieCommunaute->communaute:deCategorie", "Rels_keosphere19.communaute->categorieCommunaute:aCategorie", "Rels_keosphere19.categorieCommunaute->communaute:deCategorie"]
    }
,
    "tagsEN.csv"
:
    {
        "message"
    :
        "listCsvFields", "remoteJsonPath"
    :
        "D:\\GitHub\\souslesensGraph\\souslesensGraph\\uploads\\tagsEN.csv.json", "name"
    :
        "tagsEN.csv", "header"
    :
        ["", "", "name", "parent", "parentID", "description", "synonyms", "selectable", "order", "icon", "image", "color", "readRightsMembers", "readRightsMembersID", "readRightsGroups", "readRightsGroupsID", "created", "modified", "writer", "writerID", "child", "desc", "pub", "iD"], "subGraph"
    :
        "keosphere19", "requests"
    :
        ["Nodes_keosphere19.tagEN_name"]
    }
}