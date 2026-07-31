import {
    Livewire,
    Alpine,
} from "../../vendor/livewire/livewire/dist/livewire.esm";
import "./push";
import calendar from "./calendar";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling
import "tippy.js/animations/scale.css";
import flatpickr from "flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect/index.js";

window.tippy = tippy;
window.flatpickr = flatpickr;
window.monthSelectPlugin = monthSelectPlugin;

Alpine.data("taskCalendar", calendar);
Livewire.start();
