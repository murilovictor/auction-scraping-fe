import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Início",
    path: "/",
    newTab: false,
    secure: false
  },
  {
    id: 2,
    title: "Buscar imóveis",
    path: "/auction-list",
    newTab: true,
    secure: true,
  },
  {
    id: 3,
    title: "Busca no mapa",
    path: "/property-search-map",
    newTab: false,
    secure: false,
  },
];
export default menuData;
