export type BookmarkLink = {
  id: string;
  type: "link";
  name: string;
  url: string;
  favicon?: string;
};

export type BookmarkFolder = {
  id: string;
  type: "folder";
  name: string;
  isOpen: boolean;
  children: BookmarkItem[];
};

export type BookmarkItem = BookmarkFolder | BookmarkLink;

export type BookmarkTree = {
  version: number;
  tree: BookmarkItem[];
};
