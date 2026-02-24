import React, { useRef, useState, useEffect } from "react";
import GanttChart from "@/components/GanttChart";
import GanttControls from "@/components/GanttControls";
import { GanttData, DEFAULT_DATA } from "@/types/gantt";
import { Button } from "@/components/ui/button";

interface DayData {
  day: string;
  dayLabel: string;
  title: string;
  timeSlots: string[];
  categories: Array<{ id: string; name: string; rowCount: number }>;
  events: Array<{
    id: string;
    name: string;
    startCol: number;
    endCol: number;
    row: number;
    color: string;
    category: string;
  }>;
}

const Index = () => {
  const [data, setData] = useState<GanttData | null>(null);
  const [days, setDays] = useState<DayData[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load data from data.json
    fetch("/data.json")
      .then((res) => res.json())
      .then((jsonData: { days: DayData[] }) => {
        setDays(jsonData.days);
        if (jsonData.days.length > 0) {
          const firstDay = jsonData.days[0];
          setSelectedCategory(null);
          updateDataForDay(firstDay, null);
        }
      })
      .catch((err) => {
        console.error("Failed to load data.json:", err);
        // Fallback to DEFAULT_DATA
        setData(DEFAULT_DATA);
      });
  }, []);

  const updateDataForDay = (dayData: DayData, categoryId: string | null) => {
    let filteredCategories = dayData.categories;
    let filteredEvents = dayData.events;

    // Filter by selected category if one is selected
    if (categoryId) {
      filteredCategories = dayData.categories.filter(
        (c) => c.id === categoryId,
      );
      filteredEvents = dayData.events.filter((e) => e.category === categoryId);
    }

    setData({
      title: dayData.title,
      dayLabel: dayData.dayLabel,
      timeSlots: dayData.timeSlots,
      categories: filteredCategories,
      events: filteredEvents,
    });
  };

  const switchDay = (index: number) => {
    if (index >= 0 && index < days.length) {
      setCurrentDayIndex(index);
      const dayData = days[index];
      setSelectedCategory(null);
      updateDataForDay(dayData, null);
    }
  };

  const switchCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    const dayData = days[currentDayIndex];
    updateDataForDay(dayData, categoryId);
  };

  const currentDay = days[currentDayIndex];
  const allCategories = currentDay?.categories || [];

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-6 font-body flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 font-body">
      <div className="max-w-[1800px] mx-auto">
        <h1 className="font-display text-4xl text-foreground tracking-wider mb-1">
          Gantt Chart Generator
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Double-click any text on the chart to edit it. Use controls to manage
          events.
        </p>

        {/* Day Navigation */}
        {days.length > 1 && (
          <div className="flex gap-2 mb-4">
            {days.map((day, idx) => (
              <Button
                key={idx}
                onClick={() => switchDay(idx)}
                variant={currentDayIndex === idx ? "default" : "outline"}
                className="font-body"
              >
                {day.day}
              </Button>
            ))}
          </div>
        )}

        {/* Category Filter */}
        {allCategories.length > 1 && (
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => switchCategory(null)}
              variant={selectedCategory === null ? "default" : "outline"}
              className="font-body"
            >
              All Categories
            </Button>
            {allCategories.map((cat) => (
              <Button
                key={cat.id}
                onClick={() => switchCategory(cat.id)}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="font-body"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-6 items-start">
          {/* Chart area */}
          <div className="flex-1 overflow-auto rounded-lg border border-border p-2 bg-card">
            <GanttChart
              data={data}
              onUpdateData={setData}
              chartRef={chartRef}
            />
          </div>

          {/* Controls sidebar */}
          <GanttControls
            data={data}
            onUpdateData={setData}
            chartRef={chartRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
