import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-2 relative items-center mb-2",
        caption_label: "text-xs font-black uppercase tracking-[0.2em] text-[#002B49]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-slate-50 p-0 rounded-full text-[#002B49] hover:bg-slate-100 opacity-80 hover:opacity-100 transition-all"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell: "text-slate-400 rounded-md w-9 font-black uppercase tracking-widest text-[8px]",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-bold transition-all rounded-full hover:bg-slate-50 hover:text-[#002B49]"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#03A7E1] text-white hover:bg-[#03A7E1] hover:text-white focus:bg-[#03A7E1] focus:text-white shadow-lg shadow-[#03A7E1]/25 ring-2 ring-[#03A7E1]/20 scale-105 rounded-full",
        day_today: "bg-slate-100 text-[#002B49] font-black rounded-full",
        day_outside:
          "day-outside text-slate-300 opacity-50 aria-selected:bg-[#03A7E1]/50 aria-selected:text-white aria-selected:opacity-30",
        day_disabled: "text-slate-200 opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
