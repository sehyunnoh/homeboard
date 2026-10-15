import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { columnDropId } from "../utils/columns";

type Props = {
  index: number;
  itemIds: string[];
  isDropTarget: boolean;
  children: React.ReactNode;
};

export function BoardColumn({ index, itemIds, isDropTarget, children }: Props) {
  // 컬럼 아래 빈 공간만 드롭 영역으로 둬서, 컬럼 사이 여백에 놓았을 때 맨 아래로 튀지 않게 한다.
  const { setNodeRef } = useDroppable({ id: columnDropId(index) });

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col px-3 border-r border-slate-200 last:border-r-0 rounded-lg transition-colors ${
        isDropTarget ? "bg-slate-100" : ""
      }`}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <div ref={setNodeRef} className="flex-1 min-h-24" />
    </div>
  );
}
