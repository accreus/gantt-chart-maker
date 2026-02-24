import React from "react";
import EditableText from "./EditableText";
import { GanttData, GanttEvent } from "@/types/gantt";

interface GanttChartProps {
  data: GanttData;
  onUpdateData: (data: GanttData) => void;
  chartRef: React.RefObject<HTMLDivElement>;
}

const GanttChart: React.FC<GanttChartProps> = ({
  data,
  onUpdateData,
  chartRef,
}) => {
  const { title, dayLabel, timeSlots, categories, events } = data;

  const totalCols = timeSlots.length;
  const totalRows = categories.reduce((sum, c) => sum + c.rowCount, 0);
  const ROW_HEIGHT = 36;
  const COL_WIDTH = 80;
  const TITLE_WIDTH = 60;
  const CAT_WIDTH = 60;
  const LABEL_WIDTH = TITLE_WIDTH + CAT_WIDTH;
  const HEADER_HEIGHT = 40;

  const updateEvent = (id: string, updates: Partial<GanttEvent>) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index] = value;
    onUpdateData({ ...data, timeSlots: newSlots });
  };

  const updateCategoryName = (id: string, name: string) => {
    onUpdateData({
      ...data,
      categories: data.categories.map((c) =>
        c.id === id ? { ...c, name } : c,
      ),
    });
  };

  // Calculate row offsets per category
  let rowOffset = 0;
  const categoryOffsets: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryOffsets[cat.id] = rowOffset;
    rowOffset += cat.rowCount;
  });

  const chartWidth = LABEL_WIDTH + totalCols * COL_WIDTH;
  const chartHeight = HEADER_HEIGHT + totalRows * ROW_HEIGHT;

  return (
    <div
      ref={chartRef}
      className="relative overflow-hidden"
      style={{
        width: chartWidth,
        height: chartHeight,
        backgroundColor: "hsl(var(--gantt-bg))",
        border: "4px solid hsl(var(--gantt-grid))",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Checkered corner patterns */}
      <div
        className="absolute top-0 right-0 w-12 h-12 opacity-30"
        style={{
          backgroundImage: `repeating-conic-gradient(hsl(var(--gantt-grid)) 0% 25%, transparent 0% 50%)`,
          backgroundSize: "8px 8px",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-12 h-12 opacity-30"
        style={{
          backgroundImage: `repeating-conic-gradient(hsl(var(--gantt-grid)) 0% 25%, transparent 0% 50%)`,
          backgroundSize: "8px 8px",
        }}
      />

      {/* Time header */}
      <div
        className="absolute top-0 flex items-center"
        style={{ left: LABEL_WIDTH, height: HEADER_HEIGHT }}
      >
        {timeSlots.map((slot, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center font-body text-xs font-semibold italic"
            style={{
              left: i * COL_WIDTH - COL_WIDTH / 2,
              width: COL_WIDTH,
              height: HEADER_HEIGHT,
              color: "hsl(var(--gantt-text))",
              fontSize: "calc(12px * var(--gantt-font-scale))",
            }}
          >
            <EditableText
              value={slot}
              onChange={(v) => updateTimeSlot(i, v)}
              className="text-center text-xs font-semibold italic"
              style={{
                color: "hsl(var(--gantt-text))",
                fontSize: "calc(12px * var(--gantt-font-scale))",
              }}
            />
          </div>
        ))}
      </div>

      {/* Left title column — PRAKARSH '26 spanning full height */}
      <div
        className="absolute top-0 left-0 flex flex-col"
        style={{
          width: TITLE_WIDTH,
          height: chartHeight,
          borderRight: "3px solid hsl(var(--gantt-grid))",
        }}
      >
        {/* Day label in the header area */}
        <div
          className="flex items-center justify-center font-display"
          style={{
            height: HEADER_HEIGHT,
            fontSize: "0px",
            color: "hsl(var(--gantt-text))",
            fontStyle: "italic",
          }}
        >
          <EditableText
            value={dayLabel}
            onChange={(v) => onUpdateData({ ...data, dayLabel: v })}
            className="font-display text-sm"
            style={{
              color: "hsl(var(--gantt-text))",
              fontSize: "calc(12px * var(--gantt-font-scale))",
            }}
          />
        </div>
        {/* Vertical main title */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="font-display tracking-widest"
            style={{
              writingMode: "vertical-lr",
              transform: "rotate(180deg)",
              fontSize: "calc(38px * var(--gantt-font-scale))",
              color: "hsl(var(--gantt-text))",
              letterSpacing: "4px",
            }}
          >
            <EditableText
              value={title}
              onChange={(v) => onUpdateData({ ...data, title: v })}
              className="font-display"
              style={{
                color: "hsl(var(--gantt-text))",
                fontSize: "calc(38px * var(--gantt-font-scale))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Category labels — one per category, positioned next to its rows */}
      {categories.map((cat) => {
        const offset = categoryOffsets[cat.id];
        const catTop = HEADER_HEIGHT + offset * ROW_HEIGHT;
        const catHeight = cat.rowCount * ROW_HEIGHT;
        return (
          <div
            key={`cat-label-${cat.id}`}
            className="absolute flex items-center justify-center"
            style={{
              left: TITLE_WIDTH,
              top: catTop,
              width: CAT_WIDTH,
              height: catHeight,
              borderRight: "3px solid hsl(var(--gantt-grid))",
              borderBottom: "3px solid hsl(var(--gantt-grid))",
            }}
          >
            <div
              className="font-display tracking-wider"
              style={{
                writingMode: "vertical-lr",
                transform: "rotate(180deg)",
                fontSize: "calc(22px * var(--gantt-font-scale))",
                color: "hsl(var(--gantt-text))",
              }}
            >
              <EditableText
                value={cat.name}
                onChange={(v) => updateCategoryName(cat.id, v)}
                className="font-display"
                style={{
                  color: "hsl(var(--gantt-text))",
                  fontSize: "calc(22px * var(--gantt-font-scale))",
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Grid lines - horizontal */}
      {Array.from({ length: totalRows + 1 }).map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute"
          style={{
            left: LABEL_WIDTH,
            top: HEADER_HEIGHT + i * ROW_HEIGHT,
            width: totalCols * COL_WIDTH,
            height: 1,
            backgroundColor: "hsl(var(--gantt-grid))",
          }}
        />
      ))}

      {/* Grid lines - vertical */}
      {Array.from({ length: totalCols + 1 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute"
          style={{
            left: LABEL_WIDTH + i * COL_WIDTH,
            top: HEADER_HEIGHT,
            width: 1,
            height: totalRows * ROW_HEIGHT,
            backgroundColor: "hsl(var(--gantt-grid))",
          }}
        />
      ))}

      {/* Category dividers on grid area */}
      {categories.map((cat, idx) => {
        if (idx === 0) return null;
        const offset = categoryOffsets[cat.id];
        return (
          <div
            key={cat.id}
            className="absolute"
            style={{
              left: LABEL_WIDTH,
              top: HEADER_HEIGHT + offset * ROW_HEIGHT,
              width: totalCols * COL_WIDTH,
              height: 3,
              backgroundColor: "hsl(var(--gantt-grid))",
            }}
          />
        );
      })}

      {/* Events */}
      {events.map((event) => {
        const catOffset = categoryOffsets[event.category] ?? 0;
        const absRow = catOffset + event.row;
        const left = LABEL_WIDTH + event.startCol * COL_WIDTH;
        const width = (event.endCol - event.startCol + 1) * COL_WIDTH;
        const top = HEADER_HEIGHT + absRow * ROW_HEIGHT + 4;

        return (
          <div
            key={event.id}
            className="absolute flex items-center px-3 rounded-full overflow-hidden"
            style={{
              left,
              top,
              width,
              height: ROW_HEIGHT - 8,
              backgroundColor: event.color,
              cursor: "pointer",
            }}
          >
            <EditableText
              value={event.name}
              onChange={(v) => updateEvent(event.id, { name: v })}
              className="text-xs font-bold uppercase tracking-wide truncate w-full"
              style={{
                color: "hsl(var(--primary-foreground))",
                fontSize: "calc(12px * var(--gantt-font-scale))",
              }}
            />
          </div>
        );
      })}

      {/* Border decorations */}
      <div
        className="absolute top-0 left-0 w-full"
        style={{ height: 3, backgroundColor: "hsl(330, 60%, 82%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{ height: 3, backgroundColor: "hsl(330, 60%, 82%)" }}
      />
      <div
        className="absolute top-0 left-0 h-full"
        style={{ width: 3, backgroundColor: "hsl(330, 60%, 82%)" }}
      />
      <div
        className="absolute top-0 right-0 h-full"
        style={{ width: 3, backgroundColor: "hsl(330, 60%, 82%)" }}
      />
    </div>
  );
};

export default GanttChart;
