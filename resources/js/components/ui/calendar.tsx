"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import "react-day-picker/style.css"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-4 sm:p-6 w-full flex justify-center", className)}>
      <style dangerouslySetInnerHTML={{__html: `
        .rdp-root {
          --rdp-day-height: 3rem;
          --rdp-day-width: 3rem;
          --rdp-day_button-height: 3rem;
          --rdp-day_button-width: 3rem;
          --rdp-accent-color: #16a34a; /* green-600 */
          --rdp-accent-background-color: #dcfce7; /* green-100 */
          width: 100%;
        }
        .rdp-month_grid {
          width: 100%;
          table-layout: fixed;
        }
        .rdp-weekday {
          font-weight: 600;
          font-size: 1.1rem;
          padding-bottom: 1rem;
          color: #6b7280;
        }
        .rdp-day_button {
          font-size: 1.25rem;
          border-radius: 0.5rem;
          width: 100%;
          height: 100%;
          aspect-ratio: 1 / 1;
        }
        .rdp-day {
          padding: 0.25rem;
        }
        .rdp-today .rdp-day_button {
          background-color: #dcfce7;
          color: #14532d;
          font-weight: 700;
        }
        .dark .rdp-today .rdp-day_button {
          background-color: rgba(22, 163, 74, 0.2);
          color: #86efac;
        }
        .rdp-caption_label {
          font-size: 1.5rem;
          font-weight: 600;
        }
        @media (min-width: 640px) {
          .rdp-root {
            --rdp-day-height: 4rem;
            --rdp-day-width: 4rem;
            --rdp-day_button-height: 4rem;
            --rdp-day_button-width: 4rem;
          }
        }
        @media (min-width: 1024px) {
          .rdp-root {
            --rdp-day-height: 5.5rem;
            --rdp-day-width: 5.5rem;
            --rdp-day_button-height: 5.5rem;
            --rdp-day_button-width: 5.5rem;
          }
          .rdp-day_button {
            font-size: 1.5rem;
          }
        }
      `}} />
      <DayPicker
        locale={es}
        showOutsideDays={showOutsideDays}
        weekStartsOn={1}
        formatters={{
          formatWeekdayName: (weekday) => {
            const days = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
            return days[weekday.getDay()];
          },
        }}
        components={{
          Chevron: ({ orientation }) => {
            if (orientation === "left") return <ChevronLeft className="h-6 w-6" />;
            if (orientation === "right") return <ChevronRight className="h-6 w-6" />;
            return null;
          }
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
