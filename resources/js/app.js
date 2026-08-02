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

// Livewireが自動起動する前にAlpineのコンポーネントを登録する
document.addEventListener('livewire:init', () => {
    window.Alpine.data("taskCalendar", calendar);
});
