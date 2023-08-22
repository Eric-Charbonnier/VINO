import "./Entete.css";
import logoVino from "../../img/vinoLogo-blanc.svg";
import { Link, json, Outlet, Form } from "react-router-dom";
import { ReactComponent as ChevronIcon } from "../../img/chevron.svg";
import { ReactComponent as ChevronLeftIcon } from "../../img/chevronLeft.svg";
import { ReactComponent as BoltIcon } from "../../img/bolt.svg";
import { ReactComponent as UserIcon } from "../../img/icone-user.svg";
import { ReactComponent as BurgerIcon } from "../../img/menu_burger_blanc.svg";
import React, { useState, useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";

/**
 *  Hook qui permet de détecter le clic en dehors d'un élément
 * @param {*} ref  // référence de l'élément
 * @param {*} handler  // fonction qui sera appelée lors du clic en dehors de l'élément
 */
function useOnClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}


function DropdownItem(props) {
    const [activeMenu, setActiveMenu] = useState("main");
    return (
        <a
            href="#"
            className="menu-item"
            onClick={() => props.goToMenu && setActiveMenu(props.goToMenu)}
        >
            <span className="icon-button">{props.leftIcon}</span>
            {props.children}
            <span className="icon-right">{props.rightIcon}</span>
        </a>
    );
}

export default function Entete(props) {
    const api_url = "http://127.0.0.1:8000/api/";
    const [celliers, setCelliers] = useState([]); // création d'un state pour les celliers
    useEffect(() => {
        fetchCellierUser(setCelliers);
    }, []);


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
        const celliers = await responseCelliers.json();

        setCelliers(celliers);
    }


    function afficheCelliers() { // fonction qui affiche les celliers
        return celliers.map((cellier) => { // boucle qui parcourt le tableau des celliers avec la propriété quantité pour l'affichage de la donnée
            return (
                <Link to={`/cellier/${cellier.id}`}>
                    <DropdownItem leftIcon={<ChevronIcon />}>{cellier.nom}</DropdownItem>
                </Link>
            );
        });
    }

    return (
        <>
            <Navbar>
                <Link to="/">
                    <img className="entete__logo" src={logoVino} alt="" onClick={"/"} />
                </Link>

                <NavItem icon={<BurgerIcon />}>
                    <DropdownMenu></DropdownMenu>
                </NavItem>
            </Navbar>

            <Outlet />
        </>
    );


    function Navbar(props) {
        return (
            <nav className="navbar">
                <ul className="navbar-nav">{props.children}</ul>
            </nav>
        );
    }

    function NavItem(props) {
        const [open, setOpen] = useState(false);
        const navItemRef = useRef(); // référence pour le nav-item

        useOnClickOutside(navItemRef, () => { // détecter le clic en dehors de l'élément
            setOpen(false);
        });

        return (
            <li className="nav-item" ref={navItemRef}>
                <a href="#" className="icon-buttonMain" onClick={() => setOpen(!open)}>
                    {props.icon}
                </a>

                {open && props.children}
            </li>
        );
    }

    function DropdownMenu() {
        const [activeMenu, setActiveMenu] = useState("main");
        const [menuHeight, setMenuHeight] = useState(null);
        const dropdownRef = useRef(null);
        const user = localStorage.getItem("user");
        const userEmail = localStorage.getItem("user_email");

        useEffect(() => {
            setMenuHeight(dropdownRef.current?.firstChild.offsetHeight + 30);
        }, []);

        function calcHeight(el) {
            const height = el.offsetHeight + 30;
            setMenuHeight(height);
        }


        function DropdownItem(props) {
            return (
                <a
                    href="#"
                    className="menu-item"
                    onClick={() => props.goToMenu && setActiveMenu(props.goToMenu)}
                >
                    <span className="icon-button">{props.leftIcon}</span>
                    {props.children}
                    <span className="icon-right">{props.rightIcon}</span>
                </a>
            );
        }


        return (
            <div className="dropdown" style={{ height: menuHeight }} ref={dropdownRef}>
                <CSSTransition
                    in={activeMenu === "main"}
                    timeout={500}
                    classNames="menu-primary"
                    unmountOnExit
                    onEnter={calcHeight}
                >
                    <div className="menu">
                        {userEmail === "admin@vino.com" ? (
                            <Link to={`/admin`}>
                                <DropdownItem leftIcon={<UserIcon />}>Bonjour {user} </DropdownItem>
                            </Link>
                        ) : (
                            <Link to={`/EspaceMembre`}>
                                <DropdownItem leftIcon={<UserIcon />}>Bonjour {user} </DropdownItem>
                            </Link>
                        )}

                        <DropdownItem
                            leftIcon={<ChevronIcon />}
                            rightIcon={<ChevronIcon />}
                            goToMenu="celliers"
                            onClick
                        >
                            Mes Celliers
                        </DropdownItem>

                        <DropdownItem leftIcon={<BoltIcon />}>
                            {" "}
                            <Form action="/logout" method="POST"><button>Déconnexion</button>  </Form>
                        </DropdownItem>
                    </div>
                </CSSTransition>
                <CSSTransition
                    in={activeMenu === "celliers"}
                    timeout={500}
                    classNames="menu-secondary"
                    unmountOnExit
                    onEnter={calcHeight}
                >
                    <div className="menu">
                        <DropdownItem leftIcon={<ChevronLeftIcon />} goToMenu="main">
                            <h2>Mes Celliers</h2>
                        </DropdownItem>

                        {celliers.length > 0 ? (
                            <ul className="menu__cellier">{afficheCelliers()}</ul>
                        ) : (
                            <p>Aucun cellier trouvé</p>
                        )}

                    </div>
                </CSSTransition>
            </div>
        );
    }
}
