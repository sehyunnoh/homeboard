export type BookmarkLink = {
  id: string;
  type: "link";
  name: string;
  url: string;
  favicon?: string;
  textColor?: string;
  bgColor?: string;
  fontWeight?: string;
  fontSize?: string;
};

export type BookmarkFolder = {
  id: string;
  type: "folder";
  name: string;
  isOpen: boolean;
  children: BookmarkItem[];
  textColor?: string;
  bgColor?: string;
  fontWeight?: string;
  fontSize?: string;
  pinned?: boolean;
  /** 최상위 폴더가 속한 열 (0 ~ COLUMN_COUNT-1). 열 안의 순서는 tree 배열 순서를 따른다. */
  column?: number;
};

export type BookmarkItem = BookmarkFolder | BookmarkLink;

export type BookmarkTree = {
  version: number;
  tree: BookmarkItem[];
};
