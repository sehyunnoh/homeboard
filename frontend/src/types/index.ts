export type BookmarkLink = {
  id: string;
  type: "link";
  name: string;
  url: string;
  favicon?: string;
  textColor?: string;
  bgColor?: string;
};

export type BookmarkFolder = {
  id: string;
  type: "folder";
  name: string;
  isOpen: boolean;
  children: BookmarkItem[];
  textColor?: string;
  bgColor?: string;
};

export type BookmarkItem = BookmarkFolder | BookmarkLink;

export type BookmarkTree = {
  version: number;
  tree: BookmarkItem[];
};
