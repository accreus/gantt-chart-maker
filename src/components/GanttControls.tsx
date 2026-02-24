import React, { useState, useEffect, useMemo } from "react";
import { GanttData, GanttEvent, EVENT_COLORS } from "@/types/gantt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Download, Image } from "lucide-react";
import { toPng, toSvg, toJpeg } from "html-to-image";

interface GanttControlsProps {
  data: GanttData;
  onUpdateData: (data: GanttData) => void;
  chartRef: React.RefObject<HTMLDivElement>;
}

const THEME_STORAGE_KEY = "gantt-theme";
const FONT_SIZE_STORAGE_KEY = "gantt-font-size";
const CHART_FONT_SCALE_STORAGE_KEY = "gantt-chart-font-scale";
const THEME_PRESET_STORAGE_KEY = "gantt-theme-preset";

const parseHsl = (value: string) => {
  const matches = value.match(/[-\d.]+/g);
  if (!matches || matches.length < 3) return null;
  const [h, s, l] = matches.map(Number);
  if ([h, s, l].some((n) => Number.isNaN(n))) return null;
  return { h, s, l };
};

const hslToHex = (h: number, s: number, l: number) => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string) => {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const buildPreset = (
  name: string,
  colors: {
    background: string;
    card: string;
    primary: string;
    secondary: string;
    accent: string;
    foreground: string;
  },
) => {
  const { background, card, primary, secondary, accent, foreground } = colors;
  return {
    name,
    values: {
      "--background": background,
      "--foreground": foreground,
      "--card": card,
      "--card-foreground": foreground,
      "--popover": card,
      "--popover-foreground": foreground,
      "--primary": primary,
      "--primary-foreground": background,
      "--secondary": secondary,
      "--secondary-foreground": background,
      "--accent": accent,
      "--accent-foreground": background,
      "--muted": card,
      "--muted-foreground": foreground,
      "--border": secondary,
      "--input": secondary,
      "--ring": primary,
      "--gantt-bg": background,
      "--gantt-grid": secondary,
      "--gantt-text": foreground,
    },
  };
};

const GanttControls: React.FC<GanttControlsProps> = ({
  data,
  onUpdateData,
  chartRef,
}) => {
  const [newEventName, setNewEventName] = useState("New Event");
  const [newStartCol, setNewStartCol] = useState(0);
  const [newEndCol, setNewEndCol] = useState(3);
  const [newRow, setNewRow] = useState(0);
  const [newColor, setNewColor] = useState(EVENT_COLORS[0].value);
  const [newCategory, setNewCategory] = useState(data.categories[0]?.id || "");
  const [themeColors, setThemeColors] = useState<Record<string, string>>({});
  const [defaultTheme, setDefaultTheme] = useState<Record<string, string>>({});
  const [fontSize, setFontSize] = useState(16);
  const [chartFontScale, setChartFontScale] = useState(1);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = useMemo(
    () => [
      buildPreset("Palette 1", {
        background: "#fbf5ef",
        card: "#f2d3ab",
        primary: "#c69fa5",
        secondary: "#8b6d9c",
        accent: "#494d7e",
        foreground: "#272744",
      }),
      buildPreset("Palette 2", {
        background: "#2a173b",
        card: "#3f2c5f",
        primary: "#443f7b",
        secondary: "#4c5c87",
        accent: "#69809e",
        foreground: "#95c5ac",
      }),
      buildPreset("Palette 3", {
        background: "#150e10",
        card: "#272739",
        primary: "#393849",
        secondary: "#3b4152",
        accent: "#4f5a64",
        foreground: "#77888c",
      }),
      buildPreset("Palette 4", {
        background: "#313638",
        card: "#574729",
        primary: "#975330",
        secondary: "#c57938",
        accent: "#ffad3b",
        foreground: "#ffe596",
      }),
    ],
    [],
  );

  const themeOptions = useMemo(
    () => [
      { label: "Background", varName: "--background" },
      { label: "Font Color", varName: "--foreground" },
      { label: "Primary", varName: "--primary" },
      { label: "Secondary", varName: "--secondary" },
      { label: "Accent", varName: "--accent" },
      { label: "Card", varName: "--card" },
      { label: "Border", varName: "--border" },
      { label: "Chart Background", varName: "--gantt-bg" },
      { label: "Chart Grid", varName: "--gantt-grid" },
      { label: "Chart Text", varName: "--gantt-text" },
    ],
    [],
  );

  useEffect(() => {
    const root = document.documentElement;
    const readTheme = () =>
      themeOptions.reduce<Record<string, string>>((acc, option) => {
        const raw = getComputedStyle(root)
          .getPropertyValue(option.varName)
          .trim();
        const parsed = parseHsl(raw);
        acc[option.varName] = parsed
          ? hslToHex(parsed.h, parsed.s, parsed.l)
          : "#ffffff";
        return acc;
      }, {});

    const defaults = readTheme();
    setDefaultTheme(defaults);

    const baseFontSizeRaw = getComputedStyle(root)
      .getPropertyValue("--font-size-base")
      .trim();
    const baseFontSize = parseFloat(baseFontSizeRaw) || 16;
    const chartScaleRaw = getComputedStyle(root)
      .getPropertyValue("--gantt-font-scale")
      .trim();
    const baseChartScale = parseFloat(chartScaleRaw) || 1;

    const storedFontSize = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    const storedChartScale = localStorage.getItem(CHART_FONT_SCALE_STORAGE_KEY);

    const nextFontSize = storedFontSize
      ? parseFloat(storedFontSize) || baseFontSize
      : baseFontSize;
    const nextChartScale = storedChartScale
      ? parseFloat(storedChartScale) || baseChartScale
      : baseChartScale;

    root.style.setProperty("--font-size-base", `${nextFontSize}px`);
    root.style.setProperty("--gantt-font-scale", `${nextChartScale}`);
    setFontSize(nextFontSize);
    setChartFontScale(nextChartScale);

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, string>;
      applyTheme(parsed, false);
      setThemeColors({ ...defaults, ...parsed });
    } else {
      setThemeColors(defaults);
    }

    const storedPreset = localStorage.getItem(THEME_PRESET_STORAGE_KEY);
    if (storedPreset) {
      setActivePreset(storedPreset);
    }
  }, [themeOptions]);

  const applyTheme = (colors: Record<string, string>, persist = true) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([varName, hex]) => {
      const { h, s, l } = hexToHsl(hex);
      root.style.setProperty(varName, `${h} ${s}% ${l}%`);
    });
    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors));
    }
  };

  const updateThemeColor = (varName: string, hex: string) => {
    const next = { ...themeColors, [varName]: hex };
    setThemeColors(next);
    applyTheme(next);
    setActivePreset(null);
    localStorage.removeItem(THEME_PRESET_STORAGE_KEY);
  };

  const resetTheme = () => {
    applyTheme(defaultTheme);
    setThemeColors(defaultTheme);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(THEME_PRESET_STORAGE_KEY);
    setActivePreset(null);
  };

  const applyPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (!preset) return;
    applyTheme(preset.values);
    setThemeColors((prev) => ({
      ...prev,
      ...themeOptions.reduce<Record<string, string>>((acc, option) => {
        const nextValue = preset.values[option.varName];
        if (nextValue) acc[option.varName] = nextValue;
        return acc;
      }, {}),
    }));
    localStorage.setItem(THEME_PRESET_STORAGE_KEY, presetName);
    setActivePreset(presetName);
  };

  const updateFontSize = (value: number) => {
    const next = Math.min(22, Math.max(12, value));
    setFontSize(next);
    document.documentElement.style.setProperty("--font-size-base", `${next}px`);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, `${next}`);
  };

  const updateChartFontScale = (value: number) => {
    const next = Math.min(1.6, Math.max(0.7, value));
    setChartFontScale(next);
    document.documentElement.style.setProperty("--gantt-font-scale", `${next}`);
    localStorage.setItem(CHART_FONT_SCALE_STORAGE_KEY, `${next}`);
  };

  const addTimeSlot = () => {
    onUpdateData({ ...data, timeSlots: [...data.timeSlots, "0:00"] });
  };

  const removeTimeSlot = () => {
    if (data.timeSlots.length > 1) {
      onUpdateData({ ...data, timeSlots: data.timeSlots.slice(0, -1) });
    }
  };

  const addRow = (categoryId: string) => {
    onUpdateData({
      ...data,
      categories: data.categories.map((c) =>
        c.id === categoryId ? { ...c, rowCount: c.rowCount + 1 } : c,
      ),
    });
  };

  const removeRow = (categoryId: string) => {
    const cat = data.categories.find((c) => c.id === categoryId);
    if (cat && cat.rowCount > 1) {
      onUpdateData({
        ...data,
        categories: data.categories.map((c) =>
          c.id === categoryId ? { ...c, rowCount: c.rowCount - 1 } : c,
        ),
      });
    }
  };

  const addEvent = () => {
    const id = `e_${Date.now()}`;
    const event: GanttEvent = {
      id,
      name: newEventName,
      startCol: newStartCol,
      endCol: newEndCol,
      row: newRow,
      color: newColor,
      category: newCategory,
    };
    onUpdateData({ ...data, events: [...data.events, event] });
  };

  const removeEvent = (id: string) => {
    onUpdateData({ ...data, events: data.events.filter((e) => e.id !== id) });
  };

  const updateEventColor = (id: string, color: string) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) => (e.id === id ? { ...e, color } : e)),
    });
  };

  const updateEventName = (id: string, name: string) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) => (e.id === id ? { ...e, name } : e)),
    });
  };

  const updateEventCategory = (id: string, category: string) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) => (e.id === id ? { ...e, category } : e)),
    });
  };

  const updateEventTiming = (id: string, startCol: number, endCol: number) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) =>
        e.id === id ? { ...e, startCol, endCol } : e,
      ),
    });
  };

  const updateEventRow = (id: string, row: number) => {
    onUpdateData({
      ...data,
      events: data.events.map((e) => (e.id === id ? { ...e, row } : e)),
    });
  };

  const addCategory = () => {
    const id = `cat_${Date.now()}`;
    onUpdateData({
      ...data,
      categories: [
        ...data.categories,
        { id, name: "New Category", rowCount: 3 },
      ],
    });
  };

  const removeCategory = (id: string) => {
    onUpdateData({
      ...data,
      categories: data.categories.filter((c) => c.id !== id),
      events: data.events.filter((e) => e.category !== id),
    });
  };

  const exportChart = async (format: "png" | "svg" | "jpeg") => {
    if (!chartRef.current) return;
    const scale = 4; // 4K resolution
    const backgroundColor = getComputedStyle(chartRef.current).backgroundColor;
    const options = {
      quality: 1,
      pixelRatio: scale,
      backgroundColor,
    };

    try {
      let dataUrl: string;
      if (format === "png") dataUrl = await toPng(chartRef.current, options);
      else if (format === "svg")
        dataUrl = await toSvg(chartRef.current, options);
      else dataUrl = await toJpeg(chartRef.current, options);

      const link = document.createElement("a");
      link.download = `gantt-chart.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="h-full w-full min-w-0 space-y-4 p-4 bg-card rounded-lg border border-border overflow-y-auto">
      <h2 className="font-display text-2xl text-foreground tracking-wide">
        Controls
      </h2>

      {/* Export */}
      <div className="space-y-2">
        <h3 className="font-body text-sm font-semibold text-foreground">
          Export
        </h3>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => exportChart("png")}
            className="bg-primary text-primary-foreground"
          >
            <Image className="w-3 h-3 mr-1" /> PNG
          </Button>
          <Button
            size="sm"
            onClick={() => exportChart("svg")}
            className="bg-secondary text-secondary-foreground"
          >
            <Download className="w-3 h-3 mr-1" /> SVG
          </Button>
          <Button
            size="sm"
            onClick={() => exportChart("jpeg")}
            className="bg-accent text-accent-foreground"
          >
            <Image className="w-3 h-3 mr-1" /> JPEG
          </Button>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <h3 className="font-body text-sm font-semibold text-foreground">
            Theme
          </h3>
          <Button size="sm" variant="outline" onClick={resetTheme}>
            Reset
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                size="sm"
                variant={activePreset === preset.name ? "default" : "outline"}
                onClick={() => applyPreset(preset.name)}
                className="justify-start"
              >
                <span
                  className="mr-2 inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: preset.values["--primary"] }}
                />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
            <span className="text-xs text-muted-foreground">Font Size</span>
            <Input
              type="number"
              min={12}
              max={22}
              step={1}
              value={fontSize}
              onChange={(e) => updateFontSize(Number(e.target.value))}
              className="h-7 w-16 text-xs text-right"
            />
          </label>
          <label className="flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1">
            <span className="text-xs text-muted-foreground">
              Chart Font Scale
            </span>
            <Input
              type="number"
              min={0.7}
              max={1.6}
              step={0.1}
              value={chartFontScale}
              onChange={(e) => updateChartFontScale(Number(e.target.value))}
              className="h-7 w-16 text-xs text-right"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {themeOptions.map((option) => (
            <label
              key={option.varName}
              className="flex items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 px-2 py-1"
            >
              <span className="text-xs text-muted-foreground">
                {option.label}
              </span>
              <input
                type="color"
                value={themeColors[option.varName] || "#ffffff"}
                onChange={(e) =>
                  updateThemeColor(option.varName, e.target.value)
                }
                className="h-7 w-10 rounded border border-input bg-background p-0.5"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        <h3 className="font-body text-sm font-semibold text-foreground">
          Time Slots ({data.timeSlots.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addTimeSlot}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
          <Button size="sm" variant="outline" onClick={removeTimeSlot}>
            <Trash2 className="w-3 h-3 mr-1" /> Remove Last
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="font-body text-sm font-semibold text-foreground">
          Categories & Rows
        </h3>
        {data.categories.map((cat) => (
          <div
            key={cat.id}
            className="space-y-2 p-2 bg-muted/30 rounded-md border border-border/50"
          >
            <div className="flex items-center justify-between">
              <span className="font-body text-sm font-medium text-foreground">
                {cat.name || cat.id}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCategory(cat.id)}
                className="h-5 px-1 text-destructive"
              >
                ✕
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">Rows:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeRow(cat.id)}
                className="h-7 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                min="1"
                value={cat.rowCount}
                onChange={(e) => {
                  const newCount = Math.max(1, parseInt(e.target.value) || 1);
                  onUpdateData({
                    ...data,
                    categories: data.categories.map((c) =>
                      c.id === cat.id ? { ...c, rowCount: newCount } : c,
                    ),
                  });
                }}
                className="h-7 w-16 text-center text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addRow(cat.id)}
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={addCategory}
          className="w-full"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Category
        </Button>
      </div>

      {/* Add Event */}
      <div className="space-y-2 border-t border-border pt-3">
        <h3 className="font-body text-sm font-semibold text-foreground">
          Add Event
        </h3>
        <Input
          value={newEventName}
          onChange={(e) => setNewEventName(e.target.value)}
          placeholder="Event name"
          className="text-xs h-8"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Start Time</label>
            <select
              value={newStartCol}
              onChange={(e) => setNewStartCol(Number(e.target.value))}
              className="w-full h-8 text-xs rounded border border-input bg-background px-2"
            >
              {data.timeSlots.map((slot, i) => (
                <option key={i} value={i}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">End Time</label>
            <select
              value={newEndCol}
              onChange={(e) => setNewEndCol(Number(e.target.value))}
              className="w-full h-8 text-xs rounded border border-input bg-background px-2"
            >
              {data.timeSlots.map((slot, i) => (
                <option key={i} value={i}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Row</label>
            <Input
              type="number"
              value={newRow}
              min={0}
              onChange={(e) => setNewRow(Number(e.target.value))}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-8 text-xs rounded border border-input bg-background px-2"
            >
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Color</label>
          <div className="flex gap-1 flex-wrap mt-1">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNewColor(c.value)}
                className="w-6 h-6 rounded-full border-2 transition-transform"
                style={{
                  backgroundColor: c.value,
                  borderColor:
                    newColor === c.value ? "hsl(270, 30%, 35%)" : "transparent",
                  transform: newColor === c.value ? "scale(1.2)" : "scale(1)",
                }}
                title={c.name}
              />
            ))}
          </div>
        </div>
        <Button
          size="sm"
          onClick={addEvent}
          className="w-full bg-primary text-primary-foreground"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Event
        </Button>
      </div>

      {/* Event List */}
      <div className="space-y-2 border-t border-border pt-3">
        <h3 className="font-body text-sm font-semibold text-foreground">
          Events ({data.events.length})
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {data.events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 p-2 bg-muted rounded text-xs"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              <Input
                value={event.name}
                onChange={(e) => updateEventName(event.id, e.target.value)}
                className="h-6 text-xs flex-1"
              />
              <select
                value={event.color}
                onChange={(e) => updateEventColor(event.id, e.target.value)}
                className="h-6 text-xs rounded border border-input bg-background px-1"
              >
                {EVENT_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={event.category}
                onChange={(e) => updateEventCategory(event.id, e.target.value)}
                className="h-6 text-xs rounded border border-input bg-background px-1"
              >
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                value={event.row}
                min={0}
                onChange={(e) =>
                  updateEventRow(event.id, Number(e.target.value))
                }
                className="w-12 h-6 text-xs"
              />
              <select
                value={event.startCol}
                onChange={(e) =>
                  updateEventTiming(
                    event.id,
                    Number(e.target.value),
                    event.endCol,
                  )
                }
                className="h-6 text-xs rounded border border-input bg-background px-1"
              >
                {data.timeSlots.map((slot, i) => (
                  <option key={i} value={i}>
                    {slot}
                  </option>
                ))}
              </select>
              <select
                value={event.endCol}
                onChange={(e) =>
                  updateEventTiming(
                    event.id,
                    event.startCol,
                    Number(e.target.value),
                  )
                }
                className="h-6 text-xs rounded border border-input bg-background px-1"
              >
                {data.timeSlots.map((slot, i) => (
                  <option key={i} value={i}>
                    {slot}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeEvent(event.id)}
                className="h-6 px-1 text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GanttControls;
