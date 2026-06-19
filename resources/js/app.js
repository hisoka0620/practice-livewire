import {
    Livewire,
    Alpine,
} from "../../vendor/livewire/livewire/dist/livewire.esm";
import "./push";
import calendar from "./calendar";

Alpine.data("taskCalendar", calendar);
Livewire.start();
