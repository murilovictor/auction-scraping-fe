export type Menu = {
  id: number;
  title: string;
  path?: string;
  newTab: boolean;
  secure: boolean;
  submenu?: Menu[];
};
