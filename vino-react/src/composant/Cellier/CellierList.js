import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Cellier.css";
import iconeAjout from "../../img/icone-ajout.svg";
import barilsDeVin from '../../img/barils-de-vin.svg';
import Modal from '../Modal/Modal';
import iconeSupprimerBlanc from '../../img/icone-supprimer-blanc.png';
import bouteilleIconeFill from '../../img/bouteille-icone-fill.png';
import ModalInfos from "../ModalInfos/ModalInfos";


export default function CellierList(props) {
  const api_url = "http://127.0.0.1:8000/api/"; // url de l'api
  const [celliers, setCelliers] = useState([]); // création d'un state pour les celliers
  const idCellierRef = React.useRef();
  const nomCellierRef = React.useRef();
  const [dialog, setDialog] = useState({
    message: "",
    isLoading: false,
    produit: "",
  });
  const [confirmationMessage, setConfirmationMessage] = useState({
    display: false,
    message: "",
  });
  const [dataCharge, setDataCharge] = useState(false); // création d'un etat pour indiquer si les données sont chargées


  useEffect(() => { // fonction qui s'exécute au chargement de la page
    fetchCellierUser(setCelliers); // appel de la fonction qui récupère les celliers de l'utilisateur
  }, []); // le tableau vide indique que la fonction ne doit s'exécuter qu'une seule fois


  /**
   * Récupérer les celliers de l'utilisateur
   */
  async function fetchCellierUser() {
    let entete = new Headers();
    const token = localStorage.getItem("token"); // récupérer le token de l'utilisateur
    entete.append("Content-Type", "application/json");
    entete.append("Authorization", "Bearer " + token); // ajoute le token dans l'entête de la requête

    const responseCelliers = await fetch(api_url + "celliers", { // requête pour récupérer les celliers
      method: "GET",
      headers: entete,
    });
    const celliersData = await responseCelliers.json();

    // Récupérer les quantités de bouteilles pour chaque cellier
    const responseQuantite = await fetch(api_url + "celliersQuantite", { // requête pour récupérer les liste des celliers qui possèdent au moins une bouteille, de la table celliers_has_bouteilles (qui contient les quantités de bouteilles)
      method: "GET",
      headers: entete,
    }
    );
    const quantiteData = await responseQuantite.json();

    // Fusionner les données de tous les celliers avec ceux qui ont des bouteilles
    const celliersAvecQuantite = celliersData.map((cellier) => { // boucle qui parcourt le tableau des celliers
      const quantiteCellier = quantiteData.find(
        (quantite) => quantite.id === cellier.id // boucle qui parcourt le tableau des celliers qui possèdent au moins une bouteille et qui compare l'id du cellier avec l'id du cellier qui possède au moins une bouteille
      );
      return {
        ...cellier, // avec l'operateur de decomposition, je récupère toutes les propriétés du cellier (id, nom, user_id) pour y ajouter la propriété quantite
        total: quantiteCellier ? quantiteCellier.totalQuantite : 0, // si la quantité existe, je l'ajoute à la propriété quantite, sinon je lui donne la valeur 0
      };
    });

    setCelliers(celliersAvecQuantite);
    setDataCharge(true); // indique que les données sont chargées
  }

  /**
   *  Fonction qui supprime un cellier
   * @param {*} evt  événement
   * @param {*} id  id du cellier
   * @param {*} nom  nom du cellier
   */
  function handleDeleteCellier(evt, id, nom) {
    evt.stopPropagation();
    setDialog({
      message: "Êtes-vous certain de vouloir supprimer le cellier : ",
      isLoading: true,
      produit: nom
    });
    idCellierRef.current = id;
    nomCellierRef.current = nom;
  }

  function showMessage(message) {
    setConfirmationMessage({
      display: true,
      message,
    });

    setTimeout(() => {
      setConfirmationMessage({
        display: false,
        message: "",
      });
      window.location.reload();
    }, 2000);
  }


/**
 *  Fonction qui affiche les celliers de l'utilisateur
 * @returns  liste des celliers de l'utilisateur
 */
  function afficheCelliers() {
    return celliers.map((cellier) => { // boucle qui parcourt le tableau des celliers
      return (
        <li className="cellier__carte" key={cellier.id}>
          <div className="cellier__carte__content">
            <Link to={"/cellier/" + cellier.id}>
              <img className="cellier__carte--image" src={barilsDeVin} alt="Barils de vin" />
            </Link>
            <Link to={"/cellier/" + cellier.id}>
              <p className="cellier__infos--quantite">
                <img className="cellier__carte--image" src={bouteilleIconeFill} alt="Quantité" />
                {`x ${cellier.total}`}
              </p>
            </Link>
          </div>
          <div className="cellier__infos">
            <Link to={"/cellier/" + cellier.id}>
              <p className="cellier__infos--nom">{cellier.nom}</p>
            </Link>
            <div className="cellier__icones--position">
              <Link to={`/cellier/update/${cellier.id}`}>
                <img
                  className="cellier__infos--edit"
                  src="/static/media/edit-icone-blanc.5cafcbd4aecb946355b1cbafba8b56d5.svg"
                  alt="Editer"
                />
              </Link>
              <div>
                <img
                  className="cellier__supprimer"
                  src={iconeSupprimerBlanc}
                  alt="Supprimer le cellier"
                  onClick={(evt) => handleDeleteCellier(evt, cellier.id, cellier.nom)}
                />
              </div>
            </div>
          </div>
        </li>
      );
    });
  }



  const confirmation = (choix) => { // fonction qui supprime le cellier
    if (choix) {
      setDialog({ message: "", isLoading: false, produit: "" });
      let cellier_id = idCellierRef.current;
      let url = `http://127.0.0.1:8000/api/cellier/${cellier_id}`;

      fetch(url, {
        method: "DELETE",
        headers: {
          'Content-type': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('une erreur est survenue');
          } else {
            fetchCellierUser(setCelliers);
            showMessage( // fonction qui affiche un message modale de confirmation de suppression
              <span>
                Vous avez supprimé le cellier:
                <br />
                <span className="modalInfos__nom--message">{nomCellierRef.current}
                </span>
              </span>
            );
          }
        })
        .catch((evt) => {
          //console.log(evt);
        });
    } else {
      setDialog({ message: "", isLoading: false, produit: "" }); // si l'utilisateur ne confirme pas la suppression, on ferme le modale
    }
  }





  return (
    <div className="container">
      <div className="cellier__titre">
        <h1>Mes celliers</h1>
      </div>
  
      {dataCharge ? (
        celliers.length > 0 ? (
          <ul className="cellier">{afficheCelliers()}</ul>
        ) : (
          <p className="cellier__aucunCellier--position">Cliquez pour ajouter un cellier</p>
        )
      ) : (
        <p className="cellier__aucunCellier--position">Chargement des celliers...</p>
      )}
  
      <div className="cellier__ajouter">
        <Link to="/cellier/create">
          <img src={iconeAjout} alt="Ajouter" />
        </Link>
      </div>
      {dialog.isLoading && <Modal onDialog={confirmation} message={dialog.message} produit={dialog.produit} />}
      {confirmationMessage.display && (<ModalInfos message={confirmationMessage.message} />)}
  
    </div>
  );
  
}
