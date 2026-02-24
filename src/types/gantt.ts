export interface GanttEvent {
  id: string;
  name: string;
  startCol: number; // 0-indexed column
  endCol: number;   // 0-indexed column (inclusive)
  row: number;      // which row within the category
  color: string;    // hex or hsl color
  category: string;
}

export interface GanttCategory {
  id: string;
  name: string;
  rowCount: number;
}

export interface GanttData {
  title: string;
  dayLabel: string;
  timeSlots: string[];
  categories: GanttCategory[];
  events: GanttEvent[];
}

export const EVENT_COLORS = [
  { name: "Pink", value: "hsl(330, 70%, 75%)" },
  { name: "Purple", value: "hsl(270, 40%, 72%)" },
  { name: "Mint", value: "hsl(165, 40%, 72%)" },
  { name: "Orange", value: "hsl(25, 70%, 75%)" },
  { name: "Lavender", value: "hsl(260, 50%, 80%)" },
  { name: "Peach", value: "hsl(15, 80%, 80%)" },
  { name: "Hot Pink", value: "hsl(330, 80%, 65%)" },
  { name: "Teal", value: "hsl(175, 45%, 65%)" },
];

export const DEFAULT_DATA: GanttData = {
  title: "PRAKARSH '26",
  dayLabel: "DAY-1",
  timeSlots: [
    "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "1:00", "1:30", "2:00", "2:30",
    "3:00", "3:30", "4:00", "4:30", "5:00", "5:30"
  ],
  categories: [
    { id: "cat1", name: "TECH", rowCount: 5 },
    { id: "cat2", name: "NON - TECH", rowCount: 10 },
  ],
  events: [
    { id: "e1", name: "HIGH ON HOGWARTS", startCol: 6, endCol: 12, row: 0, color: "hsl(330, 70%, 75%)", category: "cat1" },
    { id: "e2", name: "BOX CRICKET", startCol: 13, endCol: 17, row: 1, color: "hsl(165, 40%, 72%)", category: "cat1" },
    { id: "e3", name: "Stranger Things: The Upside-Down Quest", startCol: 3, endCol: 10, row: 2, color: "hsl(25, 70%, 75%)", category: "cat1" },
    { id: "e4", name: "IPL AUCTION", startCol: 7, endCol: 10, row: 3, color: "hsl(260, 50%, 80%)", category: "cat1" },
    { id: "e5", name: "TIMBER TITANS", startCol: 12, endCol: 17, row: 4, color: "hsl(15, 80%, 80%)", category: "cat1" },
    { id: "e6", name: "HUMAN FOOSBALL", startCol: 1, endCol: 11, row: 0, color: "hsl(270, 40%, 72%)", category: "cat2" },
    { id: "e7", name: "COMMANDO FITNESS", startCol: 1, endCol: 12, row: 1, color: "hsl(330, 70%, 75%)", category: "cat2" },
    { id: "e8", name: "RC RUSH", startCol: 1, endCol: 8, row: 2, color: "hsl(25, 70%, 75%)", category: "cat2" },
    { id: "e9", name: "HUMAN LUDO", startCol: 2, endCol: 17, row: 3, color: "hsl(15, 80%, 80%)", category: "cat2" },
    { id: "e10", name: "BECH KE DIKHA", startCol: 1, endCol: 14, row: 4, color: "hsl(175, 45%, 65%)", category: "cat2" },
    { id: "e11", name: "UNBOUND: THE CREATIVE ARTS", startCol: 1, endCol: 13, row: 5, color: "hsl(330, 80%, 65%)", category: "cat2" },
    { id: "e12", name: "FREEFIRE MAX CUP", startCol: 1, endCol: 15, row: 6, color: "hsl(270, 40%, 72%)", category: "cat2" },
    { id: "e13", name: "BGMI TOURNAMENT", startCol: 1, endCol: 13, row: 7, color: "hsl(25, 70%, 75%)", category: "cat2" },
    { id: "e14", name: "VALORANT CHAMPIONSHIP", startCol: 1, endCol: 17, row: 8, color: "hsl(175, 45%, 65%)", category: "cat2" },
  ],
};
