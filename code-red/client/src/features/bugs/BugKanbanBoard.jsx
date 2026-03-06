import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const statuses = [
  { id: "open", label: "Open" },
  { id: "in-progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

const getBugId = (bug) => bug._id || bug.id;

function SortableBugCard({ bug }) {
  const bugId = getBugId(bug);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: `bug:${bugId}`,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...attributes}
      {...listeners}
    >
      <h4>{bug.title}</h4>
      <div className="kanban-card-meta">
        <span className={`status-pill ${bug.priority}`}>{bug.priority}</span>
        <span className={`status-pill ${bug.severity}`}>
          sev: {bug.severity}
        </span>
      </div>
    </article>
  );
}

function DroppableColumn({ statusId, label, bugs }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${statusId}`,
  });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "is-over" : ""}`}
    >
      <header>
        <h3>{label}</h3>
        <span>{bugs.length}</span>
      </header>

      <SortableContext
        items={bugs.map((bug) => `bug:${getBugId(bug)}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="kanban-card-list">
          {bugs.map((bug) => (
            <SortableBugCard key={getBugId(bug)} bug={bug} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export default function BugKanbanBoard({ bugs, onStatusChange }) {
  const groupedBugs = statuses.reduce((accumulator, column) => {
    accumulator[column.id] = bugs.filter((bug) => bug.status === column.id);
    return accumulator;
  }, {});

  const handleDragEnd = ({ active, over }) => {
    if (!active || !over) {
      return;
    }

    const activeBugId = String(active.id).replace("bug:", "");
    const movingBug = bugs.find((bug) => getBugId(bug) === activeBugId);

    if (!movingBug) {
      return;
    }

    let targetStatus = null;
    const overId = String(over.id);

    if (overId.startsWith("column:")) {
      targetStatus = overId.replace("column:", "");
    } else if (overId.startsWith("bug:")) {
      const overBugId = overId.replace("bug:", "");
      const overBug = bugs.find((bug) => getBugId(bug) === overBugId);
      targetStatus = overBug?.status || null;
    }

    if (targetStatus && targetStatus !== movingBug.status) {
      onStatusChange(activeBugId, targetStatus);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="kanban-grid">
        {statuses.map((column) => (
          <DroppableColumn
            key={column.id}
            statusId={column.id}
            label={column.label}
            bugs={groupedBugs[column.id] || []}
          />
        ))}
      </div>
    </DndContext>
  );
}
