import {
    Livewire,
    Alpine,
} from "../../vendor/livewire/livewire/dist/livewire.esm";
import "./push";
import calendar from "./calendar";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling
import "tippy.js/animations/scale.css";
window.tippy = tippy;

Alpine.data("taskCalendar", calendar);
Livewire.start();
