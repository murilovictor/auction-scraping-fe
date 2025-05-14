import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
    secure: false
  },
  {
    id: 2,
    title: "Leilões",
    path: "/auction-list",
    newTab: true,
    secure: true,
  }
];
export default menuData;
